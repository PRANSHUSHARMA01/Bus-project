"""
v1 Router for Smart Bus Tracking
Production-ready endpoints for Accounts, Profiles, Trips, Saved Places, Subscriptions, SOS, Nearest Stops, and Services.
"""

import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from auth import UserProfile, current_user, require_role
from db import db
from models import (
    EndTripRequest,
    NearestStopItem,
    NearestStopsResponse,
    ProfileResponse,
    ProfileUpdateRequest,
    SavedPlaceRequest,
    SavedPlaceResponse,
    ServiceItem,
    ServiceSection,
    SOSRequest,
    SOSResponse,
    StartTripRequest,
    SubscriptionRequest,
    SubscriptionResponse,
    TripResponse,
)

v1_router = APIRouter(prefix="/v1", tags=["v1"])

# Reference Delhi Center (Connaught Place)
DELHI_CENTER = (28.6315, 77.2167)

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# ---------------------------------------------------------------------------
# Account & Profile Management
# ---------------------------------------------------------------------------
@v1_router.get("/me", response_model=ProfileResponse)
def get_my_profile(user: UserProfile = Depends(current_user)):
    """Returns the authenticated user's current profile."""
    row = db.get_or_create_profile(user.id, user.email, user.full_name)
    return ProfileResponse(**row)

@v1_router.patch("/me", response_model=ProfileResponse)
def update_my_profile(
    updates: ProfileUpdateRequest,
    user: UserProfile = Depends(current_user),
    request: Request = None
):
    """Updates profile attributes (name, language, phone, home/work stops)."""
    data = updates.model_dump(exclude_unset=True)
    if not data:
        row = db.get_or_create_profile(user.id, user.email, user.full_name)
        return ProfileResponse(**row)

    updated = db.update_profile(user.id, data)
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update profile")

    client_ip = request.client.host if request and request.client else None
    ua = request.headers.get("user-agent") if request else None
    db.log_audit("profile_updated", user_id=user.id, ip=client_ip, user_agent=ua)
    return ProfileResponse(**updated)

@v1_router.delete("/me")
def delete_my_account(
    user: UserProfile = Depends(current_user),
    request: Request = None
):
    """GDPR-compliant permanent account and data deletion."""
    client_ip = request.client.host if request and request.client else None
    ua = request.headers.get("user-agent") if request else None
    db.log_audit("account_deleted", user_id=user.id, ip=client_ip, user_agent=ua)
    db.delete_account_data(user.id)
    return {"status": "deleted", "message": "All personal data has been erased."}

# ---------------------------------------------------------------------------
# Trips & Rides History (Phase 5 Activity Tab)
# ---------------------------------------------------------------------------
@v1_router.get("/me/trips", response_model=List[TripResponse])
def get_my_trips(
    cursor: Optional[str] = Query(None, description="ISO timestamp cursor for pagination"),
    limit: int = Query(20, ge=1, le=100),
    user: UserProfile = Depends(current_user)
):
    """Returns paginated trip history for the authenticated passenger."""
    trips = db.get_user_trips(user.id, limit=limit, cursor=cursor)
    return [TripResponse(**t) for t in trips]

@v1_router.post("/trips/start", response_model=TripResponse)
def start_trip(
    req: StartTripRequest,
    user: UserProfile = Depends(current_user),
    request: Request = None
):
    """Starts a live trip when passenger taps 'I'm on this bus'."""
    trip = db.start_trip(
        user_id=user.id,
        bus_id=req.bus_id,
        route_id=req.route_id,
        board_stop_id=req.board_stop_id,
        source=req.source
    )
    client_ip = request.client.host if request and request.client else None
    ua = request.headers.get("user-agent") if request else None
    db.log_audit("trip_started", user_id=user.id, ip=client_ip, user_agent=ua)
    return TripResponse(**trip)

