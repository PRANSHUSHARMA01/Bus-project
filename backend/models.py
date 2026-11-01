"""
Pydantic Request and Response Models for Smart Bus Tracking v1 API
"""

from typing import List, Optional
from pydantic import BaseModel, Field

# Profile Models
class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = Field(None, pattern="^(en|hi)$")
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    home_stop_id: Optional[str] = None
    work_stop_id: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    language: str = "en"
    role: str = "passenger"
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    home_stop_id: Optional[str] = None
    work_stop_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# Trip Models
class StartTripRequest(BaseModel):
    bus_id: int
    route_id: str
    board_stop_id: str
    source: str = "live"

class EndTripRequest(BaseModel):
    alight_stop_id: Optional[str] = None
    distance_km: Optional[float] = None

class TripResponse(BaseModel):
    id: str
    user_id: str
    bus_id: int
    route_id: str
    board_stop_id: str
    alight_stop_id: Optional[str] = None
    boarded_at: str
    alighted_at: Optional[str] = None
    distance_km: Optional[float] = None
    status: str
    source: str

# Saved Places Models
class SavedPlaceRequest(BaseModel):
    label: str
    stop_id: str

class SavedPlaceResponse(BaseModel):
    id: str
    user_id: str
    label: str
    stop_id: str
    created_at: str

# Notifications / Arrival Subscriptions Models
class SubscriptionRequest(BaseModel):
    bus_id: int
    stop_id: str
    minutes_before: int = 5

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    bus_id: int
    stop_id: str
    minutes_before: int
    created_at: str
    fired_at: Optional[str] = None

# SOS Emergency Dispatch Models
class SOSRequest(BaseModel):
    lat: float
    lng: float
    bus_id: Optional[int] = None
    emergency_type: str = "general"

class SOSResponse(BaseModel):
    id: str
    status: str
    message: str
    created_at: str

# Nearest Stops Models
class NearestStopItem(BaseModel):
    stop_id: str
    name: str
    name_hi: str
    lat: float
    lng: float
    distance_m: int
    walking_min: int
    active_routes: List[str]

class NearestStopsResponse(BaseModel):
    user_lat: float
    user_lng: float
    stops: List[NearestStopItem]
    in_delhi_ncr: bool

# Services Directory
class ServiceItem(BaseModel):
    id: str
    title: str
    title_hi: str
    description: str
    description_hi: str
    icon: str
    badge: Optional[str] = None
    link: Optional[str] = None

class ServiceSection(BaseModel):
    category: str
    category_hi: str
    services: List[ServiceItem]

# Emergency Contacts Models (Women's Safety & Family Sharing)
class EmergencyContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=5, max_length=20)
    relationship: Optional[str] = Field(default="Family", max_length=50)

class EmergencyContactResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    relationship: Optional[str] = "Family"
    is_verified: int = 0
    created_at: str

