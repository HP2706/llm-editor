from fastapi import Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import AsyncGenerator
from typing import Iterable, Type
import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from functools import wraps
from starlette.middleware.base import RequestResponseEndpoint
import time


class DebugMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path not in ["/api/editDoc", "/api/logprobs"]:
            body = await request.body()
            # Log the body or do whatever processing you need here
            try:
                json_body = json.loads(body)
                print("Received JSON data", json_body)
            except json.JSONDecodeError:
                print("Received non-JSON data")
            except Exception as e:
                print("Error processing request body", e)
            
            # Create a new request with the same body for downstream processing
            request = Request(scope=request.scope, receive=await self._get_body_receive(body))
            
            response = await call_next(request)
            return response
        else:# we just bypass since it is format data and not json
            response = await call_next(request)
            print("bypassing debug middleware")
            print("response", response)
            return response

    async def _get_body_receive(self, body: bytes):
        async def receive() -> dict:
            return {"type": "http.request", "body": body, "more_body": False}
        return receive


#utility function to convert async generator to streaming response
async def convert_async_to_json_stream(data : AsyncGenerator[Type[BaseModel], None]) -> StreamingResponse:
    headers = {"Content-Encoding": "identity"}
    async def generate():
        async for item in data:
            if isinstance(item, BaseModel):
                yield json.dumps(item.model_dump()) + "\n"
    return StreamingResponse(content=generate(), media_type="application/json", headers=headers)

def convert_sync_to_json_stream(data : Iterable[Type[BaseModel]]) -> StreamingResponse:
    headers = {"Content-Encoding": "identity"}
    def generate():
        for item in data: 
            if isinstance(item, BaseModel):
                yield json.dumps(item.model_dump()) + "\n"
    return StreamingResponse(content=generate(), media_type="application/json", headers=headers)


def timing_decorator(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        print(f"Timing {func.__name__} function")
        start_time = time.time()
        # Call the original function and get its response
        response = await func(*args, **kwargs)

        # After the function call completes, calculate the elapsed time
        end_time = time.time()
        print(f"{func.__name__} took {end_time - start_time} seconds to complete.")

        # Return the original response without modification
        return response

    return wrapper
