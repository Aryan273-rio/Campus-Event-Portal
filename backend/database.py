import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# Inject certifi to fix the SSL Handshake error
client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())

# Database
db = client.college_events_db

# Collections
events_collection = db.get_collection("events")
registrations_collection = db.get_collection("registrations")

# Helper to format MongoDB document IDs
def parse_mongo_id(document: dict) -> dict:
    document["id"] = str(document["_id"])
    del document["_id"]
    return document