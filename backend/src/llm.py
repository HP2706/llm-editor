from typing import Generator, Union, Optional, Type, Iterable, AsyncGenerator
from .types import ClientType, ModelType, InstructorMode # type: ignore
from pydantic import BaseModel
from openai import OpenAI, AsyncOpenAI
from .dataModels import Document, ModelEditFactory # type: ignore
import os
import instructor # type: ignore
from src.utils import split_doc

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
            cls._instance = cls(
                client=ClientType.OPENAI,
                model_name=ModelType.GPT4,
                mode=InstructorMode.JSON,
            )
        return cls._instance

    async def _async_prompt(self, custom_instruction : str , 
                task_input: Optional[str], 
                dataModel: Iterable[Type[BaseModel]], 
                stream: bool,
                n_retries: int = 1
            ) -> Union[AsyncGenerator[BaseModel, None], BaseModel]:
        # the completion creation directly and assign the result to `response`    
    
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
        
        response = await self._async_patched_client.chat.completions.create( # type: ignore
            model=self._model_name,
            temperature=0.1,
            response_model=dataModel,
            max_retries=n_retries,
            stream=stream,  # Assuming `stream` determines if the response is iterable
            messages=messages,
        )

        # If the response is expected to be iterable, process it as such
        if stream:
            async for content in response:
                try:
                    assert isinstance(content, BaseModel), "content is not of type BaseModel"
                    yield content
                except AssertionError as e:
                    print(e)
        else:
            assert isinstance(response, BaseModel), "content is not of type BaseModel"
            yield response  # Assuming you want to return the iterable response 


    def _prompt(self, custom_instruction : str , 
                task_input: Optional[str], 
                dataModel: Union[Iterable[Type[BaseModel]], Type[BaseModel]], 
                stream: bool,
                n_retries: int = 1
            ) -> Union[str, Generator[Type[BaseModel], None, None]]:
        # the completion creation directly and assign the result to `response`

        if self.debug:
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

        # If the response is expected to be iterable, process it as such
        if stream:
            edits = []
            exception = None
            while True:
                if edits != []:
                    string_edits = "\n".join([edit.stringify() for edit in edits]) # type: ignore
                    additional_messages = [
                        {
                            "role": "system",
                            "content": f"""the following edits have already been apply DO NOT reApply them
                            {string_edits} 
                            """
                        }
                    ] # type: ignore
                    if exception is not None:
                        additional_messages.append(
                            {
                                "role": "system",
                                "content": f"""in an earlier attempt you made the following error: {exception} please try again."""
                            }
                        )

                    messages = [messages[0]] + additional_messages + [messages[1]]
                # we are adding a message in the middle
                try: 
                    response = self._patched_client.chat.completions.create( # type: ignore
                        model=self._model_name,
                        temperature=0.1,
                        response_model=dataModel,
                        max_retries=n_retries,
                        stream=stream,  # Assuming `stream` determines if the response is iterable
                        messages= messages,
                    )

                    for content in response:
                        if self.debug:
                            print("sync iterable streamed response", content)
                        try:
                            assert isinstance(content, BaseModel), "content is not of type BaseModel"
                            edits = [content]
                            yield content # type: ignore
                        except AssertionError as e:
                            print(e)
                    break # the llm finished
                except Exception as e:
                    print(e)

        else:
            response = self._patched_client.chat.completions.create( # type: ignore
                model=self._model_name,
                temperature=0.1,
                response_model=dataModel,
                max_retries=n_retries,
                stream=stream,  # Assuming `stream` determines if the response is iterable
                messages= messages,
            )
            if self.debug:
                print("response non streamed", response)
            assert isinstance(response, BaseModel), "content is not of type BaseModel"
            return response   

def process_doc(document : Document) -> Generator[Type[BaseModel], None, None]:
    DataModel = ModelEditFactory(document.text)
    print("model recieved", DataModel, "document", document.text)
    llm = FunctionCallingLLM.get_instance()
    for edit in llm._prompt(
        custom_instruction="""
        please make any necessary edits to the document, be thorough and precise in your edits.
        """,
        task_input=document.text,
        dataModel=Iterable[DataModel],# type: ignore # The Pydantic model for the response
        stream=True
    ):
        yield edit # type: ignore

async def async_process_doc(document : Document) -> AsyncGenerator[Type[BaseModel], None]:
    DataModel = ModelEditFactory(document.text)
    llm = FunctionCallingLLM.get_instance()
    async for edit in llm._async_prompt( # type: ignore
        custom_instruction="""
        please make any necessary edits to the document, be thorough and precise in your edits.
        a quote can be between a single mispelled word or a sentence. If error is obvious dont use description.
        """,
        task_input=document.text,
        dataModel=Iterable[DataModel], # type: ignore
        stream=True
    ): 
        yield edit

async def async_make_edits(document : Document) -> AsyncGenerator[Type[BaseModel], None]:
    docs = split_doc(n_tokens=500, document=document) # max of 500 tokens per prompt
    for doc in docs:
        async for edit in async_process_doc(doc):
            print("edit", edit)
            yield edit

def make_edits(document : Document) -> Generator[Type[BaseModel], None, None]:
    docs = split_doc(n_tokens=500, document=document) # max of 500 tokens per prompt
    for doc in docs:
        for edit in process_doc(doc):
            print("edit", edit)
            yield edit

