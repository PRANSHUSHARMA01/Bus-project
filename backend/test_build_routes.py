import csv
from pathlib import Path
from collections import defaultdict
import json
from geo import Track

gtfs_dir = Path(r"C:\Users\prans\Downloads\delhi_buses_static_gtfs_v1\delhi_buses_static_gtfs_v1-2")

# Selected prominent routes:
# 1. 502 (Mehrauli - Kashmere Gate)
# 2. 427 (Mehrauli - Nizamuddin)
# 3. 102 (Rohini - Old Delhi)
# 4. 534 (Anand Vihar - Mehrauli)
# 5. 615 (JNU - Connaught Place)
# 6. 764 (Nehru Place - Najafgarh)
TARGETS = [
    {"gtfs_id": "1995", "route_id": "502", "alias": "A", "color": "#2563eb"},
    {"gtfs_id": "1923", "route_id": "427", "alias": "B", "color": "#16a34a"},
    {"gtfs_id": "5", "route_id": "102", "alias": "C", "color": "#9333ea"},
    {"gtfs_id": "2048", "route_id": "534", "alias": "534", "color": "#ea580c"},
    {"gtfs_id": "2126", "route_id": "615", "alias": "615", "color": "#0284c7"},
    {"gtfs_id": "2229", "route_id": "764", "alias": "764", "color": "#dc2626"},
]

target_gtfs_ids = {t["gtfs_id"]: t for t in TARGETS}

# 1. Routes metadata
route_meta = {}
with open(gtfs_dir / "routes.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        if row["route_id"] in target_gtfs_ids:
            route_meta[row["route_id"]] = row

# 2. Representative trips
trip_to_target = {}
target_to_trip = {}
with open(gtfs_dir / "trips.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        gid = row["route_id"]
        if gid in target_gtfs_ids and gid not in target_to_trip:
            target_to_trip[gid] = row
            trip_to_target[row["trip_id"]] = gid

# 3. Stop times for trips
trip_stops = defaultdict(list)
with open(gtfs_dir / "stop_times.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        tid = row["trip_id"]
        if tid in trip_to_target:
            trip_stops[tid].append(row)

# 4. Shapes for trips
shape_to_pts = defaultdict(list)
target_shapes = {t["shape_id"] for t in target_to_trip.values()}
with open(gtfs_dir / "shapes.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        sid = row["shape_id"]
        if sid in target_shapes:
            shape_to_pts[sid].append((
                float(row["shape_pt_lat"]),
                float(row["shape_pt_lon"]),
                int(row["shape_pt_sequence"])
            ))

for sid, pts in shape_to_pts.items():
    pts.sort(key=lambda x: x[2])

# 5. Load all stops
all_stops = {}
with open(gtfs_dir / "stops.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        sid = row["stop_id"]
        all_stops[sid] = {
            "name": row["stop_name"].strip(),
            "name_hi": row["stop_name"].strip(),
            "lat": round(float(row["stop_lat"]), 5),
            "lng": round(float(row["stop_lon"]), 5),
        }

print(f"Total stops in GTFS: {len(all_stops)}")

# 6. Build route tracks and verify
built_routes = []
for tgt in TARGETS:
    gid = tgt["gtfs_id"]
    trip = target_to_trip[gid]
    meta = route_meta[gid]
    pts = shape_to_pts[trip["shape_id"]]
    path = [[p[1], p[0]] for p in pts] # [lng, lat]
    track = Track([(p[0], p[1]) for p in pts]) # latlng

    # Snap stops
    stops_seq = trip_stops[trip["trip_id"]]
    stops_seq.sort(key=lambda x: int(x["stop_sequence"]))
    
    route_stops = []
    seen_stops = set()
    for srow in stops_seq:
        sid = srow["stop_id"]
        if sid not in all_stops or sid in seen_stops:
            continue
        seen_stops.add(sid)
        st_data = all_stops[sid]
        d, off = track.snap(st_data["lat"], st_data["lng"])
        route_stops.append({"id": sid, "d": round(d, 1)})

    # Sort stops by distance along track
    route_stops.sort(key=lambda x: x["d"])

    # Ensure strictly increasing distances
    clean_stops = []
    last_d = -1.0
    for s in route_stops:
        if s["d"] > last_d:
            clean_stops.append(s)
            last_d = s["d"]

    desc = meta["route_desc"].replace("\t", " ").strip()
    r_obj = {
        "id": tgt["route_id"],
        "name": f"Route {tgt['route_id']}: {desc}",
        "code": tgt["route_id"],
        "alias": tgt["alias"],
        "color": tgt["color"],
        "length_m": round(track.length, 1),
        "path": path,
        "stops": clean_stops,
    }
    built_routes.append(r_obj)
    print(f"Built Route {tgt['route_id']} ({desc}): {len(clean_stops)} stops, {track.length / 1000:.1f} km, {len(path)} path points")

print("All routes successfully built and validated!")
