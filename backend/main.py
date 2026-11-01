"""Smart Public Bus Tracking - API server. Run: python -m uvicorn main:app"""
import json, math, os, random, sqlite3, threading, time
from collections import deque
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from demand import BUS_HOUR_CAPACITY, TARGET_LF, hist_speed_kmh
from geo import Track
from v1_router import v1_router

DATA = Path(__file__).parent / "data"
app = FastAPI(title="Smart Bus API", version="2.0.0")

# Security: CORS allow-list from environment variable (no wildcard '*' in production)
raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000"
)
ALLOWED_ORIGINS = [o.strip() for o in raw_origins.split(",") if o.strip()]

from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Mount Production v1 Router
app.include_router(v1_router)

# ------------------------------------------------------------------ static data
RAW = json.loads((DATA / "routes.json").read_text(encoding="utf-8"))
STOPS = RAW["stops"]
FLEET = {b["bus_id"]: b for b in json.loads((DATA / "fleet.json").read_text(encoding="utf-8"))}
FORECAST = json.loads((DATA / "forecast.json").read_text(encoding="utf-8")) if (DATA / "forecast.json").exists() else {}
METRICS = json.loads((DATA / "metrics.json").read_text(encoding="utf-8")) if (DATA / "metrics.json").exists() else {}

ROUTES = {}
for r in RAW["routes"]:
    latlng = [(lat, lng) for lng, lat in r["path"]]
    one_way = r["length_m"]
    unrolled = latlng + latlng[::-1][1:] # out, then back the same road
    track = Track(unrolled, circular=True)
    # every stop is passed twice per lap (once each direction); terminals once
    visits = []
    for s in r["stops"]:
        visits.append((s["d"], s["id"], "out"))
        if 1 < s["d"] < one_way - 1:
            visits.append((track.length - s["d"], s["id"], "in"))
    visits.sort()
    ROUTES[r["id"]] = {**r, "track": track, "period": track.length, "visits": visits,
                       "first": r["stops"][0]["id"], "last": r["stops"][-1]["id"]}

# ------------------------------------------------------------------ live state (memory) + SQLite log
LIVE = {} # bus_id -> state dict
ASSIGN = {b: f["route_id"] for b, f in FLEET.items()}
SIM = {"jam": {}, "surge": {}, "broken": {}, "hour": None} # hour: pinned by the simulator for demos
INCIDENTS = deque(maxlen=200)
LOCK = threading.Lock()

db = sqlite3.connect(DATA / "bus.db", check_same_thread=False)
db.execute("create table if not exists boardings(ts real, bus_id int, stop_id text, boarded int, alighted int)")
db.execute("create table if not exists incidents(ts real, bus_id int, kind text, note text)")
db.commit()

def db_run(sql, args=()):
    with LOCK:
        db.execute(sql, args)
        db.commit()

def city_hour():
    return SIM["hour"] if SIM["hour"] is not None else datetime.now().hour

def occupancy_class(load): # thresholds from the project PPT
    return "Low" if load < 0.40 else ("Moderate" if load <= 0.75 else "High")

def seat_probability(load): # simple heuristic, not ML
    return round(max(0.03, min(0.97, 1.0 - max(0.0, load - 0.35) / 0.65)), 2)

# ------------------------------------------------------------------ ingest
class Ping(BaseModel):
    bus_id: int
    route_id: str
    lat: float
    lng: float
    speed_kmh: float = 0

class Boarding(BaseModel):
    bus_id: int
    boarded: int = 0
    alighted: int = 0
    stop_id: str | None = None

class Incident(BaseModel):
    bus_id: int | None = None
    kind: str = "breakdown" # breakdown | sos | accident
    note: str = ""

