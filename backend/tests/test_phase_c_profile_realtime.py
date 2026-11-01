"""
Phase C Comprehensive Test Suite:
User Profile, Preferences, Saved Places, Emergency Contacts,
Trips / Ride History, Arrival Subscriptions, and WebSocket Real-Time Broadcasts.
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
from main import app, ws_manager
from auth_router import create_access_token
from db import db

def get_auth_client(email: str = None):
    """Creates a user, generates access token and returns client with Authorization header."""
    if not email:
        email = f"phase_c_{uuid.uuid4().hex[:8]}@pranshusharma.tech"
    user_row = db.get_or_create_user(email, full_name="Phase C Commuter")
    user_id = user_row["id"]
    token = create_access_token(user_row)
    client = TestClient(app)
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client, user_id, email

def test_1_profile_get_and_update():
    """Test retrieving and updating user profile and preferences."""
    client, user_id, email = get_auth_client()

    # 1. GET /v1/profile
    r = client.get("/v1/profile")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    profile = r.json()
    assert profile["email"] == email

    # 2. PATCH /v1/profile to set preferences
    updates = {
        "full_name": "Delhi Super Rider",
        "language": "hi",
        "phone": "+91 99887 76655",
        "home_stop_id": "7572",
        "work_stop_id": "1002"
    }
    r_patch = client.patch("/v1/profile", json=updates)
    assert r_patch.status_code == 200
    updated = r_patch.json()
    assert updated["full_name"] == "Delhi Super Rider"
    assert updated["language"] == "hi"
    assert updated["phone"] == "+91 99887 76655"
    assert updated["home_stop_id"] == "7572"
    assert updated["work_stop_id"] == "1002"

    # 3. GET /v1/me (alias) to verify persistence
    r_me = client.get("/v1/me")
    assert r_me.status_code == 200
    assert r_me.json()["home_stop_id"] == "7572"

def test_2_saved_places_crud():
    """Test adding, listing, and deleting custom saved transit places."""
    client, user_id, _ = get_auth_client()

    # 1. Add saved place
    r_add = client.post("/v1/saved-places", json={"label": "Campus Library", "stop_id": "7572"})
    assert r_add.status_code == 200
    place = r_add.json()
    assert place["label"] == "Campus Library"
    assert place["stop_id"] == "7572"
    place_id = place["id"]

    # 2. Add second saved place
    r_add2 = client.post("/v1/saved-places", json={"label": "Gym & Fitness", "stop_id": "1002"})
    assert r_add2.status_code == 200

    # 3. List saved places
    r_list = client.get("/v1/saved-places")
    assert r_list.status_code == 200
    places = r_list.json()
    assert len(places) >= 2
    assert any(p["label"] == "Campus Library" for p in places)

    # 4. Delete saved place
    r_del = client.delete(f"/v1/saved-places/{place_id}")
    assert r_del.status_code == 200

    # 5. Verify deleted place is gone
    r_del_again = client.delete(f"/v1/saved-places/{place_id}")
    assert r_del_again.status_code == 404

def test_3_emergency_contacts_crud():
    """Test Women's Safety & Emergency Contacts CRUD endpoints."""
    client, user_id, _ = get_auth_client()

    # 1. Add contact
    r_add = client.post("/v1/emergency-contacts", json={
        "name": "Sister Anita",
        "phone": "+91 98765 43210",
        "relationship": "Family"
    })
    assert r_add.status_code == 200
    contact = r_add.json()
    assert contact["name"] == "Sister Anita"
    assert contact["phone"] == "+91 98765 43210"
    assert contact["relationship"] == "Family"
    contact_id = contact["id"]

    # 2. List emergency contacts
    r_list = client.get("/v1/emergency-contacts")
    assert r_list.status_code == 200
    contacts = r_list.json()
    assert len(contacts) >= 1
    assert any(c["id"] == contact_id for c in contacts)

    # 3. Delete emergency contact
    r_del = client.delete(f"/v1/emergency-contacts/{contact_id}")
    assert r_del.status_code == 200
    assert r_del.json()["status"] == "deleted"

    # 4. Verify 404 on deleting non-existent contact
    r_del404 = client.delete(f"/v1/emergency-contacts/{contact_id}")
    assert r_del404.status_code == 404

def test_4_trips_ride_history():
    """Test start trip, query active trip, end trip, and trip history."""
    client, user_id, _ = get_auth_client()

    # 1. Start a trip
    r_start = client.post("/v1/trips/start", json={
        "bus_id": 1,
        "route_id": "102",
        "board_stop_id": "7572",
        "source": "live"
    })
    assert r_start.status_code == 200
    trip = r_start.json()
    assert trip["status"] == "active"
    assert trip["bus_id"] == 1
    assert trip["board_stop_id"] == "7572"
    trip_id = trip["id"]

    # 2. Query trips list
    r_trips = client.get("/v1/trips")
    assert r_trips.status_code == 200
    trips = r_trips.json()
    assert any(t["id"] == trip_id and t["status"] == "active" for t in trips)

    # 3. End trip
    r_end = client.post(f"/v1/trips/{trip_id}/end", json={
        "alight_stop_id": "1002",
        "distance_km": 6.4
    })
    assert r_end.status_code == 200
    ended = r_end.json()
    assert ended["status"] == "completed"
    assert ended["alight_stop_id"] == "1002"
    assert ended["distance_km"] == 6.4

