from pydantic import BaseModel


class WeComMessageRequest(BaseModel):
    userid: str
    content: str
