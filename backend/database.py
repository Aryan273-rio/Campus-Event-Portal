
import os
from pathlib import Path

import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load .env from the backend directory
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI is missing from the .env file")

# Create one MongoDB client
client = AsyncIOMotorClient(
    MONGO_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=10000
)

# Database
db = client["campus_event_db"]

# Collections
users_collection = db["users"]
events_collection = db["events"]
registrations_collection = db["registrations"]


# MongoDB connection test
async def check_database_connection():
    await client.admin.command("ping")
    print("MongoDB connected successfully!")


# Close connection
async def close_database_connection():
    client.close()


# Helper to format MongoDB document IDs
def parse_mongo_id(document: dict) -> dict:
    document["id"] = str(document["_id"])
    del document["_id"]
    return document
