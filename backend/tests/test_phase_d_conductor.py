"""
Phase D Comprehensive Test Suite:
Conductor & Driver Portal, Staff PIN Auth, Duty Lifecycle, Ticketing Counter,
Crowd Presets, In-Vehicle Incidents, and WebSocket Real-Time Broadcasts.
"""

import sys
import os
import json
import uuid
import time
from pathlib import Path

# Add backend directory to sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app, LIVE, FLEET, SIM, fresh
from auth_router import create_access_token
from db import db

fresh()

def get_conductor_client(staff_id: str = "DTC-4021"):
    """Creates a conductor user, generates access token and returns client with Authorization header."""
    email = f"{staff_id.lower().replace('-', '_')}@pranshusharma.tech"
    user_row = db.get_or_create_user(email, full_name=f"Conductor ({staff_id})")
    db.update_profile(user_row["id"], {"role": "conductor"})
    user_id = user_row["id"]
    token = create_access_token({
        "id": user_id,
        "email": email,
        "role": "conductor",
        "language": "en"
    })
    client = TestClient(app)
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client, user_id, email

def get_passenger_client():
    """Creates a regular passenger client."""
    email = f"passenger_{uuid.uuid4().hex[:6]}@pranshusharma.tech"
    user_row = db.get_or_create_user(email, full_name="Regular Passenger")
    token = create_access_token({
        "id": user_row["id"],
        "email": email,
        "role": "passenger",
        "language": "en"
    })
    client = TestClient(app)
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client

def test_1_conductor_pin_auth():
    """Test Staff Badge + PIN quick authentication."""
    client = TestClient(app)

    # 1. Successful authentication
    r = client.post("/v1/conductor/auth/pin", json={"staff_id": "DTC-4021", "pin": "1234"})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["status"] == "authenticated"
    assert data["user"]["role"] == "conductor"
    assert "access_token" in data
    assert "access_token" in r.cookies

    # 2. Invalid short PIN
    r_bad = client.post("/v1/conductor/auth/pin", json={"staff_id": "DTC-4021", "pin": "12"})
    assert r_bad.status_code in (400, 422)

def test_2_role_check_forbidden_for_passengers():
    """Verify regular passengers cannot perform conductor operations."""
    passenger = get_passenger_client()

    # Attempt to start duty
    r_duty = passenger.post("/v1/conductor/duty/start", json={"bus_id": 1})
    assert r_duty.status_code == 403

    # Attempt to issue ticket
    r_ticket = passenger.post("/v1/conductor/ticket", json={"bus_id": 1, "fare": 10, "payment_method": "cash"})
    assert r_ticket.status_code == 403

    # Attempt to set load preset
    r_preset = passenger.post("/v1/conductor/load/preset", json={"bus_id": 1, "preset": "empty"})
    assert r_preset.status_code == 403

def test_3_conductor_duty_start_and_end():
    """Test starting duty, querying active shift, and ending duty."""
    client, user_id, _ = get_conductor_client("DTC-5520")

    # 1. Start Duty
    r_start = client.post("/v1/conductor/duty/start", json={"bus_id": 1})
    assert r_start.status_code == 200
    duty = r_start.json()
    assert duty["bus_id"] == 1
    assert duty["status"] == "active"
    duty_id = duty["id"]

    # 2. Query Active Duty
    r_active = client.get("/v1/conductor/duty/active")
    assert r_active.status_code == 200
    active_data = r_active.json()
    assert active_data["active_duty"] is not None
    assert active_data["active_duty"]["id"] == duty_id

    # 3. End Duty
    r_end = client.post("/v1/conductor/duty/end")
    assert r_end.status_code == 200
    assert r_end.json()["status"] == "ended"

    # 4. Verify Active Duty is now None
    r_active2 = client.get("/v1/conductor/duty/active")
    assert r_active2.status_code == 200
    assert r_active2.json()["active_duty"] is None

def test_4_conductor_ticketing_and_stats():
    """Test issuing cash and UPI tickets, passenger count sync, and shift stats."""
    from v1_router import ensure_live_bus
    client, user_id, _ = get_conductor_client("DTC-8899")
    client.post("/v1/conductor/duty/start", json={"bus_id": 2})

    ensure_live_bus(2)
    init_onboard = LIVE[2]["onboard"]

    # 1. Issue Cash Ticket (₹10)
    r1 = client.post("/v1/conductor/ticket", json={
        "bus_id": 2,
        "fare": 10,
        "payment_method": "cash",
        "stop_id": "7572"
    })
    assert r1.status_code == 200
    t1 = r1.json()
    assert t1["fare"] == 10
    assert t1["payment_method"] == "cash"
    assert t1["onboard"] == init_onboard + 1

    # 2. Issue UPI Ticket (₹25)
    r2 = client.post("/v1/conductor/ticket", json={
        "bus_id": 2,
        "fare": 25,
        "payment_method": "upi",
        "stop_id": "1002"
    })
    assert r2.status_code == 200
    t2 = r2.json()
    assert t2["fare"] == 25
    assert t2["payment_method"] == "upi"
    assert t2["onboard"] == init_onboard + 2

    # 3. Check Shift Collection Stats
    r_stats = client.get("/v1/conductor/duty/active")
    assert r_stats.status_code == 200
    stats = r_stats.json()["stats"]
    assert stats["total_tickets"] >= 2
    assert stats["cash_collection"] >= 10
    assert stats["upi_collection"] >= 25
    assert stats["total_collection"] >= 35

