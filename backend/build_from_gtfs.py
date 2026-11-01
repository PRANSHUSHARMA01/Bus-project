"""Builds data/routes.json and data/fleet.json from official Delhi GTFS dataset.
Source: C:\\Users\\prans\\Downloads\\delhi_buses_static_gtfs_v1\\delhi_buses_static_gtfs_v1-2
"""
import csv
import json
import random
from pathlib import Path
from collections import defaultdict
from geo import Track

GTFS_DIR = Path(r"C:\Users\prans\Downloads\delhi_buses_static_gtfs_v1\delhi_buses_static_gtfs_v1-2")
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# Prominent Delhi Transit Trunk Routes
SELECTED_CORRIDORS = [
    {
        "gtfs_id": "1995",
        "route_id": "502",
        "name": "Route 502: Mehrauli Terminal - Kashmere Gate ISBT",
        "alias": "A",
        "color": "#2563eb",
        "peak_pax": 680,
        "n_buses": 8,
    },
    {
        "gtfs_id": "1923",
        "route_id": "427",
        "name": "Route 427: Mehrauli Terminal - Nizamuddin Railway Station",
        "alias": "B",
        "color": "#16a34a",
        "peak_pax": 490,
        "n_buses": 8,
    },
    {
        "gtfs_id": "5",
        "route_id": "102",
        "name": "Route 102: Rohini Sec 22 - Old Delhi Railway Station",
        "alias": "C",
        "color": "#9333ea",
        "peak_pax": 560,
        "n_buses": 8,
    },
    {
        "gtfs_id": "2048",
        "route_id": "534",
        "name": "Route 534: Anand Vihar ISBT - Mehrauli Terminal",
        "alias": "534",
        "color": "#ea580c",
        "peak_pax": 620,
        "n_buses": 8,
    },
    {
        "gtfs_id": "2126",
        "route_id": "615",
        "name": "Route 615: JNU Poorvanchal - Minto Road (Connaught Place)",
        "alias": "615",
        "color": "#0284c7",
        "peak_pax": 410,
        "n_buses": 8,
    },
    {
        "gtfs_id": "2229",
        "route_id": "764",
        "name": "Route 764: Nehru Place Terminal - Najafgarh / Jharoda Kalan",
        "alias": "764",
        "color": "#dc2626",
        "peak_pax": 530,
        "n_buses": 10,
    },
    {
        "gtfs_id": "2205",
        "route_id": "73",
        "name": "Route 73: Anand Vihar ISBT - Shivaji Stadium (Connaught Place)",
        "alias": "73",
        "color": "#059669",
        "peak_pax": 580,
        "n_buses": 6,
    },
    {
        "gtfs_id": "2250",
        "route_id": "78",
        "name": "Route 78: Azadpur Terminal - Inderpuri",
        "alias": "78",
        "color": "#7c3aed",
        "peak_pax": 460,
        "n_buses": 6,
    },
    {
        "gtfs_id": "2227",
        "route_id": "761",
        "name": "Route 761: Mangolpuri B Block - Azadpur Terminal",
        "alias": "761",
        "color": "#d97706",
        "peak_pax": 520,
        "n_buses": 6,
    },
    {
        "gtfs_id": "2065",
        "route_id": "543A",
        "name": "Route 543A: Anand Vihar ISBT - Kapashera Border",
        "alias": "543A",
        "color": "#b45309",
        "peak_pax": 500,
        "n_buses": 6,
    },
    {
        "gtfs_id": "2182",
        "route_id": "721",
        "name": "Route 721: Mangolpuri - Uttam Nagar Terminal",
        "alias": "721",
        "color": "#4338ca",
        "peak_pax": 540,
        "n_buses": 6,
    },
    {
        "gtfs_id": "2140",
        "route_id": "623",
        "name": "Route 623: Shahdara Terminal - Vasant Kunj",
        "alias": "623",
        "color": "#0891b2",
        "peak_pax": 470,
        "n_buses": 6,
    },
    {
        "gtfs_id": "2344",
        "route_id": "861A",
        "name": "Route 861A: Uttam Nagar Terminal - Mori Gate Terminal",
        "alias": "861A",
        "color": "#c026d3",
        "peak_pax": 480,
        "n_buses": 6,
    },
    {
        "gtfs_id": "1597",
        "route_id": "144",
        "name": "Route 144: Singhu Border - New Delhi Railway Station",
        "alias": "144",
        "color": "#e11d48",
        "peak_pax": 510,
        "n_buses": 6,
    },
    {
        "gtfs_id": "1670",
        "route_id": "192",
        "name": "Route 192: Keshav Nagar - Old Delhi Railway Station",
        "alias": "192",
        "color": "#4f46e5",
        "peak_pax": 450,
        "n_buses": 6,
    },
    {
        "gtfs_id": "2582",
        "route_id": "AIRPORT",
        "name": "Airport Express: IGI Airport Terminal 3 - Kashmere Gate ISBT",
        "alias": "AIRPORT",
        "color": "#2563eb",
        "peak_pax": 420,
        "n_buses": 6,
    },
]

