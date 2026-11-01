"""GPS + ticketing simulator. Pretends to be 18 real buses talking to the API.
Run: python simulator.py (uses the real clock hour)
python simulator.py --hour 9 (pin the city to 9 AM rush hour for the demo)
python simulator.py --speedup 8 (demo clock: 8x faster than real time)"""
import argparse, json, math, random, time
from datetime import datetime
from pathlib import Path
import requests
from demand import ROUTE_PEAK, hourly_factor, hist_speed_kmh
from geo import Track

ap = argparse.ArgumentParser()
ap.add_argument("--api", default="http://127.0.0.1:8000")
ap.add_argument("--speedup", type=float, default=6.0)
ap.add_argument("--hour", type=int, default=None)
ap.add_argument("--tick", type=float, default=1.0)
args = ap.parse_args()

DATA = Path(__file__).parent / "data"
RAW = json.loads((DATA / "routes.json").read_text(encoding="utf-8"))
FLEET = json.loads((DATA / "fleet.json").read_text(encoding="utf-8"))

ROUTES = {}
for r in RAW["routes"]:
    latlng = [(lat, lng) for lng, lat in r["path"]]
    one_way = r["length_m"]
    track = Track(latlng + latlng[::-1][1:], circular=True)
    visits = []
    for s in r["stops"]:
        visits.append((s["d"], s["id"], "start" if s["d"] < 1 else "mid"))
        if 1 < s["d"] < one_way - 1:
            visits.append((track.length - s["d"], s["id"], "mid"))
        if s["d"] >= one_way - 1:
            visits[-1] = (s["d"], s["id"], "end")
    visits.sort()
    ROUTES[r["id"]] = {"track": track, "period": track.length, "visits": visits, "n_visits": len(visits)}

# busy places get more passengers than quiet ones
WEIGHT = {"cp": 2.0, "ndls": 1.8, "kashmere_gate": 1.6, "nehru_place": 1.5, "nizamuddin": 1.4,
          "aiims": 1.4, "rajouri_garden": 1.3, "lajpat_nagar": 1.3, "karol_bagh": 1.3, "saket": 1.2}

buses = {}
by_route = {}
for f in FLEET:
    by_route.setdefault(f["route_id"], []).append(f)

for rid, group in by_route.items():
    P = ROUTES[rid]["period"]
    for i, f in enumerate(group):
        buses[f["bus_id"]] = {"route": rid, "s": (i / len(group)) * P + random.uniform(-400, 400),
                              "speed": 10.0, "dwell": 0.0, "onboard": random.randint(5, 25),
                              "cap": f["capacity"], "last_stop": None}

def poisson(lam):
    if lam <= 0:
        return 0
    if lam > 30:
        return max(0, int(random.gauss(lam, math.sqrt(lam))))
    L, k, p = math.exp(-lam), 0, 1.0
    while p > L:
        k += 1
        p *= random.random()
    return k - 1

def expected_boardings(rid, stop_id, hour, weekend, surge):
    """Passengers who walk up to a stop while a bus is there."""
    route = ROUTES[rid]
    n_buses = sum(1 for b in buses.values() if b["route"] == rid) or 1
    speed = hist_speed_kmh(hour) / 3.6
    lap_seconds = route["period"] / speed + route["n_visits"] * 30
    visits_per_hour = n_buses * route["n_visits"] * 3600 / lap_seconds
    per_visit = ROUTE_PEAK.get(rid, 500) * hourly_factor(hour, weekend) / visits_per_hour
    return per_visit * WEIGHT.get(stop_id, 1.0) * (2.2 if surge else 1.0)

session = requests.Session()
flags = {"jam": [], "surge": [], "broken": [], "assign": {}}
last_flags, last_print = 0.0, 0.0

try:
    requests.post(args.api + "/sim/hour", json={"hour": args.hour}, timeout=3)
except Exception:
    pass

print(f"Simulator running: {len(buses)} buses, demo clock x{args.speedup}. Press Ctrl+C to stop.")

