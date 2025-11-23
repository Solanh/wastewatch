# database.py
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")  # for listings

client = MongoClient(MONGO_URI)

db = client[DB_NAME]

# Existing "listing" collection (keep this for your current routes)
collection = db[COLLECTION_NAME]

# NEW: collection specifically for menus
menus_collection = db["menus"]
