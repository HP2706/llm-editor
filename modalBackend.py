import os
from modal import Image, Secret, Stub, method,web_endpoint, asgi_app, enter
from editor.pages.api.dataModels import Document, Metadata
from typing import List, Any, Union


MODEL_DIR = "/model"
BASE_MODEL = "mistralai/Mistral-7B-Instruct-v0.1"

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

@stub.cls(gpu="A100", secrets=[Secret.from_name("HUGGINGFACE_API_KEY")], timeout=60)
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

    @method()
    def chunk_and_split(self, document: Document) -> List[Union[List[str], List[List[str]]]]:
        '''splits the text into i, i+1, i+2, ... i+n chunks and then separates into batches of max_batch_size
        #TODO this will get extremely inefficient for larger docs, try to do this more efficiently
        '''
        max_batch_size = self.max_batch_size
        text = document.text
        tokens = self.tokenizer.tokenize(text)
        n = len(tokens)
        next_tokens = [tokens[i] for i in range(1, n)]  # Start from the second token
        tokens_ids = self.tokenizer.convert_tokens_to_ids(tokens)
        chunks = [tokens_ids[:i+1] for i in range(0, n-1)]  
        batched_token_chunks = [
                [self.tokenizer.decode(chunk) for chunk in chunks[i:i+max_batch_size] 
                # we are converting the token ids to strings again for llm prompting
            ] for i in range(0, n, max_batch_size)]
        batched_next_tokens = [next_tokens[i:i+max_batch_size] for i in range(0, n-1, max_batch_size)]  # n-1 because next_tokens is one less than tokens_ids
        return batched_token_chunks, batched_next_tokens

    @method()
    def generate(self, document : Document) -> Any:
        from vllm import SamplingParams
        import time
        batched_chunks, batched_correct_tokens = self.chunk_and_split.remote(document)

        #TODO think about how to spin up multiple workers to do this in parallel if the document is very long
        print("len of batched_chunks", len(batched_chunks[0]))
        print("len of batched_correct_tokens", len(batched_correct_tokens[0]))
        for batch_chunk, batch_next_token  in batched_chunks:
            prompts = [
                self.template.format(system="", user=q) for q in batch_chunk
            ]

            print("prompts", prompts, "next_token", batch_next_token)
            print("len prompts", len(prompts))

            sampling_params = SamplingParams(
                temperature=0.1,
                top_p=10,
                max_tokens=1,
                presence_penalty=1.15,
                logprobs=50,
            )
            result = self.llm.generate(prompts, sampling_params)
            print("result", result)
            print("len result", len(result))
            print("len output", len(result[0].outputs))
            print("result[0].outputs[0]", result[0].outputs[0])
            print("result[0].outputs[0].logprobs", result[0].outputs[0].logprobs)
            logprobDict = result[0].outputs[0].logprobs
            token_ids = logprobDict.keys()
            tokens = self.tokenizer.convert_ids_to_tokens(token_ids)
            
                
            # Print the outputs.
            #TODO extract logprobs + match
        return None

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
    out = model.generate.remote(Doc)
    print(out)