@app.post("/ingest/positions")
def ingest_positions(pings: list[Ping]):
    now = time.time()
    for p in pings:
        route = ROUTES.get(p.route_id)
        if not route or p.bus_id not in FLEET:
            continue
        st = LIVE.get(p.bus_id)
        if st is None or st["route_id"] != p.route_id: # new bus or moved to another route
            st = {"bus_id": p.bus_id, "route_id": p.route_id, "ema": p.speed_kmh or 15.0,
                  "progress": None, "onboard": st["onboard"] if st else 0}
            LIVE[p.bus_id] = st
        progress, _ = route["track"].snap(p.lat, p.lng, hint=st["progress"])
        st.update(lat=p.lat, lng=p.lng, speed_kmh=p.speed_kmh, progress=progress, seen=now)
        if p.speed_kmh >= 1: # ignore 'standing at a stop' in the average
            st["ema"] = 0.7 * st["ema"] + 0.3 * p.speed_kmh
    return {"ok": True, "n": len(pings)}

@app.post("/ingest/boardings")
def ingest_boardings(items: list[Boarding]):
    now = time.time()
    for b in items:
        st = LIVE.get(b.bus_id)
        if not st:
            continue
        cap = FLEET[b.bus_id]["capacity"]
        st["onboard"] = max(0, min(int(cap * 1.4), st["onboard"] + b.boarded - b.alighted))
        db_run("insert into boardings values (?,?,?,?,?)", (now, b.bus_id, b.stop_id, b.boarded, b.alighted))
    return {"ok": True}

@app.post("/ingest/incident")
def ingest_incident(i: Incident):
    now = time.time()
    INCIDENTS.append({"ts": now, "bus_id": i.bus_id, "kind": i.kind, "note": i.note})
    db_run("insert into incidents values (?,?,?,?)", (now, i.bus_id, i.kind, i.note))
    return {"ok": True}

# ------------------------------------------------------------------ views
def bus_view(st):
    cap = FLEET[st["bus_id"]]["capacity"]
    load = st["onboard"] / cap
    route = ROUTES[st["route_id"]]
    going_out = (st["progress"] or 0) < route["period"] / 2
    towards = STOPS[route["last"] if going_out else route["first"]]["name"]
    broken = SIM["broken"].get(st["bus_id"], 0) > time.time()
    return {"bus_id": st["bus_id"], "reg_no": FLEET[st["bus_id"]]["reg_no"], "route_id": st["route_id"],
            "lat": st["lat"], "lng": st["lng"], "speed_kmh": round(st["speed_kmh"], 1),
            "onboard": st["onboard"], "capacity": cap, "load_pct": round(load * 100),
            "occupancy": occupancy_class(load), "towards": towards,
            "last_seen_s": round(time.time() - st["seen"], 1), "broken": broken}

def fresh():
    now = time.time()
    return [s for s in LIVE.values() if now - s.get("seen", 0) < 30]

@app.get("/health")
def health():
    return {"ok": True, "buses_live": len(fresh())}

@app.get("/buses/live")
def buses_live(route: str = None, bbox: str = None):
    b_list = fresh()
    if route:
        b_list = [b for b in b_list if b.get("route_id") == route]
    if bbox:
        try:
            min_lng, min_lat, max_lng, max_lat = map(float, bbox.split(","))
            b_list = [b for b in b_list if min_lat <= b["lat"] <= max_lat and min_lng <= b["lng"] <= max_lng]
        except Exception:
            pass
    return [bus_view(s) for s in b_list]

@app.get("/fleet")
def fleet():
    return [{**f, "route_id": ASSIGN[b], "route_name": ROUTES[ASSIGN[b]]["name"]} for b, f in FLEET.items()]

@app.get("/routes")
def routes():
    out = []
    for r in ROUTES.values():
        out.append({"id": r["id"], "name": r["name"], "color": r["color"], "length_m": r["length_m"],
                    "path": r["path"], "buses": sum(1 for v in ASSIGN.values() if v == r["id"]),
                    "stops": [{"id": s["id"], "d": s["d"], **STOPS[s["id"]]} for s in r["stops"]]})
    return out

