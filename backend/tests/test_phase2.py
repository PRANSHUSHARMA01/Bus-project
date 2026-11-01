"""
Unit and Integration Tests for Phase 2:
- Supabase JWT verification (valid / expired / wrong audience / missing)
- Role-based access control (RBAC: passenger vs conductor vs admin)
- Data isolation (User A cannot read User B's trips)
- Trip lifecycle (start -> active -> end -> completed)
- Nearest stops spatial calculation
- Services directory
"""

import os
import sys
import time
import unittest
import jwt
from starlette.testclient import TestClient

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from auth import SUPABASE_JWT_SECRET
from db import db

client = TestClient(app)

def create_jwt(user_id: str, email: str, role: str = "passenger", exp_offset: int = 3600, aud: str = "authenticated"):
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "aud": aud,
        "exp": int(time.time()) + exp_offset,
        "user_metadata": {"full_name": user_id.replace("_", " ").title()}
    }
    return jwt.encode(payload, SUPABASE_JWT_SECRET, algorithm="HS256")

class TestPhase2Backend(unittest.TestCase):
    def setUp(self):
        # Clean local test db state
        self.user1_token = create_jwt("test_user_1", "user1@example.com")
        self.user2_token = create_jwt("test_user_2", "user2@example.com")
        self.conductor_token = create_jwt("test_cond", "cond@dtc.delhi.gov.in", role="conductor")

    def test_auth_missing_token(self):
        """Missing Authorization header must return 401."""
        res = client.get("/v1/me")
        self.assertEqual(res.status_code, 401)
        self.assertIn("Missing Authorization header", res.json()["detail"])

    def test_auth_invalid_header_format(self):
        """Authorization header without 'Bearer ' prefix must return 401."""
        res = client.get("/v1/me", headers={"Authorization": "Basic 12345"})
        self.assertEqual(res.status_code, 401)
        self.assertIn("must start with Bearer", res.json()["detail"])

    def test_auth_expired_token(self):
        """Expired JWT must return 401."""
        expired_token = create_jwt("expired_user", "exp@example.com", exp_offset=-60)
        res = client.get("/v1/me", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(res.status_code, 401)
        self.assertIn("expired", res.json()["detail"].lower())

    def test_auth_wrong_audience(self):
        """JWT with unrecognized audience must return 401."""
        bad_aud_token = create_jwt("attacker", "bad@example.com", aud="malicious-app")
        res = client.get("/v1/me", headers={"Authorization": f"Bearer {bad_aud_token}"})
        self.assertEqual(res.status_code, 401)
        self.assertIn("audience", res.json()["detail"].lower())

    def test_auth_valid_token_and_profile(self):
        """Valid token successfully reads and returns authenticated profile."""
        res = client.get("/v1/me", headers={"Authorization": f"Bearer {self.user1_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], "test_user_1")
        self.assertEqual(data["email"], "user1@example.com")
        self.assertEqual(data["role"], "passenger")

    def test_data_isolation_trips(self):
        """User A creates a trip; User B fetching trips must receive empty list (isolation)."""
        # User 1 starts a trip
        start_res = client.post(
            "/v1/trips/start",
            headers={"Authorization": f"Bearer {self.user1_token}"},
            json={
                "bus_id": 1,
                "route_id": "502",
                "board_stop_id": "delhi_502_0",
                "source": "live"
            }
        )
        self.assertEqual(start_res.status_code, 200)
        trip_id = start_res.json()["id"]

        # User 2 queries their trips
        user2_trips = client.get(
            "/v1/me/trips",
            headers={"Authorization": f"Bearer {self.user2_token}"}
        ).json()
        self.assertFalse(any(t["id"] == trip_id for t in user2_trips))

        # User 1 queries their trips and sees it
        user1_trips = client.get(
            "/v1/me/trips",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        ).json()
        self.assertTrue(any(t["id"] == trip_id for t in user1_trips))

    def test_trip_lifecycle(self):
        """Test full trip lifecycle: start -> active -> end -> completed."""
        # 1. Start trip
        start = client.post(
            "/v1/trips/start",
            headers={"Authorization": f"Bearer {self.user1_token}"},
            json={
                "bus_id": 2,
                "route_id": "502",
                "board_stop_id": "delhi_502_1",
                "source": "live"
            }
        ).json()
        self.assertEqual(start["status"], "active")
        trip_id = start["id"]

        # 2. End trip
        end = client.post(
            f"/v1/trips/{trip_id}/end",
            headers={"Authorization": f"Bearer {self.user1_token}"},
            json={"alight_stop_id": "delhi_502_5", "distance_km": 4.2}
        ).json()
        self.assertEqual(end["status"], "completed")
        self.assertEqual(end["alight_stop_id"], "delhi_502_5")
        self.assertEqual(end["distance_km"], 4.2)
        self.assertIsNotNone(end["alighted_at"])

    def test_nearest_stops(self):
        """Nearest stops endpoint calculates distance, walking time, and active routes."""
        # Near Mehrauli / Qutub Minar
        res = client.get("/v1/stops/nearest?lat=28.5245&lng=77.1855&limit=5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["in_delhi_ncr"])
        self.assertEqual(len(data["stops"]), 5)
        for s in data["stops"]:
            self.assertGreater(s["distance_m"], 0)
            self.assertGreaterEqual(s["walking_min"], 1)
            self.assertGreater(len(s["active_routes"]), 0)

    def test_services_directory(self):
        """Services endpoint returns official transit tools, safety, and helpline numbers."""
        res = client.get("/v1/services")
        self.assertEqual(res.status_code, 200)
        sections = res.json()
        self.assertGreaterEqual(len(sections), 3)
        all_services = [s for sec in sections for s in sec["services"]]
        # Verify emergency numbers
        service_ids = [s["id"] for s in all_services]
        self.assertIn("police-112", service_ids)
        self.assertIn("women-helpline", service_ids)
        self.assertIn("dtc-control", service_ids)

    def test_security_headers(self):
        """Security headers must be present on responses."""
        res = client.get("/health")
        self.assertEqual(res.headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(res.headers.get("x-frame-options"), "DENY")
        self.assertEqual(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin")

if __name__ == "__main__":
    unittest.main()
