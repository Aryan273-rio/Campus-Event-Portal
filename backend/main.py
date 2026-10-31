from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
# MongoDB Atlas Connection String
MONGO_DETAILS = "mongodb+srv://aryansv5325364_db_user:1jRQB3jTFVqAPo6N@cluster0.uh65mhs.mongodb.net/"
client = AsyncIOMotorClient(MONGO_DETAILS)
db = client.campus_event_db

users_collection = db.users
events_collection = db.events
registrations_collection = db.registrations

# Whitelisted Organizer Email restriction
AUTHORIZED_ORGANIZER_EMAIL = "aryansagar.cs24@bmsce.ac.in"

# --- Pydantic Models ---

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = Field(..., pattern="^(student|organizer)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class EventSchema(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str
    date: datetime
    venue: str
    category: str
    max_capacity: int = Field(..., gt=0)
    price: float = Field(0.0, ge=0.0)
    organizer_id: Optional[str] = None

class EventUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    venue: Optional[str] = None
    category: Optional[str] = None
    max_capacity: Optional[int] = None
    price: Optional[float] = None

class RegistrationSchema(BaseModel):
    student_name: str
    student_email: EmailStr
    usn: Optional[str] = None
    payment_method: Optional[str] = "Free"
    payment_status: Optional[str] = "Completed"

class RedeemRequest(BaseModel):
    email: EmailStr
    reward_cost: int
    reward_name: str
    multiple_use: Optional[bool] = False


# --- Helper Serializer ---
def event_helper(event) -> dict:
    return {
        "id": str(event["_id"]),
        "title": event["title"],
        "description": event["description"],
        "date": event["date"],
        "venue": event["venue"],
        "category": event["category"],
        "max_capacity": event["max_capacity"],
        "price": event["price"],
        "organizer_id": event.get("organizer_id")
    }


# --- Routes ---

@app.post("/auth/register")
@app.post("/auth/signup")
async def register(user: UserRegister):
    # Hardcoded restriction: Only allow the authorized email to register as an organizer
    if user.role == "organizer" and user.email != AUTHORIZED_ORGANIZER_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Only {AUTHORIZED_ORGANIZER_EMAIL} is authorized to register as an organizer."
        )

    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.dict()
    user_dict["points"] = 0
    user_dict["category_points"] = {"Technical": 0, "Cultural": 0, "Workshop": 0, "Sports": 0}
    user_dict["redemption_history"] = []
    
    await users_collection.insert_one(user_dict)
    return {"message": "User registered successfully"}

@app.post("/auth/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or db_user["password"] != user.password:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return {
        "message": "Login successful",
        "user": {
            "name": db_user["name"],
            "email": db_user["email"],
            "role": db_user["role"]
        }
    }

@app.get("/events")
async def get_events(search: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    if category and category != "":
        query["category"] = category
        
    events = []
    async for event in events_collection.find(query):
        events.append(event_helper(event))
    return events

@app.post("/events")
async def create_event(event: EventSchema):
    event_dict = event.dict()
    result = await events_collection.insert_one(event_dict)
    new_event = await events_collection.find_one({"_id": result.inserted_id})
    return event_helper(new_event)

@app.put("/events/{event_id}")
async def update_event(event_id: str, event_update: EventUpdateSchema):
    update_data = {k: v for k, v in event_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    
    result = await events_collection.update_one(
        {"_id": ObjectId(event_id)}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    updated_event = await events_collection.find_one({"_id": ObjectId(event_id)})
    return event_helper(updated_event)

@app.delete("/events/{event_id}")
async def delete_event(event_id: str):
    result = await events_collection.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

@app.post("/events/{event_id}/register")
async def register_event(event_id: str, reg: RegistrationSchema):
    event = await events_collection.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    existing = await registrations_collection.find_one({"event_id": event_id, "student_email": reg.student_email})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this event")
        
    reg_dict = reg.dict()
    reg_dict["event_id"] = event_id
    reg_dict["event_name"] = event["title"]
    reg_dict["date"] = event["date"]
    reg_dict["venue"] = event["venue"]
    reg_dict["status"] = "registered"
    
    result = await registrations_collection.insert_one(reg_dict)
    return {"message": "Registered successfully", "registration_id": str(result.inserted_id)}

@app.get("/events/{event_id}/participants")
async def get_event_participants(event_id: str):
    participants = []
    async for reg in registrations_collection.find({"event_id": event_id}):
        participants.append({
            "registration_id": str(reg["_id"]),
            "student_name": reg["student_name"],
            "student_email": reg["student_email"],
            "usn": reg.get("usn", "N/A"),
            "payment_method": reg.get("payment_method", "Free"),
            "payment_status": reg.get("payment_status", "Completed"),
            "status": reg["status"]
        })
    return participants

@app.get("/tickets/{email}")
async def get_user_tickets(email: str):
    tickets = []
    async for reg in registrations_collection.find({"student_email": email}):
        tickets.append({
            "registration_id": str(reg["_id"]),
            "event_id": reg["event_id"],
            "event_name": reg["event_name"],
            "date": reg["date"],
            "venue": reg["venue"],
            "status": reg["status"]
        })
    return tickets

@app.put("/events/{event_id}/checkin/{registration_id}")
async def check_in_student(event_id: str, registration_id: str):
    reg = await registrations_collection.find_one({"_id": ObjectId(registration_id), "event_id": event_id})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    if reg.get("status") == "checked-in":
        return {"message": "Student already checked in"}

    await registrations_collection.update_one(
        {"_id": ObjectId(registration_id)},
        {"$set": {"status": "checked-in"}}
    )

    event = await events_collection.find_one({"_id": ObjectId(event_id)})
    category = event.get("category", "General") if event else "General"
    
    points_awarded = (
        50 if category == "Technical" 
        else (40 if category == "Workshop" 
        else (35 if category == "Sports" 
        else 30))
    )

    student_email = reg["student_email"]
    user = await users_collection.find_one({"email": student_email})
    
    if user:
        current_total = user.get("points", 0) + points_awarded
        cat_points = user.get("category_points", {"Technical": 0, "Cultural": 0, "Workshop": 0, "Sports": 0})
        cat_points[category] = cat_points.get(category, 0) + points_awarded
        
        await users_collection.update_one(
            {"email": student_email},
            {"$set": {"points": current_total, "category_points": cat_points}}
        )

    return {"message": "Check-in successful", "points_earned": points_awarded, "category": category}

@app.get("/users/{email}/profile")
async def get_user_profile(email: str):
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "points": user.get("points", 0),
        "category_points": user.get("category_points", {"Technical": 0, "Cultural": 0, "Workshop": 0, "Sports": 0}),
        "redemption_history": user.get("redemption_history", [])
    }

@app.post("/rewards/redeem")
async def redeem_reward(data: RedeemRequest):
    user = await users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_points = user.get("points", 0)
    if current_points < data.reward_cost:
        raise HTTPException(status_code=400, detail="Insufficient points to redeem this reward")
    
    new_points = current_points - data.reward_cost
    
    history_entry = {
        "reward_name": data.reward_name,
        "cost": data.reward_cost,
        "redeemed_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "multiple_use": data.multiple_use
    }
    
    history = user.get("redemption_history", [])
    history.insert(0, history_entry)
    
    await users_collection.update_one(
        {"email": data.email},
        {"$set": {"points": new_points, "redemption_history": history}}
    )
    
    return {"message": f"Successfully redeemed '{data.reward_name}'!", "remaining_points": new_points}