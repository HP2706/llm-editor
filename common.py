from modal import Image, Stub
image = Image.debian_slim().pip_install(
    "fastapi==0.100.1",
    "pydantic==2.6.1",  
    "tiktoken",  
)

stub = Stub("logprob", image=image)