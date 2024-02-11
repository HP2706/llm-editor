from typing import Union, Optional, Type, Iterable, AsyncGenerator
from .types import ClientType, ModelType, InstructorMode # type: ignore
from openai import OpenAI, AsyncOpenAI
from .dataModels import Document, Metadata, ModelEditFactory # type: ignore
from pydantic import BaseModel
import os
import instructor # type: ignore
from .utils import split_doc
import asyncio

class LLM():
    def __init__(self, client : ClientType = ClientType.OPENAI, 
                model_name : ModelType = ModelType.GPT4, 
                mode : InstructorMode = InstructorMode.JSON,
                debug : bool = False
        ) -> None:
        

        self.debug = debug

        if not isinstance(mode, InstructorMode):
            raise ValueError("mode must be of type InstructorMode")
        

        if client == ClientType.OPENAI:
            self._async_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
            self._client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
            if not (model_name == ModelType.GPT4 or model_name == ModelType.GPT3_5 or model_name == ModelType.GPT4_V):
                raise ValueError("model_name must be GPT4 or GPT3_5 when using OPENAI")
            self._model_name = model_name.value
        else:
            self._client = OpenAI( #its weird but together works with Openai client.
                base_url="https://api.together.xyz/v1",
                api_key=os.environ["TOGETHER_API_KEY"],
            )
            self._async_client = AsyncOpenAI(
                base_url="https://api.together.xyz/v1",
                api_key=os.environ["TOGETHER_API_KEY"],
            )
            print(model_name)
            if not (model_name == ModelType.MIXTRAL):
                raise ValueError("model_name must be MIXTRAL when using TOGETHER")

            self._model_name = model_name.value

        if mode.value is not None:
            self._patched_client = instructor.patch(self._client, mode=mode.value)
            self._async_patched_client = instructor.patch(self._async_client, mode=mode.value)

class FunctionCallingLLM(LLM):
    '''this class is a wrapper around the OpenAI and Together clients to make function calls to the LLMs easier.'''
    _instance : Optional['FunctionCallingLLM'] = None 

    @classmethod
    def get_instance(cls) -> 'FunctionCallingLLM':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def _async_prompt(self, custom_instruction : str , 
                task_input: Optional[str], 
                dataModel: Type[BaseModel], isIterable: bool,
                n_retries: int = 1
            ) -> Union[AsyncGenerator[BaseModel, None], BaseModel]:
        # the completion creation directly and assign the result to `response`    
    
        assert issubclass(dataModel, BaseModel), f"dataModel is not of pydantic BaseModel got type {type(dataModel)}"

        messages=[
            {
                "role": "system",
                "content": custom_instruction,
            }
        ]
        if task_input is not None:
            messages.append(
                {
                    "role": "user",
                    "content": task_input,
                }
            )
        
        if self.debug:
            print("messages", messages)
        
        response = await self._async_patched_client.chat.completions.create(
            model=self._model_name,
            temperature=0.1,
            response_model=Iterable[Type[BaseModel]] if isIterable else dataModel,
            max_retries=n_retries,
            stream=isIterable,  # Assuming `stream` determines if the response is iterable
            messages=messages,
        )

        # If the response is expected to be iterable, process it as such
        if isIterable:
            async for content in response:
                assert isinstance(content, dataModel)
                if self.debug:
                    print("async iterable response", content)
                yield content
        else:
            yield response  # Assuming you want to return the iterable response 


    def _prompt(self, custom_instruction : str , 
                task_input: Optional[str], 
                dataModel: Type[BaseModel], isIterable: bool,
                n_retries: int = 1
            ) -> Union[str, Iterable]:
        # the completion creation directly and assign the result to `response`
        
        assert issubclass(dataModel, BaseModel), f"dataModel is not of pydantic BaseModel got type {type(dataModel)}"

        if self.debug:
            print("isIterable", isIterable)
            print("dataModel", dataModel)
            print("custom_instruction", custom_instruction)
            print("task_input", task_input)

        messages=[
            {
                "role": "system",
                "content": custom_instruction,
            }
        ]
        if task_input is not None:
            messages.append(
                {
                    "role": "user",
                    "content": task_input,
                }
            )

        if self.debug:
            print("messages", messages)
            response_model = Iterable[type[BaseModel]] if isIterable else dataModel
            print("response_model type", type(response_model))
        response = self._patched_client.chat.completions.create(
            model=self._model_name,
            temperature=0.1,
            response_model=Iterable[type[BaseModel]] if isIterable else dataModel,
            max_retries=n_retries,
            stream=isIterable,  # Assuming `stream` determines if the response is iterable
            messages= messages,
        )

        if self.debug:
            print(f"model response to prompt call from messages {messages}", response)

        # If the response is expected to be iterable, process it as such
        if isIterable:
            for content in response:
                if self.debug:
                    print("sync iterable streamed response", content)
                assert isinstance(content, dataModel), "content is not of type dataModel"
            return response  # Assuming you want to return the iterable response
        else:
            if self.debug:
                print("response non streamed", response)
        # If not iterable, just return the response directly
        
        return response   

import asyncio
from asyncio import Semaphore

async def process_doc(document : Document) -> Iterable[Type[BaseModel]]:
    DataModel = ModelEditFactory(document.text)
    llm = FunctionCallingLLM.get_instance()
    async for edit in llm._async_prompt(
        custom_instruction="Edit the document",
        task_input=document.text,
        dataModel=DataModel,
        isIterable=True
    ):
        yield edit


async def make_edits(document : Document) -> AsyncGenerator[Type[BaseModel]]:
    docs = split_doc(n_tokens=500, document=document) # max of 1000 tokens per prompt

    processed_docs = [process_doc(doc) for doc in docs]
    docs = await asyncio.gather(*processed_docs) # ordering is preserved
    return docs