def test_5_conductor_load_preset():
    """Test quick crowd presets for rapid load adjustments."""
    from v1_router import ensure_live_bus
    client, _, _ = get_conductor_client("DTC-3311")
    ensure_live_bus(3)
    cap = FLEET[3]["capacity"]

    # 1. Preset: empty (0%)
    r_empty = client.post("/v1/conductor/load/preset", json={"bus_id": 3, "preset": "empty"})
    assert r_empty.status_code == 200
    assert LIVE[3]["onboard"] == 0

    # 2. Preset: seats_free (~35%)
    r_seats = client.post("/v1/conductor/load/preset", json={"bus_id": 3, "preset": "seats_free"})
    assert r_seats.status_code == 200
    assert LIVE[3]["onboard"] == int(cap * 0.35)

    # 3. Preset: standing (~75%)
    r_standing = client.post("/v1/conductor/load/preset", json={"bus_id": 3, "preset": "standing"})
    assert r_standing.status_code == 200
    assert LIVE[3]["onboard"] == int(cap * 0.75)

    # 4. Preset: packed (105%)
    r_packed = client.post("/v1/conductor/load/preset", json={"bus_id": 3, "preset": "packed"})
    assert r_packed.status_code == 200
    assert LIVE[3]["onboard"] == int(cap * 1.05)

def test_6_conductor_incidents_and_sos():
    """Test incident reporting and driver emergency SOS."""
    from v1_router import ensure_live_bus
    client, user_id, _ = get_conductor_client("DTC-1122")
    ensure_live_bus(4)

    # 1. Breakdown
    r_breakdown = client.post("/v1/conductor/incident", json={
        "bus_id": 4,
        "kind": "breakdown",
        "note": "Engine coolant failure"
    })
    assert r_breakdown.status_code == 200
    assert 4 in SIM["broken"]

    # 2. One-tap Driver SOS
    r_sos = client.post("/v1/conductor/incident", json={
        "bus_id": 4,
        "kind": "sos",
        "note": "Cabin emergency alert"
    })
    assert r_sos.status_code == 200

    # Verify SOS recorded in database
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM sos_events WHERE bus_id = 4")
    sos_count = cur.fetchone()[0]
    conn.close()
    assert sos_count >= 1

    # 3. Flat tire, Route deviation, Traffic Jam
    for kind in ["flat_tire", "route_deviation", "traffic_jam"]:
        r_inc = client.post("/v1/conductor/incident", json={"bus_id": 4, "kind": kind})
        assert r_inc.status_code == 200
        assert r_inc.json()["incident"]["kind"] == kind

def test_7_realtime_websocket_ticket_and_incident_broadcast():
    """Verify WebSocket clients receive instant ticket updates and incident alerts."""
    from v1_router import ensure_live_bus
    client, _, _ = get_conductor_client("DTC-9988")
    ensure_live_bus(5)

    with client.websocket_connect("/ws") as ws:
        # 1. Issue Ticket -> receives buses_update
        r_tix = client.post("/v1/conductor/ticket", json={"bus_id": 5, "fare": 10, "payment_method": "cash"})
        assert r_tix.status_code == 200

        msg = ws.receive_json()
        assert msg["type"] == "buses_update"
        assert any(b["bus_id"] == 5 for b in msg["buses"])

        # 2. Report Incident -> receives incident_alert
        r_inc = client.post("/v1/conductor/incident", json={"bus_id": 5, "kind": "accident"})
        assert r_inc.status_code == 200

        msg2 = ws.receive_json()
        assert msg2["type"] == "incident_alert"
        assert msg2["incident"]["kind"] == "accident"
        assert msg2["incident"]["bus_id"] == 5

if __name__ == "__main__":
    print("Running test_1...", flush=True)
    test_1_conductor_pin_auth()
    print("[PASS] test_1_conductor_pin_auth", flush=True)

    print("Running test_2...", flush=True)
    test_2_role_check_forbidden_for_passengers()
    print("[PASS] test_2_role_check_forbidden_for_passengers", flush=True)

    print("Running test_3...", flush=True)
    test_3_conductor_duty_start_and_end()
    print("[PASS] test_3_conductor_duty_start_and_end", flush=True)

    print("Running test_4...", flush=True)
    test_4_conductor_ticketing_and_stats()
    print("[PASS] test_4_conductor_ticketing_and_stats", flush=True)

    print("Running test_5...", flush=True)
    test_5_conductor_load_preset()
    print("[PASS] test_5_conductor_load_preset", flush=True)

    print("Running test_6...", flush=True)
    test_6_conductor_incidents_and_sos()
    print("[PASS] test_6_conductor_incidents_and_sos", flush=True)

    print("Running test_7...", flush=True)
    test_7_realtime_websocket_ticket_and_incident_broadcast()
    print("[PASS] test_7_realtime_websocket_ticket_and_incident_broadcast", flush=True)

    print("\nAll 7 Phase D tests passed successfully!", flush=True)