def run_loop():
    global flags, last_flags, last_print
    broken_since = {}
    while True:
        t0 = time.time()
        now = datetime.now()
        hour = args.hour if args.hour is not None else now.hour
        weekend = now.weekday() >= 5

        if t0 - last_flags > 2: # ask the API about demo events
            try:
                flags = session.get(args.api + "/sim/flags", timeout=3).json()
            except Exception:
                pass
            last_flags = t0
            for bid, rid in flags.get("assign", {}).items():
                b = buses.get(int(bid))
                if b and b["route"] != rid: # bus reassigned by an admin
                    b.update(route=rid, s=0.0, onboard=0, dwell=0.0, last_stop=None)

        pings, boardings = [], []
        sim_dt = args.tick * args.speedup

        for bid, b in list(buses.items()):
            route = ROUTES[b["route"]]
            broken = bid in flags.get("broken", [])
            if broken:
                b["speed"] = 0.0
                if bid not in broken_since:
                    broken_since[bid] = t0
                elif t0 - broken_since[bid] > 60:
                    # Spawn relief bus after 60s so route active fleet >= 5
                    relief_id = max(buses.keys()) + 1
                    buses[relief_id] = {
                        "route": b["route"],
                        "s": (b["s"] + 2000) % route["period"],
                        "speed": 12.0, "dwell": 0.0, "onboard": 12,
                        "cap": 60, "last_stop": None
                    }
                    del broken_since[bid]
            elif b["dwell"] > 0:
                b["dwell"] -= sim_dt
                b["speed"] = 0.0
            else:
                target = hist_speed_kmh(hour) * random.uniform(0.85, 1.15)
                if b["route"] in flags.get("jam", []):
                    target *= 0.25
                b["speed"] += (target - b["speed"]) * 0.35
                ds = b["speed"] / 3.6 * sim_dt
                for d, sid, kind in route["visits"]: # did we reach a stop this tick?
                    ahead = (d - b["s"]) % route["period"]
                    if 0 < ahead <= ds and b["last_stop"] != (sid, kind, d):
                        ds = ahead
                        b["last_stop"] = (sid, kind, d)
                        b["dwell"] = random.uniform(20, 40)
                        surge = b["route"] in flags.get("surge", [])
                        alight = b["onboard"] if kind in ("start", "end") else sum(random.random() < 0.22 for _ in range(b["onboard"]))
                        board = poisson(expected_boardings(b["route"], sid, hour, weekend, surge))
                        board = min(board, int(b["cap"] * 1.4) - (b["onboard"] - alight))
                        b["onboard"] += max(0, board) - alight
                        boardings.append({"bus_id": bid, "stop_id": sid, "boarded": max(0, board), "alighted": alight})
                        break
                b["s"] = (b["s"] + ds) % route["period"]

            lat, lng = route["track"].point_at(b["s"])
            lat += random.gauss(0, 0.00003) # ~3 m of GPS noise, like a real receiver
            lng += random.gauss(0, 0.00003)
            pings.append({"bus_id": bid, "route_id": b["route"], "lat": lat, "lng": lng,
                          "speed_kmh": round(max(0.0, b["speed"] + random.gauss(0, 0.6)), 1) if b["speed"] > 0 else 0})

        try:
            session.post(args.api + "/ingest/positions", json=pings, timeout=3)
            if boardings:
                session.post(args.api + "/ingest/boardings", json=boardings, timeout=3)
        except Exception as e:
            pass

        if t0 - last_print > 15:
            loads = [round(100 * b["onboard"] / b["cap"]) for b in buses.values()]
            print(f"hour={hour:02d} avg load {sum(loads) // len(loads)}% max {max(loads)}% jams={flags.get('jam', [])} surges={flags.get('surge', [])}")
            last_print = t0

        elapsed = time.time() - t0
        time.sleep(max(0.0, args.tick - elapsed))

if __name__ == "__main__":
    run_loop()
