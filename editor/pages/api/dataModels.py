from pydantic import BaseModel, Field, field_validator
from typing import Iterable, List, Type, Optional, Tuple

# for editor

# internal models
class Metadata(BaseModel):
    title: Optional[str] = Field(None, description="The title of the document")
    n_tokens: int = Field(..., description="The number of tokens in the document")
    n_words : Optional[int] = Field(None, description="The number of words in the document")

class Document(BaseModel):
    text : str = Field(..., description="The text of the document to be summarized")
    metadata : Metadata = Field(..., description="The metadata of the document to be summarized")

def ModelEditFactory(textData: str) -> Type[BaseModel]:
    '''this creates a DecomposerResponse class but where external data is set. can arguably be done more elegantly.'''
    if not isinstance(textData, str):
        raise ValueError("textData must be a string got", type(textData))
    
    class Edit(BaseModel):
        quote : str = Field(..., description="The quote to be edited, if possible avoid writing the entire sentence")
        proposed_edit : str = Field(..., description="The proposed edit, if possible avoid writing the entire sentence")
        explanation : Optional[str] = Field(..., description="A very bried explanation of why the edit, if it is obvious, it can be left empty")

        @field_validator('quote')
        def check_is_in_text(cls, quote : str) -> Optional[dict]:
            if quote not in textData:
                raise ValueError("quote must be in the text")
            return quote
        
    return Edit

# for getting logprobs

class TokenProb(BaseModel):
    token : str = Field(..., description="The token")
    prob : float = Field(..., description="the probability of the token")
    color : Optional[Tuple[float, float, float, float]] = Field(None, description="""
        The color of the token, the more green the more likely the model finds the token to be.
    """)

class Word(BaseModel):
    string : str = Field(..., description="The word")
    pos : int = Field(..., description="The position of the word in sequence") 