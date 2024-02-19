from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi import File, UploadFile
from pydantic import BaseModel
from typing import AsyncGenerator
from typing import List, Iterable, Type, Union
from .utils import build_doc_from_string
import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from functools import wraps
from starlette.middleware.base import RequestResponseEndpoint
import time
import asyncio
from .llm import async_make_edits, make_edits # type: ignore
from .DocProcessing import Process_file # type: ignore
from .dataModels import Document, TokenProb
from .fastapi_datamodels import EditDocRequest
import logging

logging.basicConfig(filename='debug.log', level=logging.DEBUG)
mylogger = logging.getLogger("debug")

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

class Myserver(FastAPI):
    def __init__(self):
        super().__init__()
        self.File = None

    async def preprocess_file(self, file: UploadFile = File(...)) -> Union[Type[Document], HTTPException]:
        if file.filename.endswith(('.docx', '.md', '.txt')): # type: ignore
            Doc = await Process_file(file)
            if isinstance(Doc, str):
                raise HTTPException(status_code=400, detail=Doc)
            max_words = 1000
            if Doc.metadata.n_words > max_words: # type: ignore
                raise HTTPException(status_code=400, detail="Document too long got " + str(Doc.metadata.n_words) + f" words, max is {max_words} words")
            return Doc
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

origins = [
    "http://localhost:3001",
    "http://localhost:3000",
]

app = Myserver()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
#app.add_middleware(DebugMiddleware)



#utility function to convert async generator to streaming response
async def convert_async_to_json_stream(data : AsyncGenerator[Type[BaseModel], None]) -> StreamingResponse:
    start_time = time.time()
    async def generate():
        async for item in data:
            if isinstance(item, BaseModel):
                yield json.dumps(item.model_dump()) + "\n"
            end_time = time.time()  # End timing after yielding
            mylogger.debug(logging.DEBUG, f"Async chunk took {end_time - start_time} seconds to send.")
    return StreamingResponse(content=generate(), media_type="application/json")

def convert_sync_to_json_stream(data : Iterable[Type[BaseModel]]) -> StreamingResponse:
    start_time = time.time()
    def generate():
        for item in data: 
            if isinstance(item, BaseModel):
                yield json.dumps(item.model_dump()) + "\n"
            end_time = time.time()  # End timing after yielding
            mylogger.debug(logging.DEBUG, f"Sync chunk took {end_time - start_time} seconds to send.")
    return StreamingResponse(content=generate(), media_type="application/json")

@app.get("/api/Ping")
def ping():
    print("received Ping request")
    return "Server is up and running"

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

@app.post("/api/editDoc")
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
    
@app.post('/api/logprobs')
async def getLogProbs(file: UploadFile = File(...)) -> List[TokenProb]:
    '''This function takes a document and returns a list of proposed edits'''
    try:
        Doc = await app.preprocess_file(file)
        #TODO get logprobs, connect to modal endpoint
    except HTTPException as e:
        return e



""" 

@app.post('/authenticate', dependencies=[Depends(JWTBearer())], response_model=AuthenticationResponse)
def authenticate(user : User) -> AuthenticationResponse:
    if user_exists(user.email):
        return AuthenticationResponse(ok = True)
    else:


def signup_user(user: User) -> bool:
    '''signups user to supabase'''
    try:
        # Assuming User model has 'email' and 'password' fields
        user_data = supabase.auth.sign_up(email=user.email, password=user.password)
        if user_data.get("user"):
            return True
        else:
            return False
    except Exception as e:
        print(f"Error signing up user: {e}")
        return False


def user_exists(key: str = "email", value: str = None) -> bool:
    user = supabase.from_("users").select("*").eq(key, value).execute()
    return len(user.data) > 0


 """