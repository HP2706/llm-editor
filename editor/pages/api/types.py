from instructor.function_calls import Mode # type: ignore
from enum import Enum

class ClientType(Enum):
    TOGETHER = 1
    OPENAI = 2

class ModelType(Enum):
    GPT4 = "gpt-4-turbo-preview"
    GPT4_V = "gpt-4-vision-preview"
    GPT3_5 = "gpt-3.5-turbo-0125"
    MIXTRAL = "mistralai/Mixtral-8x7B-Instruct-v0.1"

class InstructorMode(Enum):
    JSON = Mode.JSON
    NONE = None
    #PARALLEL_TOOLS = instructor.Mode.PARALLEL_TOOLS