# Hindi translations for major Delhi stops and terminals
HINDI_DICT = {
    "kashmere gate": "कश्मीरी गेट",
    "red fort": "लाल किला",
    "chandni chowk": "चाँदनी चौक",
    "delhi gate": "दिल्ली गेट",
    "ito": "आईटीओ",
    "mandi house": "मंडी हाउस",
    "pragati maidan": "प्रगति मैदान",
    "supreme court": "सर्वोच्च न्यायालय",
    "sarai kale khan": "सराय काले खां",
    "nizamuddin": "निज़ामुद्दीन",
    "jangpura": "जंगपुरा",
    "lajpat nagar": "लाजपत नगर",
    "nehru place": "नेहरू प्लेस",
    "new delhi railway station": "नई दिल्ली रेलवे स्टेशन",
    "connaught place": "कनॉट प्लेस",
    "janpath": "जनपथ",
    "india gate": "इंडिया गेट",
    "khan market": "खान मार्केट",
    "lodhi road": "लोधी रोड",
    "aiims": "एम्स",
    "hauz khas": "हौज़ ख़ास",
    "saket": "साकेत",
    "mehrauli terminal": "महरौली टर्मिनल",
    "qutub minar": "क़ुतुब मीनार",
    "anand vihar": "आनंद विहार",
    "rohini": "रोहिणी",
    "azadpur": "आज़ादपुर",
    "karol bagh": "करोल बाग",
    "najafgarh": "नजफगढ़",
    "dhaula kuan": "धौला कुआँ",
    "minto road": "मिंटो रोड",
    "old delhi railway station": "पुरानी दिल्ली रेलवे स्टेशन",
    "janakpuri": "जनकपुरी",
    "safdarjung": "सफदरजंग",
    "iit": "आईआईटी",
    "munirka": "मुनीरका",
    "ashram": "आश्रम",
    "laxmi nagar": "लक्ष्मी नगर",
    "preet vihar": "प्रीत विहार",
    "airport": "हवाई अड्डा",
    "terminal 3": "टर्मिनल ३",
    "singhu border": "सिंघु बॉर्डर",
    "keshav nagar": "केशव नगर",
    "shahdara": "शाहदरा",
    "mori gate": "मोरी गेट",
    "uttam nagar": "उत्तम नगर",
    "mangolpuri": "मंगोलपुरी",
    "kapashera": "कपासहेड़ा",
    "inderpuri": "इंदरपुरी",
}

def get_hindi_name(english_name: str) -> str:
    name_lower = english_name.lower()
    for k, v in HINDI_DICT.items():
        if k in name_lower:
            return v
    return english_name

