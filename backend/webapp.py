from pydantic import BaseModel
from src.modalBackend import Model
from src.common import stub, vol
from modal import asgi_app
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

from src.utils import build_doc_from_string
from src.webapp_utils import convert_async_to_json_stream, convert_sync_to_json_stream, timing_decorator
from src.llm import async_make_edits, make_edits
from src.fastapi_datamodels import EditDocRequest

class LogProbRequest(BaseModel):
    prompt: str
    idx: Optional[int] = None

@stub.function(
    container_idle_timeout=100,
    timeout=150,
)
@asgi_app()
def fastapi_app():
    from fastapi import FastAPI
    from fastapi.responses import Response, StreamingResponse
    import json

    web_app = FastAPI()
    pattern =  "https://.*-hp2706s-projects.vercel.app(/chat)?|http://localhost:3000(/chat)?"

    web_app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=pattern,
        allow_credentials=True,
        allow_methods=["*"],  # Allows all methods
        allow_headers=["*"],  # Allows all headers
    )

    @web_app.post("/api/getLogProbs")
    async def getLogProbs(inp: LogProbRequest)-> StreamingResponse:
        headers = {"Content-Encoding": "identity"}
        print("\n\nreceived request", inp)
        model = Model()

        def generate():
            logprobs = []
            for logprobs in model.generate.remote_gen(
                    inp.prompt, 
                    inp.idx if inp.idx is not None else 1
                ):
                for logprob in logprobs:
                    logprobs.append(logprob)
                    yield json.dumps(logprob.model_dump()) + "\n"
        return StreamingResponse(generate(), media_type="application/json", headers=headers)

    @web_app.post("/api/DummyGetLogProbs")
    async def DummyGetLogprobs(inp : LogProbRequest) -> StreamingResponse:
        headers = {"Content-Encoding": "identity"}
        json_data = json.loads(open("logProbs.json").read()).get('logprobs')
        def generate():
            for logprob in json_data:
                yield json.dumps(logprob) + "\n"
        return StreamingResponse(generate(), media_type="application/json", headers=headers)

    @web_app.post("/api/editDoc")
    @timing_decorator
    async def editDoc(request : EditDocRequest) -> Response: 
        '''This function takes a document and streams proposed edits'''
        if request.useAsync:
            doc = build_doc_from_string(request.text)
            edits_stream = async_make_edits(doc)  # This is an AsyncGenerator
            return await convert_async_to_json_stream(edits_stream)  # Ensure this await is correct
        else:
            doc = build_doc_from_string(request.text)
            edits_stream = make_edits(doc) # use synchronous generator
            return convert_sync_to_json_stream(edits_stream)

    return web_app

