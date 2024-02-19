from editor.pages.api.utils import build_doc_from_string
from pydantic import BaseModel
from modalBackend import Model
from common import stub
from modal import asgi_app, asgi_app


class LogProbRequest(BaseModel):
    prompt: str



@stub.function(
    container_idle_timeout=300,
    timeout=600,
)
@asgi_app()
def fastapi_app():
    from fastapi import FastAPI, Request
    from fastapi.responses import Response, StreamingResponse
    from fastapi.staticfiles import StaticFiles
    import json

    web_app = FastAPI()
    model = Model()
    @web_app.get("/count")
    async def count():
        def generate():
            for i in range(10):
                yield f"Logprob {i}\n"

        return StreamingResponse(generate(), media_type="image/png")

    @web_app.post("/getLogProbs")
    async def getLogProbs(inp: LogProbRequest)-> StreamingResponse:
        doc = build_doc_from_string(inp.prompt)
        
        def generate():
            print("generator called")
            for logprobs in model.generate.remote_gen(doc):
                for logprob in logprobs:
                    print("logprob in generator", logprob)
                    yield json.dumps(logprob.model_dump()) + "\n"
        return StreamingResponse(generate(), media_type="application/json")

    return web_app


