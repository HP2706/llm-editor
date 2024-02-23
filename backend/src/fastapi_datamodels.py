from pydantic import BaseModel

class EditDocRequest(BaseModel):
    useAsync: bool
    text: str


# fastapi output models