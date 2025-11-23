from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from contextlib import asynccontextmanager
from datetime import datetime

from database import client, collection
from models import Listing

# --- LIFESPAN EVENT HANDLER (recommended way) ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔗 Connecting to MongoDB...")
    yield
    print("❌ Closing MongoDB connection...")
    client.close()

app = FastAPI(lifespan=lifespan)

# CORS so React can access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------- ROUTES --------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/listing")
def create_listing(listing: Listing):
    try:
        weekday_index = datetime.now().weekday()
        day_number = weekday_index + 1
        listing.day = day_number
        result = collection.insert_one(listing.dict())
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
    
@app.put("/items/{item_name}")
def increment_item_waste(item_name: str):
    result = collection.update_one(
        {"item": item_name},
        {"$inc": {"wasted": 1}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    updated = collection.find_one({"item": item_name})
    updated["_id"] = str(updated["_id"])
    return updated

@app.get("/waste-summary")
def create_summary():
    try:
        totals = {}
        all_items = get_all_items()

        for entry in all_items:
            food = entry["item"]
            wasted = entry.get("wasted", 0)

            if food not in totals:
                totals[food] = 0

            totals[food] += wasted

        # Convert into a list of dicts if you need that structure
        individual_waste = [
            {"item": food, "wasted": wasted}
            for food, wasted in totals.items()
        ]

        total_waste = sum(totals.values())

        occurances = {}
        for item in all_items:
            num_items = get_items_by_name(item["item"])
            occurances[item["item"]] = len(num_items)

        ratio_waste = [{"item": item["item"], "wasted": int(item["wasted"] / occurances[item["item"]])}for item in individual_waste]

        print("individual_waste:", individual_waste)
        print("ratio_waste:", ratio_waste)
        print("total_waste:", total_waste)

        return {
            "individual_waste": individual_waste,
            "total_waste": total_waste,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