print("1. Loading all stops from GTFS...")
all_stops = {}
with open(GTFS_DIR / "stops.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        sid = row["stop_id"].strip()
        sname = row["stop_name"].strip()
        all_stops[sid] = {
            "name": sname,
            "name_hi": get_hindi_name(sname),
            "lat": round(float(row["stop_lat"]), 5),
            "lng": round(float(row["stop_lon"]), 5),
        }

print(f"Loaded {len(all_stops)} official stops.")

print("2. Mapping trips and shapes for selected corridors...")
target_by_gtfs = {c["gtfs_id"]: c for c in SELECTED_CORRIDORS}
route_to_trip = {}
with open(GTFS_DIR / "trips.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        gid = row["route_id"]
        if gid in target_by_gtfs and gid not in route_to_trip:
            route_to_trip[gid] = row

print(f"Matched {len(route_to_trip)}/{len(SELECTED_CORRIDORS)} corridors in trips.txt.")

print("3. Loading stop times for representative trips...")
trip_stops = defaultdict(list)
target_trip_ids = {t["trip_id"]: gid for gid, t in route_to_trip.items()}
with open(GTFS_DIR / "stop_times.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        tid = row["trip_id"]
        if tid in target_trip_ids:
            trip_stops[tid].append(row)

print("4. Loading track shapes from shapes.txt...")
target_shape_ids = {t["shape_id"] for t in route_to_trip.values()}
shape_pts = defaultdict(list)
with open(GTFS_DIR / "shapes.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        sid = row["shape_id"]
        if sid in target_shape_ids:
            shape_pts[sid].append((
                float(row["shape_pt_lat"]),
                float(row["shape_pt_lon"]),
                int(row["shape_pt_sequence"])
            ))

for sid, pts in shape_pts.items():
    pts.sort(key=lambda x: x[2])

print("5. Snapping stops and computing route polylines...")
built_routes = []
stop_routes_map = defaultdict(set)

for corridor in SELECTED_CORRIDORS:
    gid = corridor["gtfs_id"]
    if gid not in route_to_trip:
        continue
    trip = route_to_trip[gid]
    pts = shape_pts.get(trip["shape_id"])
    if not pts:
        continue
    path = [[p[1], p[0]] for p in pts] # [lng, lat]
    track = Track([(p[0], p[1]) for p in pts])

    # Stops along this trip
    seq_list = trip_stops.get(trip["trip_id"], [])
    seq_list.sort(key=lambda x: int(x["stop_sequence"]))

    route_stops = []
    seen = set()
    for srow in seq_list:
        sid = srow["stop_id"]
        if sid not in all_stops or sid in seen:
            continue
        seen.add(sid)
        st = all_stops[sid]
        d, _ = track.snap(st["lat"], st["lng"])
        route_stops.append({"id": sid, "d": round(d, 1)})
        stop_routes_map[sid].add(corridor["route_id"])

    route_stops.sort(key=lambda x: x["d"])

    # Enforce strictly monotonic distances along route track
    monotonic_stops = []
    last_d = -1.0
    for s in route_stops:
        if s["d"] > last_d:
            monotonic_stops.append(s)
            last_d = s["d"]

    if not monotonic_stops:
        continue

    route_dict = {
        "id": corridor["route_id"],
        "name": corridor["name"],
        "alias": corridor["alias"],
        "color": corridor["color"],
        "length_m": round(track.length, 1),
        "path": path,
        "stops": monotonic_stops,
    }
    built_routes.append(route_dict)
    print(f" -> {corridor['route_id']}: {len(monotonic_stops)} stops, {track.length / 1000:.1f} km, {len(path)} path coords")

# Attach route IDs to stop objects
for sid, st in all_stops.items():
    r_list = sorted(list(stop_routes_map.get(sid, [])))
    st["routes"] = r_list

# Also create alias entries for A, B, C pointing to 502, 427, 102
alias_routes = []
for r in built_routes:
    if r.get("alias") and r["alias"] != r["id"]:
        alias_route = dict(r)
        alias_route["id"] = r["alias"]
        alias_routes.append(alias_route)

# Combine routes (primary + aliases)
all_routes = built_routes + alias_routes

# Save routes.json
routes_payload = {
    "stops": all_stops,
    "routes": all_routes,
}
with open(DATA_DIR / "routes.json", "w", encoding="utf-8") as f:
    json.dump(routes_payload, f, indent=2)

print(f"Saved data/routes.json with {len(all_stops)} stops and {len(all_routes)} route tracks.")

# 6. Generate fleet.json for EVERY corridor (at least 6-10 buses per corridor + aliases)
random.seed(42)
fleet = []
bus_id = 1
for corridor in SELECTED_CORRIDORS:
    rid = corridor["route_id"]
    n_buses = corridor.get("n_buses", 6)
    for _ in range(n_buses):
        series = random.choice(["1PD", "1PC", "1PB", "1DL"])
        reg_num = random.randint(1000, 9999)
        reg_no = f"DL{series}{reg_num}"
        fleet.append({
            "bus_id": bus_id,
            "reg_no": reg_no,
            "route_id": rid,
            "capacity": 60,
        })
        bus_id += 1

# Also generate 6 buses each for aliases A, B, C so they never have 0 buses
for alias, ref in [("A", "502"), ("B", "427"), ("C", "102")]:
    for _ in range(6):
        series = random.choice(["1PD", "1PC", "1PB"])
        reg_num = random.randint(1000, 9999)
        reg_no = f"DL{series}{reg_num}"
        fleet.append({
            "bus_id": bus_id,
            "reg_no": reg_no,
            "route_id": alias,
            "capacity": 60,
        })
        bus_id += 1

with open(DATA_DIR / "fleet.json", "w", encoding="utf-8") as f:
    json.dump(fleet, f, indent=2)

print(f"Saved data/fleet.json with {len(fleet)} active buses across {len(all_routes)} corridors.")
