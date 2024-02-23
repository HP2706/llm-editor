from modal import Image, Stub, Volume, Secret
image = Image.debian_slim().pip_install(  
    "tiktoken",  
    "openai==1.10.0",
    "instructor==0.4.8",
    "pydantic==2.6.1",
    "fastapi",
)

stub = Stub("logprob", image=image, secrets=[
        Secret.from_name("my-openai-secret"), 
        Secret.from_name("my-TOGETHER_API_KEY")
    ]
)

vol = Volume.persisted("webapp")