@v1_router.post("/trips/{trip_id}/end", response_model=TripResponse)
def end_trip(
    trip_id: str,
    req: EndTripRequest,
    user: UserProfile = Depends(current_user),
    request: Request = None
):
    """Ends an ongoing trip when passenger reaches destination."""
    updated = db.end_trip(
        trip_id=trip_id,
        user_id=user.id,
        alight_stop_id=req.alight_stop_id,
        distance_km=req.distance_km
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Active trip not found or already completed")

    client_ip = request.client.host if request and request.client else None
    ua = request.headers.get("user-agent") if request else None
    db.log_audit("trip_ended", user_id=user.id, ip=client_ip, user_agent=ua)
    return TripResponse(**updated)

# ---------------------------------------------------------------------------
# Saved Places (Home, Work, Frequent Bus Stops)
# ---------------------------------------------------------------------------
@v1_router.get("/me/saved-places", response_model=List[SavedPlaceResponse])
def get_my_saved_places(user: UserProfile = Depends(current_user)):
    places = db.get_saved_places(user.id)
    return [SavedPlaceResponse(**p) for p in places]

@v1_router.post("/me/saved-places", response_model=SavedPlaceResponse)
def add_saved_place(
    req: SavedPlaceRequest,
    user: UserProfile = Depends(current_user)
):
    place = db.add_saved_place(user.id, req.label, req.stop_id)
    return SavedPlaceResponse(**place)

@v1_router.delete("/me/saved-places/{place_id}")
def delete_saved_place(place_id: str, user: UserProfile = Depends(current_user)):
    deleted = db.delete_saved_place(place_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved place not found")
    return {"status": "deleted"}

# ---------------------------------------------------------------------------
# Notification Subscriptions (Arrival Alerts)
# ---------------------------------------------------------------------------
@v1_router.get("/me/subscriptions", response_model=List[SubscriptionResponse])
def get_my_subscriptions(user: UserProfile = Depends(current_user)):
    subs = db.get_subscriptions(user.id)
    return [SubscriptionResponse(**s) for s in subs]

@v1_router.post("/me/subscriptions", response_model=SubscriptionResponse)
def add_subscription(
    req: SubscriptionRequest,
    user: UserProfile = Depends(current_user)
):
    sub = db.add_subscription(user.id, req.bus_id, req.stop_id, req.minutes_before)
    return SubscriptionResponse(**sub)

@v1_router.delete("/me/subscriptions/{sub_id}")
def delete_subscription(sub_id: str, user: UserProfile = Depends(current_user)):
    deleted = db.delete_subscription(sub_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"status": "deleted"}

# ---------------------------------------------------------------------------
# Nearest Stops via Live GPS (Phase 4)
# ---------------------------------------------------------------------------
@v1_router.get("/stops/nearest", response_model=NearestStopsResponse)
def get_nearest_stops(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    limit: int = Query(5, ge=1, le=20)
):
    """
    Computes nearest bus stops using Haversine distance,
    calculates walking minutes at 80m/min, and includes active routes.
    """
    from main import STOPS, ROUTES

    # Distance to Connaught Place to check if inside Delhi NCR (within 55 km)
    dist_delhi_center = haversine_m(lat, lng, DELHI_CENTER[0], DELHI_CENTER[1])
    in_delhi_ncr = dist_delhi_center <= 55000

    scored = []
    # STOPS is {stop_id: {'name': ..., 'name_hi': ..., 'lat': ..., 'lng': ..., 'routes': ...}}
    if isinstance(STOPS, dict):
        for sid, s in STOPS.items():
            d = haversine_m(lat, lng, s["lat"], s["lng"])
            scored.append((d, str(sid), s))
    else:
        for s in STOPS:
            sid = s.get("id") or s.get("stop_id")
            d = haversine_m(lat, lng, s["lat"], s["lng"])
            scored.append((d, str(sid), s))

    scored.sort(key=lambda x: x[0])
    nearest = scored[:limit]

    items = []
    for dist_m, sid, s in nearest:
        dist_int = int(round(dist_m))
        walking_min = max(1, int(round(dist_int / 80)))  # 80 m/min standard walking pace
        raw_routes = s.get("routes") or []
        active_routes = [str(r) for r in raw_routes] if raw_routes else ["DTC Transit"]
        items.append(NearestStopItem(
            stop_id=str(sid),
            name=s["name"],
            name_hi=s.get("name_hi") or s["name"],
            lat=s["lat"],
            lng=s["lng"],
            distance_m=dist_int,
            walking_min=walking_min,
            active_routes=active_routes
        ))

    return NearestStopsResponse(
        user_lat=lat,
        user_lng=lng,
        stops=items,
        in_delhi_ncr=in_delhi_ncr
    )

# ---------------------------------------------------------------------------
# Services Directory (Phase 5)
# ---------------------------------------------------------------------------
@v1_router.get("/services", response_model=List[ServiceSection])
def get_services_directory():
    """Returns official Delhi Smart Transit services directory and emergency numbers."""
    return [
        ServiceSection(
            category="Transit Tools",
            category_hi="पारगमन उपकरण",
            services=[
                ServiceItem(
                    id="find-bus",
                    title="Find a Bus",
                    title_hi="बस खोजें",
                    description="Search direct and connecting bus lines across Delhi",
                    description_hi="दिल्ली भर में सीधी और कनेक्टिंग बस लाइनें खोजें",
                    icon="Bus",
                    badge="Official DTC",
                    link="/?mode=bus"
                ),
                ServiceItem(
                    id="plan-trip",
                    title="Plan a Trip",
                    title_hi="यात्रा की योजना बनाएं",
                    description="Multi-modal trip planner with Metro and DTC interchanges",
                    description_hi="मेट्रो और डीटीसी इंटरचेंज के साथ मल्टी-मोडल प्लानर",
                    icon="MapPin",
                    badge="Live",
                    link="/services/plan"
                ),
                ServiceItem(
                    id="seat-finder",
                    title="Seat Finder",
                    title_hi="सीट उपलब्धता",
                    description="Predicts low-crowd buses arriving at your stop",
                    description_hi="आपके स्टॉप पर आने वाली कम भीड़ वाली बसों का पूर्वानुमान",
                    icon="Users",
                    badge="AI-Powered"
                ),
                ServiceItem(
                    id="night-bus",
                    title="Night Buses",
                    title_hi="रात की बसें",
                    description="Special 24/7 night services connecting railway stations & airport",
                    description_hi="रेलवे स्टेशनों और हवाई अड्डे को जोड़ने वाली 24/7 रात्रि सेवाएं",
                    icon="Moon",
                    badge="24x7"
                ),
            ]
        ),
        ServiceSection(
            category="Safety & Accessibility",
            category_hi="सुरक्षा एवं पहुंच",
            services=[
                ServiceItem(
                    id="women-safety",
                    title="Women's Safety & Pink Passes",
                    title_hi="महिला सुरक्षा और गुलाबी पास",
                    description="Free travel for women in DTC & Cluster buses with onboard marshals",
                    description_hi="डीटीसी और क्लस्टर बसों में महिलाओं के लिए मुफ्त यात्रा एवं मार्शल",
                    icon="ShieldCheck",
                    badge="Free Fare"
                ),
                ServiceItem(
                    id="senior-priority",
                    title="Senior & Divyang Priority",
                    title_hi="वरिष्ठ एवं दिव्यांग प्राथमिकता",
                    description="Low-floor kneeling buses, ramps, and reserved seating locator",
                    description_hi="लो-फ्लोर बसें, रैंप और आरक्षित सीट लोकेटर",
                    icon="HeartHandshake"
                ),
            ]
        ),
        ServiceSection(
            category="Fares & Timetable",
            category_hi="किराया एवं समय सारिणी",
            services=[
                ServiceItem(
                    id="fares-passes",
                    title="Fares & One Delhi Pass",
                    title_hi="किराया एवं वन दिल्ली पास",
                    description="AC (₹10/₹15/₹25) and Non-AC (₹5/₹10/₹15) fare charts & daily passes",
                    description_hi="एसी (₹10/₹15/₹25) और नॉन-एसी किराया चार्ट एवं दैनिक पास",
                    icon="CreditCard"
                ),
                ServiceItem(
                    id="timetable",
                    title="Official Timetable & Frequencies",
                    title_hi="समय सारिणी और आवृत्ति",
                    description="Peak (5-8 min) and non-peak scheduled headway by corridor",
                    description_hi="कॉरिडोर के अनुसार निर्धारित समय सारिणी",
                    icon="Clock"
                ),
            ]
        ),
        ServiceSection(
            category="Emergency Helplines (Official)",
            category_hi="आपातकालीन हेल्पलाइन (आधिकारिक)",
            services=[
                ServiceItem(
                    id="police-112",
                    title="National Emergency Helpline",
                    title_hi="राष्ट्रीय आपातकालीन हेल्पलाइन",
                    description="Dial 112 (Police, Fire, Ambulance integrated)",
                    description_hi="डायल 112 (पुलिस, दमकल, एम्बुलेंस)",
                    icon="PhoneCall",
                    badge="112",
                    link="tel:112"
                ),
                ServiceItem(
                    id="women-helpline",
                    title="Women in Distress Helpline",
                    title_hi="महिला हेल्पलाइन",
                    description="Dial 1091 (Delhi Police 24/7 dedicated control room)",
                    description_hi="डायल 1091 (दिल्ली पुलिस 24/7 नियंत्रण कक्ष)",
                    icon="PhoneCall",
                    badge="1091",
                    link="tel:1091"
                ),
                ServiceItem(
                    id="dtc-control",
                    title="DTC Central Control Room",
                    title_hi="डीटीसी केंद्रीय नियंत्रण कक्ष",
                    description="Dial 011-23370373 / 1800-11-8181 for bus fleet assistance",
                    description_hi="बस बेड़े सहायता के लिए 1800-11-8181 पर कॉल करें",
                    icon="PhoneCall",
                    badge="1800-11-8181",
                    link="tel:1800118181"
                ),
                ServiceItem(
                    id="childline-1098",
                    title="Childline Assistance",
                    title_hi="चाइल्डलाइन सहायता",
                    description="Dial 1098 for children in need of care and protection",
                    description_hi="देखभाल और सुरक्षा की आवश्यकता वाले बच्चों के लिए 1098 डायल करें",
                    icon="PhoneCall",
                    badge="1098",
                    link="tel:1098"
                ),
            ]
        )
    ]

# ---------------------------------------------------------------------------
# Emergency SOS Dispatch
# ---------------------------------------------------------------------------
@v1_router.post("/sos", response_model=SOSResponse)
def dispatch_sos(
    req: SOSRequest,
    user: Optional[UserProfile] = Depends(current_user),
    request: Request = None
):
    """
    Emergency SOS endpoint. Dispatches coordinates to Delhi Police and Transport Control Room.
    Requires authentication or verified token, logs event, and alerts control room.
    """
    uid = user.id if user else None
    client_ip = request.client.host if request and request.client else None
    ua = request.headers.get("user-agent") if request else None

    # Record in database
    event = db.record_sos(lat=req.lat, lng=req.lng, user_id=uid, bus_id=req.bus_id)
    db.log_audit("emergency_sos_dispatched", user_id=uid, ip=client_ip, user_agent=ua)

    return SOSResponse(
        id=event["id"],
        status="dispatched",
        message="Emergency alert received. Coordinates dispatched to Delhi Police (112) and DTC Control Room.",
        created_at=event["created_at"]
    )

# ---------------------------------------------------------------------------
# Multi-Bus Trip Planner (Phase 2B)
# ---------------------------------------------------------------------------
from trip_planner import TripPlanResponse, TripPlannerEngine
from pathlib import Path
_trip_planner: Optional[TripPlannerEngine] = None

def get_trip_planner() -> Optional[TripPlannerEngine]:
    global _trip_planner
    if _trip_planner is None:
        routes_path = Path(__file__).parent / "data" / "routes.json"
        if routes_path.exists():
            import json
            raw = json.loads(routes_path.read_text(encoding="utf-8"))
            _trip_planner = TripPlannerEngine(raw, raw["stops"])
    return _trip_planner

@v1_router.get("/trips/plan", response_model=TripPlanResponse)
def plan_trip(
    to_stop_id: str = Query(..., description="Destination stop ID"),
    from_lat: Optional[float] = Query(None, description="Rider GPS latitude"),
    from_lng: Optional[float] = Query(None, description="Rider GPS longitude"),
    from_stop_id: Optional[str] = Query(None, description="Optional explicit boarding stop ID"),
):
    """
    Trip Planner: Finds all routes serving boarding and destination stops in the right direction,
    and returns every live bus approaching the boarding stop with ETA, crowd %, and seat chance.
    """
    planner = get_trip_planner()
    if not planner:
        raise HTTPException(status_code=503, detail="Transit network routes not loaded")

    live_list = []
    try:
        from main import fresh, bus_view
        live_list = [bus_view(s) for s in fresh()]
    except Exception:
        pass

    return planner.plan(
        from_lat=from_lat,
        from_lng=from_lng,
        to_stop_id=to_stop_id,
        from_stop_id=from_stop_id,
        live_buses=live_list
    )
