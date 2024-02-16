from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional

class EditDocRequest(BaseModel):
    useAsync: bool
    text: str

class AuthenticationResponse(BaseModel):
    ok : bool
    error : Optional[str]
    
    @model_validator(mode='before')
    @classmethod
    def check_not_ok_and_error(cls, values):
        if values.get('ok') and values.get('error'):
            raise ValueError("cannot return ok as True and error message simultaneously")
        return values

class User(BaseModel):
    name: str
    email: str
    password: str

# fastapi output models