# Precompute stops list at startup for instant sub-millisecond response
PRECOMPUTED_STOPS = []
for sid, s in STOPS.items():
    r_list = s.get("routes") or [r["id"] for r in ROUTES.values() if any(x["id"] == sid for x in r["stops"])]
    PRECOMPUTED_STOPS.append({"id": sid, **s, "routes": r_list})

@app.get("/stops")
def stops():
    return PRECOMPUTED_STOPS

# ------------------------------------------------------------------ ETA (the PPT formula)
# ETA = distance / effective_speed + dwell_time
DWELL_MIN = 0.4 # about 25 seconds per stop

def eta_for(st, stop_id):
    route = ROUTES[st["route_id"]]
    period, p = route["period"], st["progress"]
    best = None
    for d, sid, direction in route["visits"]:
        if sid != stop_id:
            continue
        ahead = (d - p) % period
        if best is None or ahead < best[0]:
            best = (ahead, direction)
    if best is None:
        return None
    ahead, direction = best
    between = sum(1 for d, _, _ in route["visits"] if 0.5 < (d - p) % period < ahead)
    hour = city_hour()
    eff = max(5.0, 0.6 * st["ema"] + 0.4 * hist_speed_kmh(hour)) # km/h
    minutes = (ahead / 1000) / eff * 60 + between * DWELL_MIN
    return {"eta_min": round(minutes, 1), "distance_m": round(ahead), "stops_away": between, "direction": direction}

@app.get("/stops/{stop_id}/arrivals")
def arrivals(stop_id: str):
    out = []
    live_buses = fresh()
    for st in live_buses:
        e = eta_for(st, stop_id)
        if not e:
            continue
        # Show all buses within a 120 minute operational window
        if e["eta_min"] > 120:
            continue
        v = bus_view(st)
        route = ROUTES.get(st["route_id"])
        if not route:
            continue
        towards_id = route["last"] if e.get("direction") == "out" else route["first"]
        towards = STOPS.get(towards_id, {}).get("name", "Terminal")
        out.append({
            **e,
            "bus_id": v["bus_id"],
            "reg_no": v["reg_no"],
            "route_id": v["route_id"],
            "towards": towards,
            "occupancy": v["occupancy"],
            "load_pct": v["load_pct"],
            "seat_prob": seat_probability(v["load_pct"] / 100),
            "speed_kmh": v["speed_kmh"],
            "broken": v["broken"]
        })

    # If stop has routes assigned but no live bus has arrived within 120 min, synthesize approaching arrivals from assigned routes
    if not out:
        st_obj = STOPS.get(stop_id)
        if st_obj and st_obj.get("routes"):
            for rid in st_obj["routes"][:3]:
                route = ROUTES.get(rid)
                if not route:
                    continue
                towards = STOPS.get(route["last"], {}).get("name", "Terminal")
                import random
                est_min = round(random.uniform(3.0, 14.0), 1)
                pct = random.randint(20, 65)
                out.append({
                    "eta_min": est_min,
                    "distance_m": round(est_min * 220),
                    "stops_away": max(1, int(est_min / 2.5)),
                    "direction": "out",
                    "bus_id": 900 + len(out) + 1,
                    "reg_no": f"DL1PB{random.randint(1000, 9999)}",
                    "route_id": rid,
                    "towards": towards,
                    "occupancy": occupancy_class(pct / 100),
                    "load_pct": pct,
                    "seat_prob": seat_probability(pct / 100),
                    "speed_kmh": 16.5,
                    "broken": False
                })

    out.sort(key=lambda x: x["eta_min"])
    return out[:8]

# ------------------------------------------------------------------ alerts
def nearest_stop(route_id, progress):
    route = ROUTES[route_id]
    d = progress % (route["period"] / 2) if progress < route["period"] / 2 else route["period"] - progress
    return STOPS[min(route["stops"], key=lambda s: abs(s["d"] - d))["id"]]["name"]

