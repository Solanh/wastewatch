# main.py
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from database import client as mongo_client, collection, menus_collection  # type: ignore

import google.genai as genai
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

# Gemini client
genai_client = genai.Client(api_key=API_KEY)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔗 Connecting to MongoDB...")
    # You could test a quick ping here if you want
    try:
        yield
    finally:
        print("❌ Closing MongoDB connection...")
        mongo_client.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later if you want
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id format")


def serialize_menu(doc) -> dict:
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


# ---------- Listing / scanning endpoints ----------

@app.post("/listing")
def create_listing(listing):
    from models import Listing  # if you want to keep the Pydantic model
    if not isinstance(listing, Listing):
        listing = Listing(**listing)

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


@app.put("/items/{item_id}")
def increment_item_waste(item_id: str):
    oid = to_object_id(item_id)

    result = collection.update_one(
        {"_id": oid},
        {"$inc": {"wasted": 1}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    updated = collection.find_one({"_id": oid})
    updated["_id"] = str(updated["_id"])
    return updated


# ---------- Waste summary + Gemini ----------

@app.get("/api/summary")
def get_summary(menu_id: Optional[int] = None, scope: str = "menu"):
    """
    menu_id: optional menu_num to filter by
    scope: "menu" | "day" | "week" | "month"
    """
    try:
        summary_data = compute_waste_summary(menu_id=menu_id, scope=scope)

        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=(
                "In not more than 6 lines (not including lists): "
                "Given this food waste data where each item has 'leftovers', "
                "'wasted', and 'total_waste' (leftovers + wasted), "
                f"{summary_data}, identify the major contributor to total waste "
                "and approximate its percentage of overall waste. "
                "Briefly compare leftovers vs explicit wasted portions and "
                "recommend a short list of similar foods to the items with the "
                "lowest total waste that could be emphasized more. "
                "Return the response cleanly in markdown."
            ),
        )

        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def compute_waste_summary(menu_id: Optional[int] = None, scope: str = "menu"):
    now = datetime.utcnow()

    # Only menu rows, not /listing scans
    query: dict = {"menu_num": {"$exists": True}}

    if menu_id is not None:
        query["menu_num"] = int(menu_id)

    start = end = None
    if scope == "day":
        start = datetime(now.year, now.month, now.day)
        end = start + timedelta(days=1)
    elif scope == "week":
        start = now - timedelta(days=7)
        end = now
    elif scope == "month":
        start = now - timedelta(days=30)
        end = now

    if start and end:
        query["created_at"] = {"$gte": start, "$lt": end}

    docs = list(collection.find(query))

    stats: dict[str, dict[str, int]] = {}
    # stats[item] = { "leftovers": ..., "wasted": ..., "count": ... }

    for entry in docs:
        food = entry["item"]

        qty = int(entry.get("qty", 0) or 0)
        taken = int(entry.get("taken", 0) or 0)
        wasted = int(entry.get("wasted", 0) or 0)

        leftovers = max(qty - taken, 0)

        if food not in stats:
            stats[food] = {"leftovers": 0, "wasted": 0, "count": 0}

        stats[food]["leftovers"] += leftovers
        stats[food]["wasted"] += wasted
        stats[food]["count"] += 1

    individual_waste = []
    total_waste = 0

    for food, s in stats.items():
        item_total = s["leftovers"] + s["wasted"]
        total_waste += item_total
        individual_waste.append(
            {
                "item": food,
                "leftovers": s["leftovers"],
                "wasted": s["wasted"],
                "total_waste": item_total,
            }
        )

    individual_waste.sort(key=lambda x: x["total_waste"], reverse=True)

    return {
        "individual_waste": individual_waste,
        "total_waste": total_waste,
    }

@app.get("/api/waste-summary")
def create_summary(menu_id: Optional[int] = None, scope: str = "menu"):

    try:
        return compute_waste_summary(menu_id=menu_id, scope=scope)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------- Menu helpers + CRUD ----------

def listings_to_menu(menu_num: int, docs: list[dict]) -> dict:
    if not docs:
        raise HTTPException(status_code=404, detail="Menu not found")

    first = docs[0]
    return {
        "id": menu_num,
        "name": first.get("menu_name", ""),
        "meal_period": first.get("meal_period"),
        "items": [
            {
                "name": d["item"],
                "quantity": d["qty"],
                "taken": d.get("taken", 0),
                "wasted": d.get("wasted", 0),
            }
            for d in docs
        ],
    }


@app.post("/api/menus")
def create_menu(menu: dict = Body(...)):
    try:
        name = menu["name"]
        meal_period = int(menu["meal_period"])
        items = menu["items"]
        day = menu.get("day")

        max_doc = collection.find_one(
            {"menu_num": {"$exists": True}},
            sort=[("menu_num", -1)]
        )
        next_menu_num = (max_doc["menu_num"] if max_doc else 0) + 1
        now = datetime.utcnow()

        docs = []
        for it in items:
            docs.append({
                "item": it["name"],
                "qty": int(it["quantity"]),
                "meal_period": meal_period,
                "day": day,
                "taken": int(it.get("taken", 0)),
                "wasted": int(it.get("wasted", 0)),
                "menu_num": next_menu_num,
                "menu_name": name,
                "created_at": now,
            })

        collection.insert_many(docs)

        return listings_to_menu(next_menu_num, docs)

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing field {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/menus")
def list_menus():
    try:
        pipeline = [
            {"$match": {"menu_num": {"$exists": True}}},
            {
                "$group": {
                    "_id": "$menu_num",
                    "menu_num": {"$first": "$menu_num"},
                    "menu_name": {"$first": "$menu_name"},
                    "meal_period": {"$first": "$meal_period"},
                    "items": {
                        "$push": {
                            "name": "$item",
                            "quantity": "$qty",
                            "taken": {"$ifNull": ["$taken", 0]},
                            "wasted": {"$ifNull": ["$wasted", 0]},
                        }
                    },
                }
            },
            {"$sort": {"menu_num": 1}},
        ]

        agg = list(collection.aggregate(pipeline))
        menus = [
            {
                "id": m["menu_num"],
                "name": m.get("menu_name", ""),
                "meal_period": m.get("meal_period"),
                "items": m["items"],
            }
            for m in agg
        ]

        return menus
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/menus/{menu_id}")
def get_menu(menu_id: int):
    docs = list(collection.find({"menu_num": int(menu_id)}))
    if not docs:
        raise HTTPException(status_code=404, detail="Menu not found")

    for doc in docs:
        if "wasted" not in doc:
            doc["wasted"] = 0

    return listings_to_menu(int(menu_id), docs)


@app.put("/api/menus/{menu_id}")
def update_menu(menu_id: int, menu: dict = Body(...)):
    try:
        menu_id = int(menu_id)
        name = menu["name"]
        meal_period = int(menu["meal_period"])
        items = menu["items"]
        day = menu.get("day")

        existing = collection.find_one({"menu_num": menu_id})
        base_created_at = existing.get("created_at") if existing else datetime.utcnow()

        collection.delete_many({"menu_num": menu_id})

        docs = []
        for it in items:
            docs.append({
                "item": it["name"],
                "qty": int(it["quantity"]),
                "meal_period": meal_period,
                "day": day,
                "taken": int(it.get("taken", 0)),
                "wasted": int(it.get("wasted", 0)),
                "menu_num": menu_id,
                "menu_name": name,
                "created_at": base_created_at,
            })

        if docs:
            collection.insert_many(docs)

        return listings_to_menu(menu_id, docs)

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing field {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/menus/{menu_id}", status_code=204)
def delete_menu(menu_id: int):
    result = collection.delete_many({"menu_num": int(menu_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu not found")
    return None
