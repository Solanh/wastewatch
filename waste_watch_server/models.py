# models.py
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field



class Listing(BaseModel):
    item: str
    qty: int
    meal_period: int
    day: Optional[int] = None
    wasted: int = 0
    menu_num: int
    created_at: int

    model_config = {
        "extra": "allow",   # allow extra fields in input
      
    }
    




class MenuItem(BaseModel):
    name: str
    quantity: int = Field(ge=1)      # initial quantity
    taken: int = 0                   # NEW: how many were taken
    wasted: int = 0                  # optional: how many wasted (for later)

    model_config = {
        "extra": "ignore",           # ignore any unknown fields from Mongo
    }


class MenuModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    items: List[MenuItem]

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
