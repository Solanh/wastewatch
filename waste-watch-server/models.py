from pydantic import BaseModel
from typing import Optional

class Listing(BaseModel):
    item: str
    qty: int
    meal_period: int
    day: Optional[int] = None
    wasted: int = 0

    class Config:
        extra = "allow"
        allow_mutation = True