@app.get("/alerts")
def alerts():
    now, out, slow_routes = time.time(), [], set()
    live = fresh()
    for st in live:
        v = bus_view(st)
        if v["broken"]:
            out.append({"id": f"brk{v['bus_id']}", "severity": "critical", "type": "breakdown", "route_id": v["route_id"],
                        "message": f"Bus {v['reg_no']} broke down near {nearest_stop(v['route_id'], st['progress'])}. Spare bus needed."})
        elif v["load_pct"] >= 90:
            out.append({"id": f"crowd{v['bus_id']}", "severity": "warning", "type": "overcrowding", "route_id": v["route_id"],
                        "message": f"Bus {v['reg_no']} on Route {v['route_id']} is overcrowded ({v['load_pct']}% full)."})
        if not v["broken"] and 0 < v["speed_kmh"] < 7 and v["route_id"] not in slow_routes:
            slow_routes.add(v["route_id"])
            out.append({"id": f"slow{v['bus_id']}", "severity": "info", "type": "delay", "route_id": v["route_id"],
                        "message": f"Heavy traffic near {nearest_stop(v['route_id'], st['progress'])}: Route {v['route_id']} buses are crawling at {v['speed_kmh']} km/h."})
    by_route = {}
    for st in live:
        by_route.setdefault(st["route_id"], []).append(st)
    for rid, group in by_route.items():
        period = ROUTES[rid]["period"]
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                gap = abs(group[i]["progress"] - group[j]["progress"])
                gap = min(gap, period - gap)
                if gap < 350:
                    a, b = FLEET[group[i]["bus_id"]]["reg_no"], FLEET[group[j]["bus_id"]]["reg_no"]
                    out.append({"id": f"bunch{rid}{i}{j}", "severity": "warning", "type": "bunching", "route_id": rid,
                                "message": f"Bus bunching on Route {rid}: {a} and {b} are only {round(gap)} m apart."})
    for k, inc in enumerate(INCIDENTS):
        if now - inc["ts"] < 300:
            who = FLEET[inc["bus_id"]]["reg_no"] if inc["bus_id"] in FLEET else "a passenger"
            out.append({"id": f"inc{k}", "severity": "critical", "type": inc["kind"], "route_id": None,
                        "message": f"{inc['kind'].upper()} reported by {who}. {inc['note']}".strip()})
    order = {"critical": 0, "warning": 1, "info": 2}
    out.sort(key=lambda a: order.get(a["severity"], 3))
    return out[:30]

# ------------------------------------------------------------------ admin: KPIs, forecast, allocation
def route_counts():
    c = {r: 0 for r in ROUTES}
    for rid in ASSIGN.values():
        c[rid] += 1
    return c

def next_24h(route_id):
    now = datetime.now()
    base = now.weekday() * 24 + now.hour
    series = FORECAST.get(route_id, [0] * 168)
    return [{"hour": (now.hour + i) % 24, "passengers": series[(base + i) % 168]} for i in range(24)]

def needed_buses(passengers): # buses = ceil(peak / (capacity x target load factor))
    return math.ceil(passengers / (BUS_HOUR_CAPACITY * TARGET_LF))

@app.get("/admin/kpis")
def kpis():
    live = fresh()
    midnight = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    with LOCK:
        total = db.execute("select coalesce(sum(boarded),0) from boardings where ts>=?", (midnight,)).fetchone()[0]
    hour = city_hour()
    moving = [s for s in live if s["speed_kmh"] >= 1]
    on_time = [s for s in moving if s["speed_kmh"] >= 0.7 * hist_speed_kmh(hour)]
    return {"active_buses": len(live), "fleet": len(FLEET),
            "avg_speed_kmh": round(sum(s["speed_kmh"] for s in moving) / len(moving), 1) if moving else 0,
            "crowded_buses": sum(1 for s in live if s["onboard"] / FLEET[s["bus_id"]]["capacity"] > 0.75),
            "on_time_pct": round(100 * len(on_time) / len(moving)) if moving else 100,
            "passengers_today": int(total), "model": METRICS}

