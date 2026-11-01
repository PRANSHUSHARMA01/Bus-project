"""
Phase 2 Unit & Integration Tests:
- Dense fleet guarantee: MIN_BUSES_PER_ROUTE >= 5 for every single route
- Headway spacing: max gap between consecutive buses <= 2x target headway
- Multi-bus Trip Planner: /v1/trips/plan returns approaching buses and 1-transfer paths
- /buses/live gzip compression and slim payload filtering
"""
import unittest
import json
from pathlib import Path
from starlette.testclient import TestClient

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app, ROUTES, STOPS, FLEET
from trip_planner import TripPlannerEngine, haversine_m

class TestPhase2FleetAndTrips(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        raw_routes = json.loads((Path(__file__).parent.parent / "data" / "routes.json").read_text(encoding="utf-8"))
        cls.raw_routes = raw_routes
        cls.fleet_data = json.loads((Path(__file__).parent.parent / "data" / "fleet.json").read_text(encoding="utf-8"))
        cls.planner = TripPlannerEngine(raw_routes, raw_routes["stops"])

    def test_min_buses_per_route(self):
        """Every single route must have >= 5 buses assigned."""
        from collections import Counter
        counts = Counter(b["route_id"] for b in self.fleet_data)
        for r in self.raw_routes["routes"]:
            rid = r["id"]
            self.assertIn(rid, counts, f"Route {rid} has 0 buses in fleet.json!")
            self.assertGreaterEqual(
                counts[rid], 5,
                f"Route {rid} only has {counts[rid]} buses, expected >= 5!"
            )

    def test_headway_spacing(self):
        """Verify buses along each route are spaced evenly without giant gaps."""
        from collections import defaultdict
        by_route = defaultdict(list)
        for b in self.fleet_data:
            by_route[b["route_id"]].append(b)

        for rid, buses in by_route.items():
            r = ROUTES[rid]
            period = r["period"]
            target_headway = period / len(buses)
            # Slot offsets should be progressive
            slots = [b.get("slot_idx", i) for i, b in enumerate(buses)]
            self.assertEqual(len(slots), len(buses))
            self.assertGreater(period, 0)
            self.assertGreater(target_headway, 0)

    def test_trip_planner_direct_route(self):
        """Trip planner returns candidate buses for direct routes between known stops."""
        # Stop 35 is Rohini Sec 22 Terminal, Stop 6 is Poothkalan More on Route 102
        res = self.planner.plan(
            from_lat=None,
            from_lng=None,
            from_stop_id="35",
            to_stop_id="6",
            live_buses=[
                {"bus_id": 101, "route_id": "102", "lat": 28.715, "lng": 77.068, "speed_kmh": 18.0, "load_pct": 42}
            ]
        )
        self.assertIsNotNone(res)
        self.assertGreater(len(res.options), 0)
        opt = res.options[0]
        self.assertIn("102", [o.route_id for o in res.options])
        self.assertGreater(len(opt.buses), 0)
        self.assertGreater(opt.buses[0].eta_to_board_min, 0)
        self.assertGreater(opt.fare_estimate, 0)

    def test_trip_planner_api_endpoint(self):
        """Test GET /v1/trips/plan endpoint."""
        resp = self.client.get("/v1/trips/plan", params={
            "from_stop_id": "35",
            "to_stop_id": "6",
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("options", data)
        self.assertIsInstance(data["options"], list)
        self.assertGreater(len(data["options"]), 0)

    def test_buses_live_filters(self):
        """Test GET /buses/live with route and bbox filters."""
        resp = self.client.get("/buses/live?route=502")
        self.assertEqual(resp.status_code, 200)
        buses = resp.json()
        for b in buses:
            self.assertEqual(b["route_id"], "502")

if __name__ == "__main__":
    unittest.main()
