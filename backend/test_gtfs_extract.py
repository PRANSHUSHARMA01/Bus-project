import csv
from pathlib import Path
from collections import defaultdict
import json

gtfs_dir = Path(r"C:\Users\prans\Downloads\delhi_buses_static_gtfs_v1\delhi_buses_static_gtfs_v1-2")

# Selected major routes
selected_routes = {
    "502": {"gtfs_id": "1995", "alias": "A", "color": "#2563eb"},
    "427": {"gtfs_id": "1923", "alias": "B", "color": "#16a34a"},
    "102": {"gtfs_id": "5", "alias": "C", "color": "#9333ea"},
    "534": {"gtfs_id": "2048", "alias": "534", "color": "#ea580c"},
    "615": {"gtfs_id": "2126", "alias": "615", "color": "#0284c7"},
    "764": {"gtfs_id": "2229", "alias": "764", "color": "#dc2626"},
}

# 1. Load routes metadata
routes_meta = {}
with open(gtfs_dir / "routes.txt", "r", encoding="utf-8", errors="ignore") as f:
    for r in csv.DictReader(f):
        routes_meta[r["route_id"]] = r

# 2. Find representative trip for each route
route_to_trip = {}
with open(gtfs_dir / "trips.txt", "r", encoding="utf-8", errors="ignore") as f:
    for t in csv.DictReader(f):
        rid = t["route_id"]
        if rid in [v["gtfs_id"] for v in selected_routes.values()] and rid not in route_to_trip:
            route_to_trip[rid] = t

print("Trips mapped:")
for k, v in route_to_trip.items():
    print(k, "-> Trip:", v["trip_id"], "Shape:", v["shape_id"])

# 3. Find stops for each trip from stop_times.txt
trip_ids = {t["trip_id"]: rid for rid, t in route_to_trip.items()}
trip_stops = defaultdict(list)
with open(gtfs_dir / "stop_times.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        tid = row["trip_id"]
        if tid in trip_ids:
            trip_stops[tid].append(row)

for tid, st in trip_stops.items():
    st.sort(key=lambda x: int(x["stop_sequence"]))
    print(f"Trip {tid} has {len(st)} stops")

# 4. Find shapes for each trip
shape_ids = {t["shape_id"] for t in route_to_trip.values()}
shape_pts = defaultdict(list)
with open(gtfs_dir / "shapes.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        sid = row["shape_id"]
        if sid in shape_ids:
            shape_pts[sid].append((
                float(row["shape_pt_lat"]),
                float(row["shape_pt_lon"]),
                int(row["shape_pt_sequence"])
            ))

for sid, pts in shape_pts.items():
    pts.sort(key=lambda x: x[2])
    print(f"Shape {sid} has {len(pts)} road track points")