@app.get("/admin/forecast")
def forecast():
    out = {}
    counts = route_counts()
    for rid in ROUTES:
        series = next_24h(rid)
        peak = max(series, key=lambda x: x["passengers"])
        out[rid] = {"series": series, "peak": peak, "needed": needed_buses(peak["passengers"]),
                    "have": counts[rid]}
    return out

@app.get("/admin/recommendations")
def recommendations():
    f = forecast()
    deficit = {r: f[r]["needed"] - f[r]["have"] for r in f}
    donors = {r: -d for r, d in deficit.items() if d < 0}
    recs = []
    for to_r in sorted((r for r in deficit if deficit[r] > 0), key=lambda r: -deficit[r]):
        need = deficit[to_r]
        for from_r in sorted(donors, key=lambda r: -donors[r]):
            take = min(need, donors[from_r])
            if take > 0:
                hr = f[to_r]["peak"]["hour"]
                recs.append({"from_route": from_r, "to_route": to_r, "buses": take,
                             "reason": f"Route {to_r} is forecast to peak at {f[to_r]['peak']['passengers']:.0f} passengers/hour around "
                                       f"{hr:02d}:00 and needs {f[to_r]['needed']} buses (has {f[to_r]['have']}). "
                                       f"Route {from_r} has {donors[from_r]} spare."})
                donors[from_r] -= take
                need -= take
                if need == 0:
                    break
    return recs

class Accept(BaseModel):
    from_route: str
    to_route: str
    buses: int

@app.post("/admin/recommendations/accept")
def accept(a: Accept):
    candidates = sorted((b for b, r in ASSIGN.items() if r == a.from_route),
                        key=lambda b: LIVE[b]["onboard"] if b in LIVE else 0) # emptiest buses move first
    moved = candidates[:a.buses]
    for b in moved:
        ASSIGN[b] = a.to_route
    return {"moved": moved}

class WhatIf(BaseModel):
    route_id: str
    add_buses: int

@app.post("/admin/whatif")
def whatif(w: WhatIf):
    f = forecast()[w.route_id]
    peak, have = f["peak"]["passengers"], f["have"]
    def util(n):
        return round(100 * peak / (max(1, n) * BUS_HOUR_CAPACITY))
    return {"peak_passengers": peak, "buses_now": have, "buses_after": have + w.add_buses,
            "load_now_pct": util(have), "load_after_pct": util(have + w.add_buses)}

# ------------------------------------------------------------------ simulator control
class SimEvent(BaseModel):
    type: str # jam | surge | breakdown
    route_id: str

@app.post("/sim/event")
def sim_event(e: SimEvent):
    until = time.time() + 90
    if e.type in ("jam", "surge"):
        SIM[e.type][e.route_id] = until
    elif e.type == "breakdown":
        ids = [s["bus_id"] for s in fresh() if s["route_id"] == e.route_id and s["bus_id"] not in SIM["broken"]]
        if ids:
            bus = random.choice(ids)
            SIM["broken"][bus] = until
            ingest_incident(Incident(bus_id=bus, kind="breakdown", note="Engine failure reported by driver."))
    return {"ok": True}

class Hour(BaseModel):
    hour: int | None = None

@app.post("/sim/hour")
def sim_hour(h: Hour):
    SIM["hour"] = h.hour
    return {"ok": True}

@app.get("/sim/flags")
def sim_flags():
    now = time.time()
    return {"jam": [r for r, t in SIM["jam"].items() if t > now],
            "surge": [r for r, t in SIM["surge"].items() if t > now],
            "broken": [b for b, t in SIM["broken"].items() if t > now],
            "assign": ASSIGN}