def test_5_arrival_subscriptions():
    """Test subscribing to stop arrivals and managing subscriptions."""
    client, user_id, _ = get_auth_client()

    # 1. Subscribe
    r_sub = client.post("/v1/subscriptions", json={
        "bus_id": 1,
        "stop_id": "7572",
        "minutes_before": 5
    })
    assert r_sub.status_code == 200
    sub = r_sub.json()
    assert sub["bus_id"] == 1
    assert sub["stop_id"] == "7572"
    assert sub["minutes_before"] == 5
    sub_id = sub["id"]

    # 2. List subscriptions
    r_list = client.get("/v1/subscriptions")
    assert r_list.status_code == 200
    subs = r_list.json()
    assert any(s["id"] == sub_id for s in subs)

    # 3. Delete subscription
    r_del = client.delete(f"/v1/subscriptions/{sub_id}")
    assert r_del.status_code == 200

    # 4. Verify 404 on deleting non-existent subscription
    r_del404 = client.delete(f"/v1/subscriptions/{sub_id}")
    assert r_del404.status_code == 404

def test_6_websocket_realtime_connection_and_broadcast():
    """Test WebSocket /ws connection, snapshot, heartbeat, and position broadcast."""
    client = TestClient(app)

    with client.websocket_connect("/ws") as ws:
        # 1. Heartbeat ping-pong
        ws.send_text("ping")
        pong = ws.receive_text()
        assert pong == "pong"

        # 2. Snapshot on request
        ws.send_text(json.dumps({"action": "snapshot"}))
        welcome = ws.receive_json()
        assert welcome["type"] == "connected"
        assert "buses_live" in welcome

        # 3. Action subscribe_stop
        ws.send_text(json.dumps({"action": "subscribe_stop", "stop_id": "7572"}))
        sub_resp = ws.receive_json()
        assert sub_resp["type"] == "subscribed"
        assert sub_resp["stop_id"] == "7572"

        # 4. Broadcast live positions via ingest
        ingest_payload = [{
            "bus_id": 1,
            "route_id": "102",
            "lat": 28.7041,
            "lng": 77.1025,
            "speed_kmh": 22.5
        }]
        r_ingest = client.post("/ingest/positions", json=ingest_payload)
        assert r_ingest.status_code == 200

        # Receive broadcast message on WebSocket
        broadcast_msg = ws.receive_json()
        assert broadcast_msg["type"] == "buses_update"
        assert broadcast_msg["count"] == 1
        assert len(broadcast_msg["buses"]) == 1
        assert broadcast_msg["buses"][0]["bus_id"] == 1

def test_7_gdpr_account_deletion_cascade():
    """Test GDPR account deletion cascades and deletes all personal data."""
    client, user_id, email = get_auth_client()

    # Seed data
    client.patch("/v1/profile", json={"home_stop_id": "7572"})
    client.post("/v1/saved-places", json={"label": "Secret spot", "stop_id": "7572"})
    client.post("/v1/emergency-contacts", json={"name": "Friend", "phone": "+91 99999 88888"})
    client.post("/v1/subscriptions", json={"bus_id": 1, "stop_id": "7572", "minutes_before": 5})

    # Delete account
    r_del = client.delete("/v1/account")
    assert r_del.status_code == 200
    assert r_del.json()["status"] == "deleted"

    # Verify cascading wipe
    conn = db.get_conn()
    cur = conn.cursor()
    for table in ["saved_places", "emergency_contacts", "notifications_subscriptions"]:
        cur.execute(f"SELECT COUNT(*) FROM {table} WHERE user_id = ?", (user_id,))
        count = cur.fetchone()[0]
        assert count == 0, f"Table {table} still has {count} records after deletion!"
    conn.close()

if __name__ == "__main__":
    test_1_profile_get_and_update()
    print("[PASS] test_1_profile_get_and_update")
    test_2_saved_places_crud()
    print("[PASS] test_2_saved_places_crud")
    test_3_emergency_contacts_crud()
    print("[PASS] test_3_emergency_contacts_crud")
    test_4_trips_ride_history()
    print("[PASS] test_4_trips_ride_history")
    test_5_arrival_subscriptions()
    print("[PASS] test_5_arrival_subscriptions")
    test_6_websocket_realtime_connection_and_broadcast()
    print("[PASS] test_6_websocket_realtime_connection_and_broadcast")
    test_7_gdpr_account_deletion_cascade()
    print("[PASS] test_7_gdpr_account_deletion_cascade")
    print("\nAll 7 Phase C tests passed successfully!")
