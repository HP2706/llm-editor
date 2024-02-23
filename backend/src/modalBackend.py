import os
from modal import Image, Secret, method, gpu, Volume
from src.dataModels import Document, TokenProb
from typing import Generator, List, Any, Union, Tuple
from src.common import stub, vol
from src.utils import build_doc_from_string

MODEL_DIR = "/model"
BASE_MODEL = "microsoft/phi-2" #using phi for faster debugging #"mistralai/Mistral-7B-Instruct-v0.1"

def download_model_to_folder():
    from huggingface_hub import snapshot_download
    from transformers.utils import move_cache

    os.makedirs(MODEL_DIR, exist_ok=True)

    snapshot_download(
        BASE_MODEL,
        local_dir=MODEL_DIR,
        token=os.environ["HF_TOKEN"],
    )
    move_cache()

image = (
    Image.from_registry(
        "nvidia/cuda:12.1.0-base-ubuntu22.04", add_python="3.10"
    )
    .pip_install(
        "vllm",
        "huggingface_hub==0.19.4",
        "hf-transfer==0.1.4",
        "torch==2.1.2",
        "tiktoken",
    )
    # Use the barebones hf-transfer package for maximum download speeds. No progress bar, but expect 700MB/s.
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_function(
        download_model_to_folder,
        secrets=[Secret.from_name("HUGGINGFACE_API_KEY")],
        timeout=60 * 20,
    )
)

with image.imports():
    import time
    from vllm import LLM, SamplingParams # type: ignore
    from transformers import AutoTokenizer
    import gc
    import math



