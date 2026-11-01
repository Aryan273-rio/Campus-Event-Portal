from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from models import EventSchema, EventUpdateSchema, RegistrationSchema, UserRegister, UserLogin, RedeemRequest
from database import events_collection, registrations_collection, parse_mongo_id, db
from datetime import datetime
import hashlib
import jwt
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = FastAPI(title="College Event Management API")

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-hackathon-key")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

users_collection = db.get_collection("users")

AUTHORIZED_ORGANIZERS = [
    "aryansagar.cs24@bmsce.ac.in",
    "organizer@college.edu"
]

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def send_confirmation_email(email: str, event_name: str, reg_id: str):
    print(f"📧 BACKGROUND TASK: Email sent to {email} for '{event_name}'. Ticket ID: {reg_id}")

# --- AUTH ENDPOINTS ---
@app.post("/auth/signup", status_code=201)
async def signup(user: UserRegister):
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user.role == "organizer":
        if user.email not in AUTHORIZED_ORGANIZERS:
            raise HTTPException(
                status_code=403, 
                detail="Access Denied: This email address is not authorized to register as an organizer."
            )
    
    user_dict = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role,
        "points": 0,
        "category_points": {"Technical": 0, "Cultural": 0, "Workshop": 0, "Sports": 0},
        "redemption_history": []
    }
    result = await users_collection.insert_one(user_dict)
    return {"message": "User created successfully", "user_id": str(result.inserted_id), "role": user.role}

@app.post("/auth/login")
async def login(creds: UserLogin):
    user = await users_collection.find_one({"email": creds.email, "password": hash_password(creds.password)})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    token_data = {"email": user["email"], "role": user["role"], "name": user["name"]}
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
    return {
        "message": "Login successful",
        "token": token, 
        "role": user["role"], 
        "name": user["name"], 
        "email": user["email"]
    }

# --- EVENT ENDPOINTS ---
@app.post("/events/", status_code=201)
async def create_event(event: EventSchema):
    event_dict = event.model_dump()
    new_event = await events_collection.insert_one(event_dict)
    created_event = await events_collection.find_one({"_id": new_event.inserted_id})
    return parse_mongo_id(created_event)

@app.get("/events/")
async def list_events(category: str = Query(None), search: str = Query(None)):
    query = {}
    if category and category != "":
        query["category"] = category
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
        
    events = []
    async for event in events_collection.find(query):
        ev = parse_mongo_id(event)
        count = await registrations_collection.count_documents({"event_id": ev["id"]})
        ev["registered_count"] = count
        events.append(ev)
    return events

@app.get("/events/{event_id}")
async def get_event(event_id: str):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    event = await events_collection.find_one({"_id": ObjectId(event_id)})
    if event:
        ev = parse_mongo_id(event)
        ev["registered_count"] = await registrations_collection.count_documents({"event_id": event_id})
        return ev
    raise HTTPException(status_code=404, detail="Event not found")

@app.put("/events/{event_id}")
async def update_event(event_id: str, event_update: EventUpdateSchema):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
        
    update_data = {k: v for k, v in event_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    if len(update_data) >= 1:
        await events_collection.update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
            
    updated_event = await events_collection.find_one({"_id": ObjectId(event_id)})
    if updated_event:
        return parse_mongo_id(updated_event)
    raise HTTPException(status_code=404, detail="Event not found")

@app.delete("/events/{event_id}")
async def delete_event(event_id: str):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
        
    delete_result = await events_collection.delete_one({"_id": ObjectId(event_id)})
    if delete_result.deleted_count == 1:
        await registrations_collection.delete_many({"event_id": event_id})
        return {"message": "Event deleted successfully"}
    raise HTTPException(status_code=404, detail="Event not found")

# --- REGISTRATIONS & TICKETS ---
@app.post("/events/{event_id}/register", status_code=201)
async def register_for_event(event_id: str, reg_data: RegistrationSchema, background_tasks: BackgroundTasks):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")

    event = await events_collection.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    current_regs = await registrations_collection.count_documents({"event_id": event_id})
    if current_regs >= event["max_capacity"]:
        raise HTTPException(status_code=400, detail="Event has reached maximum capacity")
        
    existing_reg = await registrations_collection.find_one({"event_id": event_id, "student_email": reg_data.student_email})
    if existing_reg:
        raise HTTPException(status_code=400, detail="Student already registered for this event")
        
    new_reg_dict = reg_data.model_dump()
    new_reg_dict["event_id"] = event_id
    new_reg_dict["event_name"] = event["title"]
    new_reg_dict["date"] = event["date"]
    new_reg_dict["venue"] = event["venue"]
    new_reg_dict["registered_at"] = datetime.utcnow()
    new_reg_dict["status"] = "registered"
    
    new_reg = await registrations_collection.insert_one(new_reg_dict)
    reg_id_str = str(new_reg.inserted_id)
    
    background_tasks.add_task(send_confirmation_email, reg_data.student_email, event["title"], reg_id_str)
    return {"message": "Registration successful", "registration_id": reg_id_str}

@app.get("/events/{event_id}/participants")
async def list_participants(event_id: str, search: str = Query(None)):
    query = {"event_id": event_id}
    if search:
        query["$or"] = [
            {"student_name": {"$regex": search, "$options": "i"}},
            {"student_email": {"$regex": search, "$options": "i"}},
            {"usn": {"$regex": search, "$options": "i"}}
        ]
    participants = []
    async for reg in registrations_collection.find(query):
        participants.append(parse_mongo_id(reg))
    return participants

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
    multiple_use = getattr(data, "multiple_use", False)
    
    history_entry = {
        "reward_name": data.reward_name,
        "cost": data.reward_cost,
        "redeemed_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "multiple_use": multiple_use
    }
    
    history = user.get("redemption_history", [])
    history.insert(0, history_entry) 
    
    await users_collection.update_one(
        {"email": data.email},
        {"$set": {"points": new_points, "redemption_history": history}}
    )
    
    return {"message": f"Successfully redeemed '{data.reward_name}'!", "remaining_points": new_points}

@app.get("/tickets/{email}")
async def get_student_tickets(email: str):
    tickets = []
    async for reg in registrations_collection.find({"student_email": email}):
        event = await events_collection.find_one({"_id": ObjectId(reg["event_id"])})
        if event:
            tickets.append({
                "registration_id": str(reg["_id"]),
                "event_id": reg["event_id"],
                "event_name": event["title"],
                "date": event["date"],
                "venue": event["venue"],
                "status": reg.get("status", "registered")
            })
    return tickets

@app.get("/generate-description/")
async def generate_ai_description(title: str, category: str):
    if not GEMINI_API_KEY:
        return {"description": f"An amazing {category} event coming soon! Join us for '{title}' and experience something incredible."}
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"Write a short, exciting, 2-sentence event description for a college {category} event titled '{title}'."
        response = model.generate_content(prompt)
        return {"description": response.text.replace("*", "")}
    except Exception as e:
        return {"description": f"An amazing {category} event coming soon! Join us for '{title}' and experience something incredible."}