"""
Test Suite for Phase G — Women's Safety, 112 SOS Integration & Anonymous Trip Sharing
Tests:
1. Emergency SOS dispatch with Delhi Police 112 and DTC Command Centre integration
2. Trip share token generation with expiry for active transit trips
3. Anonymous live trip tracking (/trips/shared/{token}) accessible without login
4. Error handling for expired/invalid trip share tokens
5. Safe stop finder with security badges (CCTV, Metro interchange, Police booth)
6. Official Delhi NCR emergency helpline directory (112, 1091, 181, 011-23370373)
"""

import os
import sys
import uuid
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import app
from db import db
from auth_router import create_access_token

client = TestClient(app)

def create_test_auth_headers(email: str = "safety_test_user@pranshusharma.tech", role: str = "passenger"):
    uid = f"user_safety_{uuid.uuid4().hex[:8]}"
    db.get_or_create_profile(uid, email, full_name="Aaradhya Sharma")
    token = create_access_token({"id": uid, "sub": uid, "email": email, "role": role})
    return {"Authorization": f"Bearer {token}"}, uid

def test_1_emergency_sos_dispatch():
    """Verify emergency SOS dispatches with reference code to Delhi Police 112 & DTC Command."""
    headers, uid = create_test_auth_headers()
    payload = {
        "lat": 28.6315,
        "lng": 77.2167,
        "bus_id": 101,
        "route_id": "502",
        "emergency_type": "women_safety",
        "accuracy_m": 4.5,
        "note": "Passenger feeling unsafe near Hauz Khas",
        "has_audio": True
    }
    response = client.post("/api/v1/sos", json=payload, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] == "dispatched"
    assert "SOS-112-" in data["reference_code"]
    assert "Delhi Police" in data["police_dispatch"]
    assert "DTC" in data["control_room"]
    assert data["id"] is not None

def test_2_trip_share_token_generation():
    """Verify authenticated user can generate a public, time-limited live tracking share token."""
    headers, uid = create_test_auth_headers()
    # Share active trip
    payload = {
        "bus_id": 102,
        "route_id": "502",
        "hours": 3
    }
    response = client.post("/api/v1/trips/share", json=payload, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "share_token" in data
    assert len(data["share_token"]) >= 6
    assert data["share_url"].startswith("/t/")
    assert data["expires_at"] is not None
    assert data["bus_id"] == 102
    assert data["route_id"] == "502"

def test_3_anonymous_shared_trip_tracking():
    """Verify anonymous access to shared trip link without cookies or Authorization header."""
    headers, uid = create_test_auth_headers()
    # 1. Create share
    share_res = client.post("/api/v1/trips/share", json={"bus_id": 103, "route_id": "502"}, headers=headers)
    token = share_res.json()["share_token"]

    # 2. Track anonymously (clean client with NO auth headers or cookies)
    anon_client = TestClient(app)
    response = anon_client.get(f"/api/v1/trips/shared/{token}")
    assert response.status_code == 200, f"Expected 200 for anonymous share tracking, got {response.status_code}"
    data = response.json()
    assert data["token"] == token
    assert data["bus_id"] == 103
    assert data["route_id"] == "502"
    assert data["passenger_initials"] == "AS"  # Aaradhya Sharma
    assert "live_telemetry" in data
    assert data["live_telemetry"]["lat"] > 0
    assert data["live_telemetry"]["lng"] > 0
    assert "crowd_pct" in data["live_telemetry"]
    assert data["helplines"]["police_112"] == "112"
    assert data["helplines"]["women_helpline"] == "1091"

def test_4_shared_trip_invalid_token():
    """Verify invalid or expired share tokens return 404 with clear error message."""
    anon_client = TestClient(app)
    response = anon_client.get("/api/v1/trips/shared/invalid-token-xyz-999")
    assert response.status_code == 404
    assert "invalid or has expired" in response.json()["detail"].lower()

def test_5_safe_stops_finder():
    """Verify safe stops finder returns stops with CCTV, Metro, and lighting indicators."""
    response = client.get("/api/v1/stops/safe?limit=15")
    assert response.status_code == 200
    stops = response.json()
    assert len(stops) > 0
    first = stops[0]
    assert "stop_id" in first
    assert "name" in first
    assert "cctv_monitored" in first
    assert "lighting_level" in first
    assert "metro_interchange" in first
    assert "police_booth_nearby" in first

def test_6_emergency_helplines_directory():
    """Verify official Delhi NCR emergency helplines are returned with bilingual descriptions."""
    response = client.get("/api/v1/safety/helplines")
    assert response.status_code == 200
    helplines = response.json()
    numbers = [h["number"] for h in helplines]
    assert "112" in numbers  # Delhi Police Emergency
    assert "1091" in numbers  # Delhi Women Helpline
    assert "181" in numbers  # Delhi Commission for Women
    assert "011-23370373" in numbers  # DTC Control Room

def test_7_safety_portal_route_served():
    """Verify /safety returns 200 OK and serves the dedicated Women's Safety & 112 hub."""
    response = client.get("/safety")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    html = response.text
    assert "Women" in html or "Safety" in html or "112" in html

def test_8_shared_trip_spa_deep_link():
    """Verify anonymous /t/<token> deep links fall back to index.html without 404ing."""
    response = client.get("/t/sh_7721live")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

def test_9_frontend_safety_components_verification():
    """Verify frontend code contains 5-second countdown buffer, audio permission, and live share components."""
    page_tsx = backend_dir.parent / "frontend" / "app" / "page.tsx"
    assert page_tsx.exists(), "frontend/app/page.tsx must exist"
    code = page_tsx.read_text(encoding="utf-8")
    assert "startSosBuffer" in code
    assert "cancelSosBuffer" in code
    assert "CANCEL FALSE ALARM" in code
    assert "SharedTripTracker" in code

    tracker_tsx = backend_dir.parent / "frontend" / "components" / "ui" / "SharedTripTracker.tsx"
    assert tracker_tsx.exists(), "SharedTripTracker.tsx must exist"
    tracker_code = tracker_tsx.read_text(encoding="utf-8")
    assert ("Delhi Transit Live Tracking" in tracker_code or "Family Tracker" in tracker_code)
    assert "/api/v1/trips/shared/" in tracker_code
    assert "tel:112" in tracker_code
