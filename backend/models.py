from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List
from datetime import datetime

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