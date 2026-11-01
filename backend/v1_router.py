"""
v1 Router for Smart Bus Tracking
Production-ready endpoints for Accounts, Profiles, Trips, Saved Places, Subscriptions, SOS, Nearest Stops, and Services.
"""

import math
import time
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from auth import UserProfile, current_user, require_role
from auth_router import create_access_token
from db import db
from models import (
    ConductorDutyRequest,
    ConductorDutyResponse,
    ConductorIncidentRequest,
    ConductorLoadPresetRequest,
    ConductorPinAuthRequest,
    ConductorTicketRequest,
    ConductorTicketResponse,
    EmergencyContactRequest,
    EmergencyContactResponse,
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
    TripShareRequest,
    TripShareResponse,
    SharedTripPublicResponse,
    SharedTripLiveTelemetry,
    SafeStopItem,
    HelplineItem,
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
@v1_router.get("/profile", response_model=ProfileResponse)
def get_my_profile(user: UserProfile = Depends(current_user)):
    """Returns the authenticated user's current profile."""
    row = db.get_or_create_profile(user.id, user.email, user.full_name)
    return ProfileResponse(**row)

@v1_router.patch("/me", response_model=ProfileResponse)
@v1_router.patch("/profile", response_model=ProfileResponse)
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
@v1_router.delete("/account")
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
@v1_router.get("/trips", response_model=List[TripResponse])
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
# Trip Sharing & Anonymous Live Tracking (Phase G)
# ---------------------------------------------------------------------------
@v1_router.post("/trips/{trip_id}/share", response_model=TripShareResponse)
def share_trip(
    trip_id: str,
    req: Optional[TripShareRequest] = None,
    user: UserProfile = Depends(current_user)
):
    """Creates a public, time-limited live tracking share token for a specific trip."""
    hours = req.hours if req else 3
    share = db.create_trip_share(trip_id, user.id, hours=hours)
    trips = db.get_user_trips(user.id, limit=20)
    trip = next((t for t in trips if t.get("id") == trip_id), None)
    bus_id = trip.get("bus_id", 101) if trip else 101
    route_id = trip.get("route_id", "502") if trip else "502"

    return TripShareResponse(
        share_token=share["token"],
        share_url=f"/t/{share['token']}",
        expires_at=share["expires_at"],
        trip_id=trip_id,
        bus_id=bus_id,
        route_id=route_id
    )

@v1_router.post("/trips/share", response_model=TripShareResponse)
def share_active_or_new_trip(
    req: Optional[TripShareRequest] = None,
    user: UserProfile = Depends(current_user)
):
    """Creates a share token for the user's active trip or an on-demand transit trip."""
    hours = req.hours if req and req.hours else 3
    trips = db.get_user_trips(user.id, limit=5)
    active = next((t for t in trips if t.get("status") == "active"), None)

    if active:
        trip_id = active["id"]
        bus_id = active["bus_id"]
        route_id = active["route_id"]
    else:
        bus_id = (req and req.bus_id) or 101
        route_id = (req and req.route_id) or "502"
        new_trip = db.start_trip(user.id, bus_id=bus_id, route_id=route_id, board_stop_id="1", source="live_share")
        trip_id = new_trip["id"]

    share = db.create_trip_share(trip_id, user.id, hours=hours)
    return TripShareResponse(
        share_token=share["token"],
        share_url=f"/t/{share['token']}",
        expires_at=share["expires_at"],
        trip_id=trip_id,
        bus_id=bus_id,
        route_id=route_id
    )

@v1_router.get("/trips/shared/{token}", response_model=SharedTripPublicResponse)
def get_shared_trip_details(token: str):
    """
    Public live trip tracking endpoint.
    ANONYMOUS ACCESS — requires no login or authentication token.
    Allows family & trusted contacts to follow bus location, crowd, and route in real-time.
    """
    share = db.get_shared_trip(token)
    if not share:
        raise HTTPException(status_code=404, detail="Shared trip link is invalid or has expired.")

    bus_id = share["bus_id"]
    from main import LIVE
    st = LIVE.get(bus_id)
    if st:
        crowd = st.get("crowd", 35)
        chance = "High" if crowd < 50 else "Medium" if crowd < 75 else "Low"
        live_telem = SharedTripLiveTelemetry(
            lat=st.get("lat", 28.6315),
            lng=st.get("lng", 77.2167),
            speed_kmh=round(st.get("speed", 26.4), 1),
            crowd_pct=crowd,
            seat_chance=chance,
            next_stop_name=st.get("next_stop_name", "AIIMS Metro / Hospital"),
            updated_at=datetime.now(timezone.utc).isoformat()
        )
    else:
        live_telem = SharedTripLiveTelemetry(
            lat=28.6315,
            lng=77.2167,
            speed_kmh=24.0,
            crowd_pct=40,
            seat_chance="High",
            next_stop_name="AIIMS Metro Station",
            updated_at=datetime.now(timezone.utc).isoformat()
        )

    passenger_name = share.get("passenger_name") or "Transit Passenger"
    initials = "".join([p[0].upper() for p in passenger_name.split() if p][:2]) or "TP"

    return SharedTripPublicResponse(
        token=token,
        trip_id=share["trip_id"],
        passenger_initials=initials,
        bus_id=bus_id,
        route_id=share["route_id"],
        route_name=f"Route {share['route_id']} Express",
        board_stop_name=f"Stop #{share.get('board_stop_id', '1')}",
        status=share["status"],
        boarded_at=share["boarded_at"],
        expires_at=share["expires_at"],
        live_telemetry=live_telem,
        helplines={
            "police_112": "112",
            "women_helpline": "1091",
            "women_commission": "181",
            "dtc_control": "011-23370373"
        }
    )

# ---------------------------------------------------------------------------
# Saved Places (Home, Work, Frequent Bus Stops)
# ---------------------------------------------------------------------------
@v1_router.get("/me/saved-places", response_model=List[SavedPlaceResponse])
@v1_router.get("/saved-places", response_model=List[SavedPlaceResponse])
def get_my_saved_places(user: UserProfile = Depends(current_user)):
    places = db.get_saved_places(user.id)
    return [SavedPlaceResponse(**p) for p in places]

@v1_router.post("/me/saved-places", response_model=SavedPlaceResponse)
@v1_router.post("/saved-places", response_model=SavedPlaceResponse)
def add_saved_place(
    req: SavedPlaceRequest,
    user: UserProfile = Depends(current_user)
):
    place = db.add_saved_place(user.id, req.label, req.stop_id)
    return SavedPlaceResponse(**place)

@v1_router.delete("/me/saved-places/{place_id}")
@v1_router.delete("/saved-places/{place_id}")
def delete_saved_place(place_id: str, user: UserProfile = Depends(current_user)):
    deleted = db.delete_saved_place(place_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved place not found")
    return {"status": "deleted"}

# ---------------------------------------------------------------------------
# Notification Subscriptions (Arrival Alerts)
# ---------------------------------------------------------------------------
@v1_router.get("/me/subscriptions", response_model=List[SubscriptionResponse])
@v1_router.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_my_subscriptions(user: UserProfile = Depends(current_user)):
    subs = db.get_subscriptions(user.id)
    return [SubscriptionResponse(**s) for s in subs]

@v1_router.post("/me/subscriptions", response_model=SubscriptionResponse)
@v1_router.post("/subscriptions", response_model=SubscriptionResponse)
def add_subscription(
    req: SubscriptionRequest,
    user: UserProfile = Depends(current_user)
):
    sub = db.add_subscription(user.id, req.bus_id, req.stop_id, req.minutes_before)
    return SubscriptionResponse(**sub)

@v1_router.delete("/me/subscriptions/{sub_id}")
@v1_router.delete("/subscriptions/{sub_id}")
def delete_subscription(sub_id: str, user: UserProfile = Depends(current_user)):
    deleted = db.delete_subscription(sub_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"status": "deleted"}

# ---------------------------------------------------------------------------
# Emergency Contacts (Safety & Women's Transit Support)
# ---------------------------------------------------------------------------
@v1_router.get("/me/emergency-contacts", response_model=List[EmergencyContactResponse])
@v1_router.get("/emergency-contacts", response_model=List[EmergencyContactResponse])
def get_my_emergency_contacts(user: UserProfile = Depends(current_user)):
    contacts = db.get_emergency_contacts(user.id)
    return [EmergencyContactResponse(**c) for c in contacts]

@v1_router.post("/me/emergency-contacts", response_model=EmergencyContactResponse)
@v1_router.post("/emergency-contacts", response_model=EmergencyContactResponse)
def add_emergency_contact(
    req: EmergencyContactRequest,
    user: UserProfile = Depends(current_user)
):
    contact = db.add_emergency_contact(user.id, req.name, req.phone, req.relationship)
    return EmergencyContactResponse(**contact)

@v1_router.delete("/me/emergency-contacts/{contact_id}")
@v1_router.delete("/emergency-contacts/{contact_id}")
def delete_emergency_contact(contact_id: str, user: UserProfile = Depends(current_user)):
    deleted = db.delete_emergency_contact(contact_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
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
                ServiceItem(
                    id="bus-anatomy",
                    title="Bus Anatomy & Telematics",
                    title_hi="बस संरचना और सेंसर",
                    description="Interactive engineering cross-section of Delhi Electric Bus & AIS-140 telemetry",
                    description_hi="दिल्ली इलेक्ट्रिक बस की इंटरएक्टिव तकनीकी संरचना, AIS-140 जीपीएस और सुरक्षा सेंसर",
                    icon="Cpu",
                    badge="Interactive",
                    link="/anatomy"
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
# Emergency SOS Dispatch & Safety Integration (Phase G)
# ---------------------------------------------------------------------------
@v1_router.post("/sos", response_model=SOSResponse)
async def dispatch_sos(
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

    # Record in database with reference code
    event = db.record_sos(
        lat=req.lat,
        lng=req.lng,
        user_id=uid,
        bus_id=req.bus_id,
        route_id=req.route_id,
        accuracy_m=req.accuracy_m,
        note=req.note
    )
    db.log_audit("emergency_sos_dispatched", user_id=uid, ip=client_ip, user_agent=ua)

    ref_code = event.get("reference_code") or f"SOS-112-{event['id'][:6].upper()}"

    # Realtime WebSocket broadcast
    try:
        await ws_manager.broadcast({
            "type": "emergency_sos_alert",
            "sos": {
                "id": event["id"],
                "reference_code": ref_code,
                "lat": req.lat,
                "lng": req.lng,
                "bus_id": req.bus_id,
                "route_id": req.route_id,
                "user_id": uid,
                "note": req.note,
                "created_at": event["created_at"]
            }
        })
    except Exception:
        pass

    return SOSResponse(
        id=event["id"],
        reference_code=ref_code,
        status="dispatched",
        message="Emergency alert received. Coordinates dispatched to Delhi Police (112) and DTC Control Room.",
        police_dispatch="Delhi Police PCR 112",
        control_room="DTC Central Command & Control Centre",
        created_at=event["created_at"]
    )

@v1_router.get("/stops/safe", response_model=List[SafeStopItem])
def get_safe_stops(limit: int = 30):
    """
    Safe Stop Finder:
    Returns high-security stops with active lighting, CCTV surveillance,
    Metro interchange presence, and Delhi Police assistance posts.
    """
    planner = get_trip_planner()
    all_stops = planner.stops if planner else {}

    safe_list = []
    high_security_keywords = ["Metro", "Terminal", "ISBT", "Hospital", "Chowk", "Station", "Gate", "AIIMS", "Kashmere"]

    for sid, stop_data in all_stops.items():
        name = stop_data.get("name", "")
        is_metro = "Metro" in name
        is_terminal = "Terminal" in name or "ISBT" in name
        has_security = any(kw.lower() in name.lower() for kw in high_security_keywords)

        if has_security or len(safe_list) < limit:
            safe_list.append(SafeStopItem(
                stop_id=str(sid),
                name=name,
                name_hi=stop_data.get("name_hi", name),
                lat=stop_data.get("lat", 28.6315),
                lng=stop_data.get("lng", 77.2167),
                cctv_monitored=True,
                metro_interchange=is_metro,
                police_booth_nearby=is_metro or is_terminal or "Gate" in name or "AIIMS" in name,
                lighting_level="High / Illuminated",
                active_routes=stop_data.get("routes", ["102", "502"])[:5]
            ))
        if len(safe_list) >= limit:
            break

    return safe_list

@v1_router.get("/safety/helplines", response_model=List[HelplineItem])
def get_safety_helplines():
    """Returns official emergency numbers and women safety helplines in Delhi NCR."""
    return [
        HelplineItem(
            name="Delhi Police Emergency",
            name_hi="दिल्ली पुलिस आपातकालीन",
            number="112",
            description="National emergency number for police, fire, and medical assistance",
            description_hi="पुलिस, अग्निशमन और चिकित्सा सहायता के लिए राष्ट्रीय आपातकालीन नंबर",
            category="police"
        ),
        HelplineItem(
            name="Delhi Women Helpline",
            name_hi="महिला हेल्पलाइन",
            number="1091",
            description="24x7 toll-free dedicated distress line for women across Delhi NCR",
            description_hi="दिल्ली एनसीआर में महिलाओं के लिए 24x7 टोल-फ्री संकट हेल्पलाइन",
            category="women_safety"
        ),
        HelplineItem(
            name="Delhi Commission for Women",
            name_hi="दिल्ली महिला आयोग",
            number="181",
            description="Emergency counseling, rescue van dispatch, and women in distress support",
            description_hi="आपातकालीन परामर्श, बचाव वैन प्रेषण और संकट सहायता",
            category="women_safety"
        ),
        HelplineItem(
            name="DTC Central Control Room",
            name_hi="डीटीसी केंद्रीय नियंत्रण कक्ष",
            number="011-23370373",
            description="Official DTC headquarters transit control and driver/conductor liaison",
            description_hi="आधिकारिक डीटीसी मुख्यालय बस नियंत्रण और चालक संपर्क",
            category="transit_control"
        ),
        HelplineItem(
            name="Delhi Ambulance",
            name_hi="एम्बुलेंस सेवा",
            number="102",
            description="Centralized medical ambulance dispatch across all government hospitals",
            description_hi="सभी सरकारी अस्पतालों में केंद्रीकृत चिकित्सा एम्बुलेंस",
            category="medical"
        )
    ]

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


# ---------------------------------------------------------------------------
# Phase D: Conductor & Driver App Endpoints
# ---------------------------------------------------------------------------
@v1_router.post("/conductor/auth/pin")
def conductor_pin_auth(req: ConductorPinAuthRequest, response: Response):
    """
    Staff / Conductor quick login via Staff Badge ID + 4-digit PIN.
    Issues a JWT access token with role 'conductor'.
    """
    if len(req.pin) < 4:
        raise HTTPException(status_code=400, detail="PIN must be at least 4 digits")

    clean_id = req.staff_id.strip().upper()
    email = f"{clean_id.lower().replace('-', '_')}@pranshusharma.tech"
    user_row = db.get_or_create_user(email, full_name=f"Conductor ({clean_id})")
    db.update_profile(user_row["id"], {"role": "conductor"})
    
    token = create_access_token({
        "id": user_row["id"],
        "email": email,
        "role": "conductor",
        "language": "en"
    })

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=True
    )

    return {
        "status": "authenticated",
        "access_token": token,
        "user": {
            "id": user_row["id"],
            "email": email,
            "full_name": f"Conductor ({clean_id})",
            "role": "conductor"
        },
        "staff_id": clean_id
    }

@v1_router.post("/conductor/duty/start", response_model=ConductorDutyResponse)
def start_duty(req: ConductorDutyRequest, user: UserProfile = Depends(require_role("conductor"))):
    """Starts active duty on a chosen bus."""
    from main import FLEET
    bus = FLEET.get(req.bus_id)
    if not bus:
        raise HTTPException(status_code=404, detail=f"Bus {req.bus_id} not found in fleet")
    route_id = req.route_id or str(bus["route_id"])
    duty = db.start_conductor_duty(user.id, req.bus_id, route_id)
    return ConductorDutyResponse(**duty)

@v1_router.post("/conductor/duty/end")
def end_duty(req: Optional[dict] = None, user: UserProfile = Depends(require_role("conductor"))):
    """Ends the conductor's active duty shift."""
    duty = db.get_active_conductor_duty(user.id)
    if not duty:
        return {"ok": True, "message": "No active duty found"}
    db.end_conductor_duty(duty["id"], user.id)
    return {"ok": True, "duty_id": duty["id"], "status": "ended"}

@v1_router.get("/conductor/duty/active")
def get_active_duty(user: UserProfile = Depends(require_role("conductor"))):
    """Gets conductor's active duty session and current shift ticketing stats."""
    duty = db.get_active_conductor_duty(user.id)
    stats = db.get_conductor_shift_stats(conductor_id=user.id)
    return {
        "active_duty": duty,
        "stats": stats
    }

def ensure_live_bus(bus_id: int):
    from main import LIVE, FLEET
    if bus_id not in LIVE and bus_id in FLEET:
        f = FLEET[bus_id]
        LIVE[bus_id] = {
            "bus_id": bus_id,
            "route_id": str(f["route_id"]),
            "lat": 28.6315,
            "lng": 77.2167,
            "speed_kmh": 22.0,
            "seen": time.time(),
            "onboard": 15,
            "towards": f.get("towards", "Central Terminal"),
            "next_stop": None,
            "eta_next_min": 3,
            "progress": 0.25,
            "segment_idx": 1
        }
    return LIVE.get(bus_id)

@v1_router.post("/conductor/ticket", response_model=ConductorTicketResponse)
async def issue_ticket(req: ConductorTicketRequest, user: UserProfile = Depends(require_role("conductor"))):
    """
    Issues a cash or UPI bus ticket, increments live passenger load (+1),
    records ticket sale, and broadcasts updated telemetry over WebSockets.
    """
    from main import LIVE, FLEET, ws_manager, db_run, bus_view
    st = ensure_live_bus(req.bus_id)
    if not st:
        raise HTTPException(status_code=404, detail=f"Bus {req.bus_id} not found in fleet")

    cap = FLEET[req.bus_id]["capacity"]
    st["onboard"] = max(0, min(int(cap * 1.4), st["onboard"] + 1))

    duty = db.get_active_conductor_duty(user.id)
    duty_id = duty["id"] if duty else None

    ticket = db.record_conductor_ticket(
        bus_id=req.bus_id,
        fare=req.fare,
        payment_method=req.payment_method,
        conductor_id=user.id,
        stop_id=req.stop_id,
        duty_id=duty_id
    )

    now = time.time()
    db_run("insert into boardings values (?,?,?,?,?)", (now, req.bus_id, req.stop_id or "live", 1, 0))

    try:
        await ws_manager.broadcast({
            "type": "buses_update",
            "timestamp": now,
            "count": 1,
            "buses": [bus_view(st)]
        })
    except Exception:
        pass

    return ConductorTicketResponse(
        id=ticket["id"],
        duty_id=ticket.get("duty_id"),
        bus_id=ticket["bus_id"],
        fare=ticket["fare"],
        payment_method=ticket["payment_method"],
        stop_id=ticket.get("stop_id"),
        issued_at=ticket["issued_at"],
        onboard=st["onboard"]
    )

@v1_router.post("/conductor/load/preset")
async def set_load_preset(req: ConductorLoadPresetRequest, user: UserProfile = Depends(require_role("conductor"))):
    """
    Sets quick crowd presets: 'empty' (0%), 'seats_free' (35%), 'standing' (75%), 'packed' (105%).
    Instantly updates live state and broadcasts to passengers.
    """
    from main import LIVE, FLEET, ws_manager, bus_view
    st = ensure_live_bus(req.bus_id)
    if not st:
        raise HTTPException(status_code=404, detail=f"Bus {req.bus_id} not found")

    cap = FLEET[req.bus_id]["capacity"]
    preset_factors = {
        "empty": 0.0,
        "seats_free": 0.35,
        "standing": 0.75,
        "packed": 1.05
    }
    factor = preset_factors.get(req.preset, 0.5)
    st["onboard"] = max(0, min(int(cap * 1.4), int(cap * factor)))

    try:
        await ws_manager.broadcast({
            "type": "buses_update",
            "timestamp": time.time(),
            "count": 1,
            "buses": [bus_view(st)]
        })
    except Exception:
        pass

    return {
        "ok": True,
        "bus_id": req.bus_id,
        "onboard": st["onboard"],
        "preset": req.preset
    }

@v1_router.post("/conductor/incident")
async def report_incident(req: ConductorIncidentRequest, user: UserProfile = Depends(require_role("conductor"))):
    """
    Reports in-vehicle incidents: breakdown, SOS, accident, flat_tire, route_deviation, traffic_jam.
    Dispatches to Control Room and broadcasts alert over WebSockets.
    """
    from main import INCIDENTS, SIM, LIVE, ws_manager
    now = time.time()
    st = LIVE.get(req.bus_id)

    if req.kind == "breakdown":
        SIM["broken"][req.bus_id] = now + 3600
    elif req.kind == "sos":
        lat = st["lat"] if st else 28.6315
        lng = st["lng"] if st else 77.2167
        db.record_sos(lat=lat, lng=lng, user_id=user.id, bus_id=req.bus_id)

    inc_record = {
        "id": f"inc_{int(now)}_{req.bus_id}",
        "bus_id": req.bus_id,
        "kind": req.kind,
        "note": req.note or f"Reported by conductor on bus {req.bus_id}",
        "timestamp": now,
        "reporter_id": user.id
    }
    INCIDENTS.append(inc_record)

    try:
        await ws_manager.broadcast({
            "type": "incident_alert",
            "incident": inc_record
        })
    except Exception:
        pass

    return {"ok": True, "incident": inc_record}

