import json
from pathlib import Path

data_dir = Path("backend/data")
routes = json.loads((data_dir / "routes.json").read_text(encoding="utf-8"))["routes"]
fleet = json.loads((data_dir / "fleet.json").read_text(encoding="utf-8"))

print(f"Total routes in routes.json: {len(routes)}")
print(f"Total buses in fleet.json: {len(fleet)}")

from collections import Counter
buses_per_route = Counter(b["route_id"] for b in fleet)

for r in routes:
    rid = r["id"]
    n_buses = buses_per_route.get(rid, 0)
    km = r["length_m"] / 1000
    print(f"Route {rid:5s} | {km:5.1f} km | {len(r['stops']):3d} stops | {n_buses:2d} buses | {r['name']}")
