import os
from modal import Image, Secret, Stub, method,web_endpoint, asgi_app, enter
from editor.pages.api.dataModels import Document, Metadata, TokenProb, Word
from typing import List, Any, Union, Tuple
import modal
import math

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
    )
    # Use the barebones hf-transfer package for maximum download speeds. No progress bar, but expect 700MB/s.
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_function(
        download_model_to_folder,
        secrets=[Secret.from_name("HUGGINGFACE_API_KEY")],
        timeout=60 * 20,
    )
)

stub = Stub("example-vllm-inference", image=image)

@stub.cls(gpu=modal.gpu.A10g, secrets=[Secret.from_name("HUGGINGFACE_API_KEY")], timeout=60)
class Model:
    def __enter__(self):
        #TODO lots of latency in loading model.
        import time
        t0 = time.time()
        from vllm import LLM
        from transformers import AutoTokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
        self.max_batch_size = 100
        self.llm = LLM(MODEL_DIR)
        
        self.template = """<s>[INST] <<SYS>>
        {system}
        <</SYS>>

        {user} [/INST] """
        print("Time to load model:", time.time() - t0)

    def text_to_ids(self, tokens: Union[List[str], str]) -> List[int]:
        return self.tokenizer.convert_tokens_to_ids(
            self.tokenizer.tokenize(tokens)
        )

    def batch(self, lst: List[Any]) -> List[List[Any]]:
        return [lst[i:i + self.max_batch_size] for i in range(0, len(lst), self.max_batch_size)]

    def balanced_batching(self, lst1: List[List[Any]], lst2: List[List[Any]], target_elm_count : int) -> Tuple[List[List[Any]], List[List[Any]]]:
        #this attempts to distribute the elements in lst1 and lst2 uniformly 
        #where element i+1 in lst1 contains element 0...i in lst1 
        i = 0
        last_split_idx = 0
        count = 0
        elms1, elms2 = [], []
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

    def Split_by_changed_words(self, words: List[Word], document : Document) -> Tuple[List[List[str]], List[List[int]]]:
        '''it takes the word to be replaced and formats it so the model can predict the logprob of the next word, 
        arguable whether this is a good idea, what if the user added a word? or removed a word? then we can't use this method
        '''
        
        tokens_ids = [self.text_to_ids(
                document.text.split()[:word.position]
            ) for word in words]
    
        next_tokens = self.tokenizer.convert_tokens_to_ids([word.string for word in words])
        return self.batch(tokens_ids), self.batch(next_tokens)
        
    def chunk_and_split(self, document: Document) -> Tuple[List[List[str]], List[List[int]]]:
        '''splits the text into i, i+1, i+2, ... i+n chunks and then separates into batches of max_batch_size
        '''

        #TODO this will get extremely inefficient for larger docs with python for loops, try to do this more efficiently
        #TODO implement more dynamic batching techniques, right now we have a uniform split,
        # which is just stupid since the distribution of tokens in the batch are cumulative, 
        # but you need to do way more work to predict the 100+1 token, than the 10+1 token
          
        text = document.text
        token_ids = self.text_to_ids(text)
        n = len(token_ids)

        next_tokens = token_ids[1:] # [token_ids[i] for i in range(1, n)]  # Start from the second token
        chunks = [token_ids[:i+1] for i in range(0, n-1)] # we don't want the last token
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


    def generate(self, document : Document, threshold : float = 0.0001) -> List[TokenProb]:
        assert 0 <= threshold <= 1
        from vllm import SamplingParams
        import time
        import math
        batched_chunks, batched_correct_tokens = self.chunk_and_split(document)


        for batch_chunk, batch_next_token in zip(batched_chunks, batched_correct_tokens):
            
            sampling_params = SamplingParams(
                temperature=0.5,
                top_p=1,
                max_tokens=1, 
                presence_penalty=1,
                logprobs=1000,
            )
            t0 = time.time()
            print("batched_chunks", len(batch_chunk))
            print("batched_correct_tokens", len(batch_next_token))

            results = self.llm.generate(prompt_token_ids = batch_chunk, sampling_params = sampling_params)
            print("took", time.time()-t0)
            TokenProbs = []
            found = False
            for i in range(len(results)):
              outputs = results[i].outputs[0]
              logprobdict = outputs.logprobs[0]
              token_ids = list(logprobdict.keys())
              prob_values = list(logprobdict.values())
              correct_token_id = batch_next_token[i]
              for j in range(len(token_ids)):
                 if token_ids[j] == correct_token_id:
                    proba = math.exp(prob_values[j]) # back to reg probs
                    if proba < threshold: # if the prob is too low, we don't want to show it
                        TokenProbs.append(TokenProb(
                            token=self.tokenizer.decode(correct_token_id), 
                            prob=0.0, color=self.value_to_rgba_color(0.0))
                        )
                    else:
                        TokenProbs.append(TokenProb(
                            token=self.tokenizer.decode(correct_token_id), 
                            prob=proba, color=self.value_to_rgba_color(proba))
                        )
                    found = True
                    break
              
              if not found:
                TokenProbs.append(TokenProb(token=self.tokenizer.decode(correct_token_id), prob=0.0))

            yield TokenProbs
    def drop_from_memory(self):
        import gc

        # Assuming `model` is your model instance
        del self.llm
        gc.collect()

        


"""
#TODO enable here
@asgi_app()
def app():
    import fastapi.staticfiles
    from fastapi import FastAPI
    from fastapi.responses import Response

    web_app = FastAPI()

    @web_app.get("/infer/{prompt}")
    async def getLogProbs(prompt: str):
        image_bytes = Model().inference.remote(prompt)

        return Response(image_bytes, media_type="image/png")

    web_app.mount(
        "/", fastapi.staticfiles.StaticFiles(directory="/assets", html=True)
    )

    return web_app """


@stub.local_entrypoint()
def main():
    model = Model()
    Doc = Document(text="This is a test document", metadata=Metadata(title="Test Document", n_tokens=4, n_words=4))
    out = model.generate_logits.remote(Doc)
    print(out)