@stub.cls(
    gpu=gpu.A10G(),
    image = image,  
    secrets=[Secret.from_name("HUGGINGFACE_API_KEY")], 
    timeout=60,
    volumes = {"/cache" : vol}
)
class Model:
    def __enter__(self):
        print("\ninitializing Model ______________________")
        t0 = time.time()
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
        self.max_batch_size = 100
        self.llm = LLM(MODEL_DIR)
        print("Time to load model:", time.time() - t0)

    def text_to_ids(self, text: type[str]) -> List[int]:
        return self.tokenizer.convert_tokens_to_ids( # type: ignore
            self.tokenizer.tokenize(text) # type: ignore
        )
  
    def batch(self, lst: List[Any]) -> List[List[Any]]:
        return [lst[i:i + self.max_batch_size] for i in range(0, len(lst), self.max_batch_size)]

    def balanced_batching(self, lst1: List[List[Any]], lst2: List[List[Any]], target_elm_count : int) -> Tuple[List[List[Any]], List[List[Any]]]:
        #this attempts to distribute the elements in lst1 and lst2 uniformly 
        #where element i+1 in lst1 contains element 0...i in lst1 
        i = 0
        last_split_idx = 0
        count = 0
        elms1 = []
        batch1, batch2 = [], []
        while i < len(lst1):
            if len(lst1[i]) + count > target_elm_count:
                batch1.append(elms1)
                batch2.append(lst2[last_split_idx:i-1])
                last_split_idx = i-1

                elms1 = [lst1[i]]
                count = len(lst1[i])  # Reset count to the current list's length
            else:
                elms1.append(lst1[i])
                count += len(lst1[i])
            i += 1

        # After the loop, check if there are any remaining elements in 'elms' and append them to 'batch1'
        if elms1:
            batch1.append(elms1)
            batch2.append(lst2[last_split_idx:i])
        return batch1, batch2
        
    def chunk_and_split(self, document: Document, idx : int = 1) -> Tuple[List[List[str]], List[List[int]]]:
        '''this does not try to predict from the start but from idx-1(we need to predict idx word) to end of document
        args :
        - document : Document
        - idx : int >=1,  the index of the word we want to predict the logprob from and to the end of the document
        '''

        if idx < 1:
            raise ValueError("idx must be >= 1")
        elif idx > document.metadata.n_words:
            raise ValueError("idx must be <= the number of words in the document")

        #TODO this will get extremely inefficient for larger docs with python for loops, try to do this more efficiently
        #TODO implement more dynamic batching techniques, right now we have a uniform split,
        # which is just stupid since the distribution of tokens in the batch are cumulative, 
        # but you need to do way more work to predict the 100+1 token, than the 10+1 token
        
        
        text = document.text
        token_ids = self.text_to_ids(text) # type: ignore
        n = len(token_ids)
        next_tokens = token_ids[idx:]
        chunks = [token_ids[:i+1] for i in range(idx, n-1)] # we don't want the last token
        return self.batch(chunks), self.batch(next_tokens) # batched_token_chunks(tokens as str) batched_next_tokens(token_ids)

    def print_split(self, input : Tuple[List[List[str]], List[List[int]]]) -> None:
        '''prints the ouput of chunk_and_split for debugging'''
        #for debugging
        for batch in range(len(input[0])):
            print("len chunks", len(input[0][batch]))
            print("len nexttokens", len(input[1][batch]))
            for i in range(len(input[0][batch])):
              print("\ninput sequence", input[0][batch][i], "\nthe next token", self.tokenizer.decode(input[1][batch][i]))
              break

    def value_to_rgba_color(self, value: float) -> Tuple[float, float, float, float]:
        """
        Map a float value between 0 and 1 to an RGBA color.
        Transitions from red to green as the value increases.
        
        Parameters:
        - value: A float between 0 and 1.
        
        Returns:
        - A tuple (R, G, B, A) representing the color.
        """
        R = 1 - value  # Red decreases as value increases
        G = value      # Green increases as value increases
        B = 0          # Blue is constant
        A = 1.0        # Full opacity
        return (R, G, B, A)
    


    @method()
    def generate(self, text : str, idx : int, threshold : float = 0.0001) -> Generator[TokenProb, None, None]: # type: ignore
        assert 0 <= threshold <= 1 
        import json
        
        document = build_doc_from_string(text)
        print("\nGENERATING LOGPROBS-----------------------------------")
        #docs = split_doc(500, document) #TODO think about enabling this when for large docs.
        batched_chunks, batched_correct_tokens = self.chunk_and_split(document, idx)
        cached_logprobs = []

        for batch_chunk, batch_next_token in zip(batched_chunks, batched_correct_tokens):
            sampling_params = SamplingParams(
                temperature=0.5,
                top_p=1,
                max_tokens=1, 
                presence_penalty=1,
                logprobs=5000,
            )
            t0 = time.time()
            print("batched_chunks", len(batch_chunk))
            print("batched_correct_tokens", len(batch_next_token))

            results = self.llm.generate(prompt_token_ids = batch_chunk, sampling_params = sampling_params)
            print("took", time.time()-t0)
            TokenProbs : List[TokenProb] = []
            for i in range(len(results)):
                found = False
                logprobdict = results[i].outputs[0].logprobs[0]
                token_ids = list(logprobdict.keys())
                prob_values = list(logprobdict.values())
                correct_token_id = batch_next_token[i]
                for j in range(len(token_ids)):
                    if token_ids[j] == correct_token_id:
                        proba = math.exp(prob_values[j]) # back to reg probs

                        TokenProbs.append(
                            TokenProb(
                                token=self.tokenizer.decode(correct_token_id), 
                                prob=proba if proba > threshold else 0.0, 
                                color=self.value_to_rgba_color(proba)
                            )
                        )


                        found = True
                        break
                
                if not found:
                    TokenProbs.append(TokenProb(
                        token=self.tokenizer.decode(correct_token_id), 
                        prob=0.0, color=self.value_to_rgba_color(0.0))
                    )
            cached_logprobs.extend(TokenProbs)
            yield TokenProbs # type: ignore
        with open("/cache/cached_logprobs.json", "w") as f:
            f.write(json.dumps({"logprobs" : [cached_logprobs.model_dump() for cached_logprobs in cached_logprobs]}))
        vol.commit()
        

    def drop_from_memory(self):

        # Assuming `model` is your model instance
        del self.llm
        gc.collect()






