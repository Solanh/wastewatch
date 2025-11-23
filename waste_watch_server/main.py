# main.py
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from contextlib import asynccontextmanager
from datetime import date 
import time

from database import client, collection, menus_collection
from models import Listing, MenuModel

import google.genai as genai
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=API_KEY)



@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔗 Connecting to MongoDB...")
    yield
    print("❌ Closing MongoDB connection...")
    client.close()

app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



def to_object_id(id_str: str) -> ObjectId:
    """Validate and convert string -> ObjectId, or raise 400."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id format")

def serialize_menu(doc) -> dict:
    """
    Convert a MongoDB menu document into a JSON-serializable dict that
    matches what your React expects: { id, name, items: [{name, quantity}] }.
    """
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "items": [
            {
                "name": item.get("name", ""),
                "quantity": item.get("quantity", 0),
            }
            for item in doc.get("items", [])
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/listing")
def create_listing(listing: Listing):
    try:
        weekday_index = datetime.now().weekday()
        day_number = weekday_index + 1
        listing.day = day_number
        result = collection.insert_one(listing.model_dump())
        return {"inserted_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/listing")
def get_all_items():
    try:
        items = list(collection.find())
        for item in items:
            item["_id"] = str(item["_id"])
        return items
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/listing/{name}")
def get_items_by_name(name: str):
    try:
        items = list(collection.find({"item": name}))
        for item in items:
            item["_id"] = str(item["_id"])
        return items
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
<<<<<<< HEAD:waste_watch_server/main.py
    
@app.put("/items/{item_name}")
def increment_item_waste(item_name: str):
    result = collection.update_one(
        {"item": item_name},
=======


@app.put("/items/{item_id}")
def increment_item_waste(item_id: str):
    oid = to_object_id(item_id)

    result = collection.update_one(
        {"_id": oid},
>>>>>>> 7be6d0190c5265ca7db662e94b55897390438308:waste-watch-server/main.py
        {"$inc": {"wasted": 1}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

<<<<<<< HEAD:waste_watch_server/main.py
    updated = collection.find_one({"item": item_name})
=======
    updated = collection.find_one({"_id": oid})
>>>>>>> 7be6d0190c5265ca7db662e94b55897390438308:waste-watch-server/main.py
    updated["_id"] = str(updated["_id"])
    return updated


@app.get("/api/summary")
def get_summary():
    try:
        week_data = compute_waste_summary()

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=(
                "In not more than 6 lines not including lists: Given this food waste average data by week, "
                f"{week_data}, discuss the data by stating the major "
                "contributor and its percentage, then briefly recommend alist of"
                "similar foods to the items with the lowest waste."
                "return response cleanly in markdown"
            ),
        )

        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.get("/waste-summary")
# def create_summary():
#     try:
#         # reuse the existing function to get all items
#         all_items = get_all_items()

#         totals = {}
#         for entry in all_items:
#             food = entry["item"]
#             wasted = entry.get("wasted", 0)

#             if food not in totals:
#                 totals[food] = 0

#             totals[food] += wasted

#         individual_waste = [
#             {"item": food, "wasted": wasted}
#             for food, wasted in totals.items()
#         ]

#         total_waste = sum(totals.values())

#         occurances = {}
#         for item in all_items:
#             name = item["item"]
#             num_items = get_items_by_name(name)
#             occurances[name] = len(num_items)

#         ratio_waste = [
#             {
#                 "item": item["item"],
#                 "wasted": int(
#                     item["wasted"] / occurances.get(item["item"], 1)
#                 ),
#             }
#             for item in individual_waste
#         ]

#         print("individual_waste:", individual_waste)
#         print("ratio_waste:", ratio_waste)
#         print("total_waste:", total_waste)

#         return {
#             "individual_waste": individual_waste,
#             "total_waste": total_waste,
#         }

#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))

def compute_waste_summary():
    # reuse the existing function to get all items
    all_items = get_all_items()

    totals = {}
    for entry in all_items:
        food = entry["item"]
        wasted = entry.get("wasted", 0)

        if food not in totals:
            totals[food] = 0

        totals[food] += wasted

    individual_waste = [
        {"item": food, "wasted": wasted}
        for food, wasted in totals.items()
    ]

    total_waste = sum(totals.values())

    occurances = {}
    for item in all_items:
        name = item["item"]
        num_items = get_items_by_name(name)
        occurances[name] = len(num_items)

    ratio_waste = [
        {
            "item": item["item"],
            "wasted": int(
                item["wasted"] / occurances.get(item["item"], 1)
            ),
        }
        for item in individual_waste
    ]

    print("individual_waste:", individual_waste)
    print("ratio_waste:", ratio_waste)
    print("total_waste:", total_waste)

    return {
        "individual_waste": individual_waste,
        "total_waste": total_waste,
    }


@app.get("/waste-summary")
def create_summary():
    try:
        return compute_waste_summary()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# CREATE MENU
@app.post("/api/menus", response_model=MenuModel)
def create_menu(menu: MenuModel):
    """
    Expect payload:
    {
        "name": "Lunch Menu - Monday",
        "items": [
            {"name": "Bread", "quantity": 5},
            ...
        ]
    }
    """
    try:
        data = menu.model_dump(exclude={"id"}, by_alias=False)
        result = menus_collection.insert_one(data)
        created = menus_collection.find_one({"_id": result.inserted_id})
        created["_id"] = str(created["_id"])
        # FastAPI will coerce this dict into MenuModel because of response_model
        return created
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# LIST MENUS
@app.get("/api/menus", response_model=List[MenuModel])
def list_menus():
    try:
        docs = list(menus_collection.find())
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# GET SINGLE MENU
@app.get("/api/menus/{menu_id}", response_model=MenuModel)
def get_menu(menu_id: str):
    oid = to_object_id(menu_id)
    doc = menus_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Menu not found")
    doc["_id"] = str(doc["_id"])
    return doc


# UPDATE MENU
@app.put("/api/menus/{menu_id}", response_model=MenuModel)
def update_menu(menu_id: str, menu: MenuModel):
    """
    React sends payload like:
    {
      "name": "Updated Name",
      "items": [ { "name": "...", "quantity": 3 }, ...]
    }
    """
    oid = to_object_id(menu_id)

    data = menu.model_dump(exclude={"id"}, by_alias=False)

    result = menus_collection.update_one(
        {"_id": oid},
        {"$set": data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu not found")

    updated = menus_collection.find_one({"_id": oid})
    updated["_id"] = str(updated["_id"])
    return updated


# DELETE MENU
@app.delete("/api/menus/{menu_id}", status_code=204)
def delete_menu(menu_id: str):
    oid = to_object_id(menu_id)
    result = menus_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu not found")
    # 204 No Content → just return None
    return None
