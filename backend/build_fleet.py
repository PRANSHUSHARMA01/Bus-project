"""
Builds a realistic, dense fleet allocation for all routes in data/routes.json.
Guarantees MIN_BUSES_PER_ROUTE >= 5 for every corridor, bidirectional distribution,
headway spacing, and realistic Delhi vehicle registrations.
"""
import os
import json
import math
import random
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
MIN_BUSES_PER_ROUTE = int(os.getenv("MIN_BUSES_PER_ROUTE", "5"))
DEMO_MAX_BUSES = int(os.getenv("DEMO_MAX_BUSES", "20"))

def generate_fleet():
    routes_file = DATA_DIR / "routes.json"
    if not routes_file.exists():
        raise FileNotFoundError(f"Missing {routes_file}")

    raw_routes = json.loads(routes_file.read_text(encoding="utf-8"))["routes"]
    
    fleet = []
    bus_id = 1
    random.seed(42)

    series_pool = ["1PC", "1PD", "1PB", "1DL"]
    fleet_types = ["Electric AC", "CNG AC", "CNG Standard", "Electric Standard"]

    for r in raw_routes:
        rid = r["id"]
        km = r["length_m"] / 1000.0
        # Formula: max(5, ceil(km / 2.5)) capped by DEMO_MAX_BUSES
        n_buses = max(MIN_BUSES_PER_ROUTE, math.ceil(km / 2.5))
        n_buses = min(n_buses, DEMO_MAX_BUSES)

        # Ensure bidirectional balance (at least 2 buses each way)
        out_count = math.ceil(n_buses / 2)
        in_count = n_buses - out_count

        for i in range(n_buses):
            series = random.choice(series_pool)
            reg_num = random.randint(1000, 9999)
            reg_no = f"DL{series}{reg_num}"
            ftype = fleet_types[i % len(fleet_types)]
            direction = "out" if i < out_count else "in"

            fleet.append({
                "bus_id": bus_id,
                "reg_no": reg_no,
                "route_id": rid,
                "direction": direction,
                "fleet_type": ftype,
                "capacity": 60,
                "slot_idx": i,
                "total_slots": n_buses,
            })
            bus_id += 1

    out_path = DATA_DIR / "fleet.json"
    out_path.write_text(json.dumps(fleet, indent=2), encoding="utf-8")
    print(f"Generated {len(fleet)} buses for {len(raw_routes)} routes -> {out_path}")
    return fleet

if __name__ == "__main__":
    generate_fleet()
