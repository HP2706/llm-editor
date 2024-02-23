from pydantic import BaseModel
from src.common import stub, vol
from modal import asgi_app
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from src.utils import build_doc_from_string
from src.llm import make_edits
from src.webapp_utils import convert_sync_to_json_stream, timing_decorator
from src.fastapi_datamodels import EditDocRequest

class LogProbRequest(BaseModel):
    prompt: str
    idx: Optional[int] = None

class TokenizationRequest(BaseModel):
    prompt: str


@stub.function(
    container_idle_timeout=100,
    timeout=150,
    volumes={'/data': vol},
)

@asgi_app()
def fastapi_app():
    from fastapi import FastAPI
    from fastapi.responses import Response

    web_app = FastAPI()
    pattern = "https://.*-hp2706s-projects.vercel.app(/.*)?|http://localhost:3000(/.*)?"

    web_app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=pattern,
        allow_credentials=True,
        allow_methods=["*"],  # Allows all methods
        allow_headers=["*"],  # Allows all headers
    )
    
    @web_app.post("/api/editDoc")
    @timing_decorator
    async def editDoc(request : EditDocRequest) -> Response: 
        '''This function takes a document and streams proposed edits'''
        doc = build_doc_from_string(request.text)
        edits_stream = make_edits(doc) # use synchronous generator
        return convert_sync_to_json_stream(edits_stream)

    return web_app

