"""
Pydantic Request and Response Models for Smart Bus Tracking v1 API
"""

from typing import Any, Dict, List, Optional
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
    route_id: Optional[str] = None
    emergency_type: str = "general"
    accuracy_m: Optional[float] = None
    note: Optional[str] = None
    has_audio: Optional[bool] = False

class SOSResponse(BaseModel):
    id: str
    reference_code: str
    status: str
    message: str
    police_dispatch: str = "Delhi Police PCR 112"
    control_room: str = "DTC Central Command & Control Centre"
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

# -------------------------------------------------------------
# Phase D: Conductor & Driver Duty Models
# -------------------------------------------------------------
class ConductorPinAuthRequest(BaseModel):
    staff_id: str = Field(min_length=2, max_length=50)
    pin: str = Field(min_length=4, max_length=8)

class ConductorDutyRequest(BaseModel):
    bus_id: int
    route_id: Optional[str] = None

class ConductorDutyResponse(BaseModel):
    id: str
    user_id: str
    bus_id: int
    route_id: str
    status: str
    started_at: str
    ended_at: Optional[str] = None

class ConductorTicketRequest(BaseModel):
    bus_id: int
    fare: int = Field(ge=5, le=100)
    payment_method: str = Field(default="cash", pattern=r"^(cash|upi)$")
    stop_id: Optional[str] = None

class ConductorTicketResponse(BaseModel):
    id: str
    duty_id: Optional[str] = None
    bus_id: int
    fare: int
    payment_method: str
    stop_id: Optional[str] = None
    issued_at: str
    onboard: int

class ConductorLoadPresetRequest(BaseModel):
    bus_id: int
    preset: str = Field(pattern=r"^(empty|seats_free|standing|packed)$")

class ConductorIncidentRequest(BaseModel):
    bus_id: int
    kind: str = Field(pattern=r"^(breakdown|sos|accident|flat_tire|route_deviation|traffic_jam)$")
    note: Optional[str] = ""

# -------------------------------------------------------------
# Phase G: Women's Safety, Live Sharing & Safe Stops
# -------------------------------------------------------------
class TripShareRequest(BaseModel):
    trip_id: Optional[str] = None
    bus_id: Optional[int] = None
    route_id: Optional[str] = None
    hours: int = 3

class TripShareResponse(BaseModel):
    share_token: str
    share_url: str
    expires_at: str
    trip_id: str
    bus_id: int
    route_id: str

class SharedTripLiveTelemetry(BaseModel):
    lat: float
    lng: float
    speed_kmh: float
    crowd_pct: int
    seat_chance: str
    next_stop_name: str
    updated_at: str

class SharedTripPublicResponse(BaseModel):
    token: str
    trip_id: str
    passenger_initials: str
    bus_id: int
    route_id: str
    route_name: str
    board_stop_name: str
    status: str
    boarded_at: str
    expires_at: str
    live_telemetry: Optional[SharedTripLiveTelemetry] = None
    helplines: Dict[str, str]

class SafeStopItem(BaseModel):
    stop_id: str
    name: str
    name_hi: str
    lat: float
    lng: float
    cctv_monitored: bool
    metro_interchange: bool
    police_booth_nearby: bool
    lighting_level: str
    active_routes: List[str]

class HelplineItem(BaseModel):
    name: str
    name_hi: str
    number: str
    description: str
    description_hi: str
    category: str

class LegalConsentRequest(BaseModel):
    telemetry_tracking: bool = True
    emergency_sos_dispatch: bool = True
    essential_cookies: bool = True


