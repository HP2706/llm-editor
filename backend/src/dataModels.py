from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Type, Optional
from typing_extensions import Self
# for editor

# internal models
class Metadata(BaseModel):
    title: Optional[str] = None
    n_tokens: int = Field(..., description="The number of tokens in the document")
    n_words : int = Field(..., description="The number of words in the document")

class Document(BaseModel):
    text : str = Field(..., description="The text of the document to be summarized")
    metadata : Metadata = Field(..., description="The metadata of the document to be summarized")

def ModelEditFactory(textData: str) -> Type[BaseModel]:
    '''this creates a Edit class where validation occurs across external data can arguably be done more elegantly.'''
    if not isinstance(textData, str):
        raise ValueError("textData must be a string got", type(textData))
    
    class Edit(BaseModel):
        quote: str = Field(..., description="The quote to be edited, if possible avoid writing the entire sentence")
        proposed_edit: str = Field(..., description="The proposed edit, if possible avoid writing the entire sentence")
        explanation: Optional[str] = Field(None, description="A very brief explanation of why the edit, if it is obvious, it can be left empty")

        @model_validator(mode='after') # type: ignore
        def check_is_not_quote(self) -> Self:
            print("self attributes", self)
            if self.proposed_edit == self.quote:
                raise ValueError("proposed_edit must not be the same as the quote")
            return self

        @field_validator('quote')
        def check_is_in_text(cls, quote: str) -> str:
            if quote not in textData:
                raise ValueError(f"quote must be in the text got '{quote}' which is not in: '{textData}'")
            return quote

        def stringify(self) -> str:
            return f"quote: {self.quote}, proposed_edit: {self.proposed_edit}, explanation: {self.explanation}\n"
        
    return Edit

# for getting logprobs

