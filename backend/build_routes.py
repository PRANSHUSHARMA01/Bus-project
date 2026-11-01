"""Builds data/routes.json and data/fleet.json.
Run: python build_routes.py (straight lines between stops, works offline)
python build_routes.py --osrm (follows real roads using the free OSRM server)
Stop names and coordinates are real Delhi places (approximate pin on the stop/junction)."""
import json, random, sys, os
from pathlib import Path
from geo import Track

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

STOPS = { # id: (English, Hindi, lat, lng)
    "kashmere_gate": ("Kashmere Gate ISBT", "कश्मीरी गेट", 28.6675, 77.2285),
    "red_fort": ("Red Fort", "लाल किला", 28.6562, 77.2410),
    "delhi_gate": ("Delhi Gate", "दिल्ली गेट", 28.6402, 77.2399),
    "ito": ("ITO", "आईटीओ", 28.6288, 77.2415),
    "pragati_maidan": ("Pragati Maidan", "प्रगति मैदान", 28.6209, 77.2418),
    "nizamuddin": ("Nizamuddin Station", "निज़ामुद्दीन स्टेशन", 28.5886, 77.2506),
    "lajpat_nagar": ("Lajpat Nagar", "लाजपत नगर", 28.5700, 77.2400),
    "nehru_place": ("Nehru Place", "नेहरू प्लेस", 28.5491, 77.2519),
    "ndls": ("New Delhi Railway Station", "नई दिल्ली रेलवे स्टेशन", 28.6425, 77.2194),
    "cp": ("Connaught Place", "कनॉट प्लेस", 28.6315, 77.2167),
    "janpath": ("Janpath", "जनपथ", 28.6255, 77.2190),
    "india_gate": ("India Gate", "इंडिया गेट", 28.6129, 77.2295),
    "khan_market": ("Khan Market", "खान मार्केट", 28.6003, 77.2275),
    "lodhi_road": ("Lodhi Road", "लोधी रोड", 28.5918, 77.2273),
    "aiims": ("AIIMS", "एम्स", 28.5672, 77.2100),
    "hauz_khas": ("Hauz Khas", "हौज़ ख़ास", 28.5494, 77.2001),
    "saket": ("Saket", "साकेत", 28.5282, 77.2100),
    "rajouri_garden": ("Rajouri Garden", "राजौरी गार्डन", 28.6492, 77.1214),
    "moti_nagar": ("Moti Nagar", "मोती नगर", 28.6580, 77.1430),
    "kirti_nagar": ("Kirti Nagar", "कीर्ति नगर", 28.6551, 77.1507),
    "patel_nagar": ("Patel Nagar", "पटेल नगर", 28.6455, 77.1700),
    "rajendra_place": ("Rajendra Place", "राजेंद्र प्लेस", 28.6425, 77.1780),
    "karol_bagh": ("Karol Bagh", "करोल बाग", 28.6514, 77.1907),
}

ROUTES = [
    {"id": "A", "name": "Kashmere Gate - Nehru Place", "color": "#2563eb",
     "stops": ["kashmere_gate", "red_fort", "delhi_gate", "ito", "pragati_maidan", "nizamuddin", "lajpat_nagar", "nehru_place"]},
    {"id": "B", "name": "New Delhi Stn - Saket", "color": "#16a34a",
     "stops": ["ndls", "cp", "janpath", "india_gate", "khan_market", "lodhi_road", "aiims", "hauz_khas", "saket"]},
    {"id": "C", "name": "Rajouri Garden - Connaught Place", "color": "#9333ea",
     "stops": ["rajouri_garden", "moti_nagar", "kirti_nagar", "patel_nagar", "rajendra_place", "karol_bagh", "ndls", "cp"]},
]

def road_path(points): # points = [(lat, lng), ...]
    import requests
    coords = ";".join(f"{lng},{lat}" for lat, lng in points)
    url = f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson"
    r = requests.get(url, timeout=30).json()
    return r["routes"][0]["geometry"]["coordinates"] # [[lng, lat], ...]

use_osrm = "--osrm" in sys.argv
out_routes = []
for r in ROUTES:
    pts = [(STOPS[s][2], STOPS[s][3]) for s in r["stops"]]
    path = None
    if use_osrm:
        try:
            path = road_path(pts)
            print(r["id"], "road geometry points:", len(path))
        except Exception as e:
            print("OSRM failed, using straight lines:", e)
    if path is None:
        path = [[lng, lat] for lat, lng in pts]
    track = Track([(lat, lng) for lng, lat in path])
    stops = []
    for sid in r["stops"]:
        d, off = track.snap(STOPS[sid][2], STOPS[sid][3])
        stops.append({"id": sid, "d": round(d, 1)})
    out_routes.append({"id": r["id"], "name": r["name"], "color": r["color"],
                       "length_m": round(track.length, 1), "path": path, "stops": stops})
    print(f'{r["id"]}: {len(stops)} stops, {track.length / 1000:.1f} km one way')

stops_out = {k: {"name": v[0], "name_hi": v[1], "lat": v[2], "lng": v[3]} for k, v in STOPS.items()}
json.dump({"stops": stops_out, "routes": out_routes}, open(DATA_DIR / "routes.json", "w"), indent=2)

random.seed(7)
fleet, bid = [], 1
for r in ROUTES:
    for _ in range(6):
        reg = f"DL1P{random.choice('CD')}{random.randint(1000, 9999)}" # looks like a real Delhi bus plate
        fleet.append({"bus_id": bid, "reg_no": reg, "route_id": r["id"], "capacity": 60})
        bid += 1

json.dump(fleet, open(DATA_DIR / "fleet.json", "w"), indent=1)
print("fleet:", len(fleet), "buses")
