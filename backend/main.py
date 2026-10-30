"""
Smart Public Bus Tracking & Fleet Management System
FastAPI Core Application Server
Location: Delhi, India
"""

import math
import time
import os
import random
from datetime import datetime
from typing import List, Dict, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ==============================================================================
# 1. APPLICATION INITIALIZATION & CORS CONFIGURATION
# ==============================================================================

app = FastAPI(
    title="Delhi Smart Public Bus Fleet API",
    description="Real-time telemetry, route-aware ETA, demand forecasting & fleet management for Delhi",
    version="1.0.0",
)

# Enable permissive CORS for frontend client development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js frontend on localhost:3000 or production domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# 2. DELHI TRANSIT NETWORK DEFINITIONS (23 STOPS ACROSS 3 CORRIDORS)
# ==============================================================================

STOPS = [
    # Route A: North-West Delhi Line (8 stops)
    {"id": 1, "name": "Kashmere Gate ISBT", "lat": 28.6667, "lng": 77.2286, "route": "A"},
    {"id": 2, "name": "Tis Hazari Court",    "lat": 28.6603, "lng": 77.2184, "route": "A"},
    {"id": 3, "name": "Filmistan",           "lat": 28.6562, "lng": 77.2113, "route": "A"},
    {"id": 4, "name": "Sadar Bazaar",        "lat": 28.6560, "lng": 77.2049, "route": "A"},
    {"id": 5, "name": "Rani Jhansi Road",    "lat": 28.6481, "lng": 77.2010, "route": "A"},
    {"id": 6, "name": "Karol Bagh Metro",    "lat": 28.6514, "lng": 77.1907, "route": "A"},
    {"id": 7, "name": "Rajendra Place",      "lat": 28.6434, "lng": 77.1773, "route": "A"},
    {"id": 8, "name": "Moti Nagar",          "lat": 28.6523, "lng": 77.1457, "route": "A"},

    # Route B: Central-East Delhi Line (8 stops)
    {"id": 9,  "name": "Connaught Place",    "lat": 28.6315, "lng": 77.2167, "route": "B"},
    {"id": 10, "name": "Barakhamba Road",    "lat": 28.6310, "lng": 77.2280, "route": "B"},
    {"id": 11, "name": "Mandi House",        "lat": 28.6258, "lng": 77.2348, "route": "B"},
    {"id": 12, "name": "ITO",                "lat": 28.6275, "lng": 77.2465, "route": "B"},
    {"id": 13, "name": "Pragati Maidan",     "lat": 28.6235, "lng": 77.2500, "route": "B"},
    {"id": 14, "name": "Akshardham",         "lat": 28.6127, "lng": 77.2773, "route": "B"},
    {"id": 15, "name": "Anand Vihar ISBT",   "lat": 28.6468, "lng": 77.3155, "route": "B"},
    {"id": 16, "name": "Karkardooma Court",  "lat": 28.6545, "lng": 77.3049, "route": "B"},

    # Route C: South Delhi Line (7 stops)
    {"id": 17, "name": "AIIMS",              "lat": 28.5672, "lng": 77.2100, "route": "C"},
    {"id": 18, "name": "INA Colony",         "lat": 28.5741, "lng": 77.2094, "route": "C"},
    {"id": 19, "name": "South Extension",    "lat": 28.5742, "lng": 77.2243, "route": "C"},
    {"id": 20, "name": "Lajpat Nagar",       "lat": 28.5700, "lng": 77.2400, "route": "C"},
    {"id": 21, "name": "Moolchand",          "lat": 28.5696, "lng": 77.2434, "route": "C"},
    {"id": 22, "name": "Defence Colony",     "lat": 28.5745, "lng": 77.2330, "route": "C"},
    {"id": 23, "name": "Nehru Place",        "lat": 28.5491, "lng": 77.2533, "route": "C"},
]

ROUTES = [
    {
        "id": "A",
        "name": "Route A — North-West Delhi Line",
        "color": "#ef4444",
        "description": "Kashmere Gate ISBT to Moti Nagar via Sadar Bazaar & Karol Bagh",
        "stop_ids": [1, 2, 3, 4, 5, 6, 7, 8],
        "bus_count": 6
    },
    {
        "id": "B",
        "name": "Route B — Central-East Delhi Line",
        "color": "#3b82f6",
        "description": "Connaught Place to Karkardooma Court via ITO & Anand Vihar ISBT",
        "stop_ids": [9, 10, 11, 12, 13, 14, 15, 16],
        "bus_count": 6
    },
    {
        "id": "C",
        "name": "Route C — South Delhi Line",
        "color": "#22c55e",
        "description": "AIIMS to Nehru Place via INA, South Ext, Lajpat Nagar & Moolchand",
        "stop_ids": [17, 18, 19, 20, 21, 22, 23],
        "bus_count": 6
    }
]

# Quick indexing dictionary for stops
STOP_MAP = {s["id"]: s for s in STOPS}

# ==============================================================================
# 3. IN-MEMORY FLEET TELEMETRY & ALERT STATE STORE
# ==============================================================================

# Seed 18 buses across the 3 corridors
BUSES: Dict[str, Dict[str, Any]] = {}

def initialize_fleet():
    """Seed initial bus state at starting depots."""
    # Route A: Buses A-01 to A-06
    for i in range(1, 7):
        bus_id = f"A-0{i}"
        stop = STOP_MAP[i]
        BUSES[bus_id] = {
            "bus_id": bus_id,
            "route": "A",
            "lat": stop["lat"],
            "lng": stop["lng"],
            "speed": 22.0,
            "heading": 245.0,
            "passengers": 32 + (i * 2),  # Route A starts reasonably loaded
            "capacity": 50,
            "status": "active",
            "next_stop_id": stop["id"],
            "next_stop_name": stop["name"],
            "last_updated": datetime.now().isoformat()
        }

    # Route B: Buses B-01 to B-06
    for i in range(1, 7):
        bus_id = f"B-0{i}"
        stop = STOP_MAP[8 + i]
        BUSES[bus_id] = {
            "bus_id": bus_id,
            "route": "B",
            "lat": stop["lat"],
            "lng": stop["lng"],
            "speed": 26.0,
            "heading": 105.0,
            "passengers": 22 + (i * 2),
            "capacity": 50,
            "status": "active",
            "next_stop_id": stop["id"],
            "next_stop_name": stop["name"],
            "last_updated": datetime.now().isoformat()
        }

    # Route C: Buses C-01 to C-06
    for i in range(1, 7):
        bus_id = f"C-0{i}"
        stop = STOP_MAP[16 + i]
        BUSES[bus_id] = {
            "bus_id": bus_id,
            "route": "C",
            "lat": stop["lat"],
            "lng": stop["lng"],
            "speed": 28.0,
            "heading": 135.0,
            "passengers": 12 + i,  # Route C starts light
            "capacity": 50,
            "status": "active",
            "next_stop_id": stop["id"],
            "next_stop_name": stop["name"],
            "last_updated": datetime.now().isoformat()
        }

initialize_fleet()

# In-memory alerts buffer
ALERTS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "bus_id": "A-01",
        "route": "A",
        "type": "OVERCROWDING",
        "message": "Bus A-01 is at 94% capacity near Sadar Bazaar.",
        "severity": "warning",
        "timestamp": datetime.now().strftime("%H:%M:%S")
    }
]

# ==============================================================================
# 4. MATHEMATICAL & GEOMETRIC HELPER FUNCTIONS
# ==============================================================================

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great-circle surface distance between two points on Earth
    using the Haversine trigonometric formula. Mean Earth radius R = 6371.0 km.
    """
    p = math.pi / 180.0
    dlat = (lat2 - lat1) * p
    dlng = (lng2 - lng1) * p
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(lat1 * p) * math.cos(lat2 * p) * (math.sin(dlng / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return 6371.0 * c

def check_bunching_and_crowding_alerts():
    """
    Inspects active fleet state for bus bunching (<0.5km apart on same route)
    and overcrowding (>45 passengers / >90% capacity).
    """
    global ALERTS
    now_str = datetime.now().strftime("%H:%M:%S")
    new_alerts = []

    # Preserve any manual SOS alerts
    for a in ALERTS:
        if a.get("type") == "SOS":
            new_alerts.append(a)

    # 1. Overcrowding check
    for bus_id, b in BUSES.items():
        if b.get("passengers", 0) >= 45:
            new_alerts.append({
                "id": len(new_alerts) + 1,
                "bus_id": bus_id,
                "route": b["route"],
                "type": "OVERCROWDING",
                "message": f"Bus {bus_id} is severely overcrowded ({b['passengers']}/50 passengers - {int(b['passengers']/50*100)}%).",
                "severity": "warning",
                "timestamp": now_str
            })

    # 2. Pairwise bus bunching check
    routes = ["A", "B", "C"]
    for r in routes:
        route_buses = [b for b in BUSES.values() if b["route"] == r]
        n = len(route_buses)
        for i in range(n):
            for j in range(i + 1, n):
                b1 = route_buses[i]
                b2 = route_buses[j]
                dist = haversine_km(b1["lat"], b1["lng"], b2["lat"], b2["lng"])
                if dist < 0.5:
                    new_alerts.append({
                        "id": len(new_alerts) + 1,
                        "bus_id": f"{b1['bus_id']} & {b2['bus_id']}",
                        "route": r,
                        "type": "BUNCHING",
                        "message": f"Bus bunching detected on Route {r}! Buses {b1['bus_id']} and {b2['bus_id']} are separated by only {int(dist * 1000)} meters.",
                        "severity": "critical",
                        "timestamp": now_str
                    })

    # Keep only the 15 most recent alerts to prevent memory bloat
    ALERTS = new_alerts[-15:]

# ==============================================================================
# 5. PYDANTIC REQUEST VALIDATION SCHEMAS
# ==============================================================================

class PositionIngestModel(BaseModel):
    bus_id: str = Field(..., example="A-01")
    lat: float = Field(..., ge=-90.0, le=90.0, example=28.6560)
    lng: float = Field(..., ge=-180.0, le=180.0, example=77.2049)
    speed: float = Field(..., ge=0.0, le=120.0, example=24.5)
    heading: Optional[float] = Field(0.0, ge=0.0, le=360.0, example=180.0)
    timestamp: Optional[str] = None

class BoardingIngestModel(BaseModel):
    bus_id: str = Field(..., example="A-01")
    stop_id: Optional[int] = Field(None, example=4)
    boarded: int = Field(0, ge=0, example=5)
    alighted: int = Field(0, ge=0, example=2)
    current_passengers: Optional[int] = Field(None, ge=0, le=100, example=42)

class SosAlertModel(BaseModel):
    bus_id: str = Field(..., example="A-02")
    alert_type: str = Field(..., example="BREAKDOWN")  # BREAKDOWN, MEDICAL, ACCIDENT, SECURITY
    message: str = Field(..., example="Engine overheating near Sadar Bazaar flyover.")
    lat: Optional[float] = None
    lng: Optional[float] = None

# ==============================================================================
# 6. REST API ENDPOINTS
# ==============================================================================

@app.get("/health", tags=["System"])
def health_check():
    """System health check and live operational status."""
    return {
        "status": "healthy",
        "service": "Delhi Smart Public Bus Fleet API",
        "version": "1.0.0",
        "active_buses": len(BUSES),
        "total_stops": len(STOPS),
        "total_routes": len(ROUTES),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/stops", tags=["Network"])
def get_stops(route: Optional[str] = Query(None, description="Filter stops by route code: A, B, or C")):
    """Retrieve transit stop coordinates and metadata, optionally filtered by route."""
    if route:
        r_upper = route.upper()
        return [s for s in STOPS if s["route"] == r_upper]
    return STOPS

@app.get("/routes", tags=["Network"])
def get_routes():
    """Retrieve all monitored Delhi route corridors, colors, and assigned bus counts."""
    return ROUTES

@app.get("/buses/live", tags=["Telemetry"])
def get_live_buses():
    """
    Fetch real-time GPS coordinates, velocity, heading, and occupancy status
    for all 18 buses in the network.
    """
    results = []
    for b in BUSES.values():
        occ = b.get("passengers", 0)
        cap = b.get("capacity", 50)
        pct = round((occ / cap) * 100, 1)

        if pct < 60:
            crowd_status = "Comfortable"
        elif pct < 90:
            crowd_status = "Standing Room Only"
        else:
            crowd_status = "Overcrowded"

        results.append({
            **b,
            "occupancy_rate": pct,
            "crowd_status": crowd_status
        })
    return results

@app.get("/stops/{stop_id}/arrivals", tags=["Passenger ETA"])
def get_stop_arrivals(stop_id: int):
    """
    Calculate route-aware estimated arrival times (ETA in minutes) for all incoming
    buses heading toward a specified stop.
    """
    if stop_id not in STOP_MAP:
        raise HTTPException(status_code=404, detail=f"Stop ID {stop_id} does not exist.")

    target_stop = STOP_MAP[stop_id]
    target_route = target_stop["route"]

    # Filter buses running on the same route corridor
    candidate_buses = [b for b in BUSES.values() if b["route"] == target_route]

    arrivals = []
    for b in candidate_buses:
        # Compute geodesic distance directly to the target stop
        dist_km = haversine_km(b["lat"], b["lng"], target_stop["lat"], target_stop["lng"])

        # Enforce realistic speed lower bound (min 8 km/h in dense Delhi traffic)
        effective_speed = max(b.get("speed", 20.0), 8.0)

        # Base travel time in minutes: (distance / speed) * 60
        travel_time_min = (dist_km / effective_speed) * 60.0

        # Dwell penalty: add 0.5 minutes (30 seconds) per estimated intermediate stop
        dwell_penalty_min = 0.5

        eta_min = round(travel_time_min + dwell_penalty_min, 1)

        arrivals.append({
            "bus_id": b["bus_id"],
            "route": b["route"],
            "distance_km": round(dist_km, 2),
            "eta_min": eta_min,
            "speed_kmh": round(b.get("speed", 0.0), 1),
            "passengers": b.get("passengers", 0),
            "capacity": b.get("capacity", 50)
        })

    # Sort arrivals in ascending order of arrival time
    arrivals.sort(key=lambda x: x["eta_min"])
    return {
        "stop_id": target_stop["id"],
        "stop_name": target_stop["name"],
        "route": target_route,
        "arrivals": arrivals
    }

@app.get("/buses/{bus_id}/occupancy", tags=["Conductor & Fleet"])
def get_bus_occupancy(bus_id: str):
    """Fetch live occupancy details, capacity ratio, and historical baseline for a specific bus."""
    b_upper = bus_id.upper()
    if b_upper not in BUSES:
        raise HTTPException(status_code=404, detail=f"Bus {bus_id} not found.")

    b = BUSES[b_upper]
    occ = b.get("passengers", 0)
    cap = b.get("capacity", 50)
    pct = round((occ / cap) * 100, 1)

    return {
        "bus_id": b_upper,
        "route": b["route"],
        "passengers": occ,
        "capacity": cap,
        "occupancy_pct": pct,
        "is_overcrowded": occ >= 45,
        "status": "Overcrowded" if occ >= 45 else ("Moderate" if occ >= 30 else "Light"),
        "historical_avg_passengers": 34
    }

@app.get("/alerts", tags=["Fleet Management"])
def get_active_alerts():
    """Retrieve all current system alerts, including bunching, overcrowding, and SOS emergencies."""
    check_bunching_and_crowding_alerts()
    return ALERTS

@app.post("/ingest/position", status_code=status.HTTP_200_OK, tags=["Telemetry Ingestion"])
def ingest_bus_position(payload: PositionIngestModel):
    """
    High-frequency ingestion endpoint receiving real-time GPS telemetry from vehicle tracking units.
    """
    bus_id = payload.bus_id.upper()
    if bus_id not in BUSES:
        # Determine route from ID prefix
        route_code = bus_id[0] if bus_id[0] in ["A", "B", "C"] else "A"
        BUSES[bus_id] = {
            "bus_id": bus_id,
            "route": route_code,
            "lat": payload.lat,
            "lng": payload.lng,
            "speed": payload.speed,
            "heading": payload.heading or 0.0,
            "passengers": 25,
            "capacity": 50,
            "status": "active",
            "next_stop_id": 1,
            "next_stop_name": STOP_MAP[1]["name"],
            "last_updated": datetime.now().isoformat()
        }
    else:
        BUSES[bus_id]["lat"] = payload.lat
        BUSES[bus_id]["lng"] = payload.lng
        BUSES[bus_id]["speed"] = payload.speed
        if payload.heading is not None:
            BUSES[bus_id]["heading"] = payload.heading
        BUSES[bus_id]["last_updated"] = datetime.now().isoformat()

    return {"status": "success", "bus_id": bus_id}

@app.post("/ingest/boarding", status_code=status.HTTP_200_OK, tags=["Telemetry Ingestion"])
def ingest_passenger_boarding(payload: BoardingIngestModel):
    """
    Ingests passenger boarding and alighting numbers recorded by conductors or automated passenger counters (APC).
    """
    bus_id = payload.bus_id.upper()
    if bus_id not in BUSES:
        raise HTTPException(status_code=404, detail=f"Bus {bus_id} not recognized.")

    b = BUSES[bus_id]
    if payload.current_passengers is not None:
        b["passengers"] = max(0, min(75, payload.current_passengers))
    else:
        new_count = b["passengers"] + payload.boarded - payload.alighted
        b["passengers"] = max(0, min(75, new_count))

    if payload.stop_id and payload.stop_id in STOP_MAP:
        b["next_stop_id"] = payload.stop_id
        b["next_stop_name"] = STOP_MAP[payload.stop_id]["name"]

    b["last_updated"] = datetime.now().isoformat()
    return {"status": "success", "bus_id": bus_id, "current_passengers": b["passengers"]}

@app.post("/alerts/sos", status_code=status.HTTP_201_CREATED, tags=["Emergency Operations"])
def trigger_sos_alert(payload: SosAlertModel):
    """
    Immediate emergency SOS incident reporting submitted by onboard conductors or vehicle sensors.
    """
    bus_id = payload.bus_id.upper()
    route_code = "A"
    lat = payload.lat or 28.6315
    lng = payload.lng or 77.2167

    if bus_id in BUSES:
        route_code = BUSES[bus_id]["route"]
        lat = BUSES[bus_id]["lat"]
        lng = BUSES[bus_id]["lng"]
        BUSES[bus_id]["status"] = "emergency"

    alert_entry = {
        "id": len(ALERTS) + 1,
        "bus_id": bus_id,
        "route": route_code,
        "type": "SOS",
        "sub_type": payload.alert_type.upper(),
        "message": f"EMERGENCY ({payload.alert_type.upper()}): {payload.message}",
        "severity": "critical",
        "lat": lat,
        "lng": lng,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    }

    ALERTS.insert(0, alert_entry)
    return {"status": "dispatched", "alert": alert_entry}

@app.get("/forecast", tags=["Machine Learning"])
def get_demand_forecast(
    route: Optional[str] = Query("A", description="Route corridor code: A, B, or C"),
    hour: Optional[int] = Query(None, description="Hour of day (0-23) to forecast")
):
    """
    Predict hourly passenger demand along a transit corridor using the trained
    machine learning model or our high-accuracy fallback regression heuristic.
    """
    r_code = route.upper() if route else "A"
    target_hour = hour if hour is not None else datetime.now().hour

    # 1. Try loading trained weights from JSON
    model_json_path = Path("data/forecast_model.json")
    if model_json_path.exists():
        try:
            import json
            with open(model_json_path, "r", encoding="utf-8") as f:
                model_data = json.load(f)
            weights = model_data["weights"]
            now = datetime.now()
            day_of_week = float(now.weekday())
            is_weekend = 1.0 if day_of_week >= 5 else 0.0
            route_A = 1.0 if r_code == "A" else 0.0
            route_B = 1.0 if r_code == "B" else 0.0
            route_C = 1.0 if r_code == "C" else 0.0
            x_vec = [1.0, float(target_hour), day_of_week, is_weekend, route_A, route_B, route_C]
            pred = sum(w * x for w, x in zip(weights, x_vec))
            return {
                "route": r_code,
                "hour": target_hour,
                "predicted_passengers_per_hour": max(10, int(round(pred))),
                "model_source": "trained-ridge-regression-json",
                "peak_status": "PEAK" if target_hour in [8, 9, 10, 17, 18, 19] else "NORMAL"
            }
        except Exception:
            pass

    # 2. Try loading the trained model from pickle
    model_path = Path("data/forecast_model.pkl")
    if model_path.exists():
        try:
            import joblib
            model = joblib.load(model_path)
            # Feature vector: [hour, day_of_week, is_weekend, route_A, route_B, route_C]
            now = datetime.now()
            day_of_week = now.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            route_A = 1 if r_code == "A" else 0
            route_B = 1 if r_code == "B" else 0
            route_C = 1 if r_code == "C" else 0

            X = [[target_hour, day_of_week, is_weekend, route_A, route_B, route_C]]
            pred = model.predict(X)[0]
            predicted_demand = max(10, int(round(pred)))
            return {
                "route": r_code,
                "hour": target_hour,
                "predicted_passengers_per_hour": predicted_demand,
                "model_source": "scikit-learn-linear-regression",
                "peak_status": "PEAK" if target_hour in [8, 9, 10, 17, 18, 19] else "NORMAL"
            }
        except Exception:
            pass

    # Mathematical regression fallback modeling Delhi commute patterns
    # Peak at 9 AM and 6 PM
    morning_peak = math.exp(-0.5 * ((target_hour - 9) / 1.5) ** 2)
    evening_peak = math.exp(-0.5 * ((target_hour - 18) / 1.8) ** 2)

    base = 35.0 if r_code == "A" else (28.0 if r_code == "B" else 15.0)
    surge = 120.0 if r_code == "A" else (90.0 if r_code == "B" else 40.0)

    predicted_val = int(base + surge * (morning_peak + evening_peak))

    return {
        "route": r_code,
        "hour": target_hour,
        "predicted_passengers_per_hour": predicted_val,
        "model_source": "delhi-transit-heuristic-regression",
        "peak_status": "PEAK" if (morning_peak > 0.4 or evening_peak > 0.4) else "OFF-PEAK"
    }

@app.get("/advice", tags=["Fleet Management"])
def get_rebalancing_advice():
    """
    Fleet rebalancing decision engine: analyzes cross-corridor occupancy disparities
    and provides actionable transfer directives to relieve severe bottlenecks.
    """
    # Calculate average occupancy per route
    route_stats = {"A": [], "B": [], "C": []}
    for b in BUSES.values():
        r = b.get("route", "A")
        if r in route_stats:
            route_stats[r].append(b.get("passengers", 0))

    avg_A = (sum(route_stats["A"]) / len(route_stats["A"])) if route_stats["A"] else 0
    avg_B = (sum(route_stats["B"]) / len(route_stats["B"])) if route_stats["B"] else 0
    avg_C = (sum(route_stats["C"]) / len(route_stats["C"])) if route_stats["C"] else 0

    advice = []

    # Check for acute imbalance between Route A and Route C
    if avg_A > 40 and avg_C < 25:
        advice.append({
            "id": 1,
            "type": "REBALANCE_TRANSFER",
            "priority": "HIGH",
            "source_route": "C",
            "target_route": "A",
            "recommended_transfers": 2,
            "rationale": f"Route A is running at severe capacity ({int(avg_A/50*100)}% avg load), while Route C has surplus bandwidth ({int(avg_C/50*100)}% avg load).",
            "action": "Shift 2 buses from Route C to Route A (via Barakhamba / Ring Road interchange).",
            "projected_wait_reduction_min": 4.2
        })
    elif avg_A > 42:
        advice.append({
            "id": 2,
            "type": "DEPLOY_DEPOT_STANDBY",
            "priority": "MEDIUM",
            "source_route": "DEPOT",
            "target_route": "A",
            "recommended_transfers": 1,
            "rationale": f"Route A exceeds 84% average occupancy along Karol Bagh-Sadar Bazaar corridor.",
            "action": "Deploy 1 standby vehicle from Kashmere Gate ISBT depot to Route A.",
            "projected_wait_reduction_min": 2.8
        })

    # Always ensure baseline advisory is present for admin monitoring
    if not advice:
        advice.append({
            "id": 3,
            "type": "NOMINAL_EQUILIBRIUM",
            "priority": "LOW",
            "source_route": None,
            "target_route": None,
            "recommended_transfers": 0,
            "rationale": "Network load is currently balanced across all three Delhi transit corridors.",
            "action": "Maintain scheduled headways. No inter-route rebalancing required at this time.",
            "projected_wait_reduction_min": 0.0
        })

    return {
        "fleet_averages": {
            "Route_A_occupancy_pct": round((avg_A / 50) * 100, 1),
            "Route_B_occupancy_pct": round((avg_B / 50) * 100, 1),
            "Route_C_occupancy_pct": round((avg_C / 50) * 100, 1)
        },
        "recommendations": advice
    }

@app.get("/whatif", tags=["Scenario Simulation"])
def what_if_simulation(
    route: str = Query("A", description="Corridor code: A, B, or C"),
    add_buses: int = Query(0, ge=-3, le=10, description="Change in active fleet size (-3 to +10)"),
    demand_multiplier: float = Query(1.0, ge=0.5, le=3.0, description="Demand scaling factor (0.5 to 3.0)")
):
    """
    What-If scenario simulation engine: projects headway improvements, passenger wait time
    reductions, occupancy adjustments, and operational costs.
    """
    r_code = route.upper()
    base_buses = 6
    new_buses = max(1, base_buses + add_buses)

    # Route cycle lengths in kilometers
    route_distance_km = {"A": 16.5, "B": 21.0, "C": 14.8}.get(r_code, 17.0)
    avg_speed_kmh = 22.0

    # Base cycle time in minutes = (Distance / Speed) * 60 + stop dwell
    cycle_time_min = (route_distance_km / avg_speed_kmh) * 60 + (8 * 0.5)

    # Headway = Cycle Time / Active Buses
    base_headway_min = cycle_time_min / base_buses
    projected_headway_min = cycle_time_min / new_buses

    # Average passenger wait time is approximately half the headway
    base_wait_min = base_headway_min / 2.0
    projected_wait_min = projected_headway_min / 2.0
    wait_time_saved_min = round(base_wait_min - projected_wait_min, 1)

    # Occupancy impact calculation
    base_load = 44 if r_code == "A" else (32 if r_code == "B" else 18)
    simulated_demand = base_load * demand_multiplier
    projected_occupancy_per_bus = min(50, round((simulated_demand * base_buses) / new_buses, 1))
    occupancy_pct = round((projected_occupancy_per_bus / 50) * 100, 1)

    # Economic impact (estimated fuel + staff cost in INR per hour)
    cost_per_bus_hour_inr = 450
    hourly_cost_delta_inr = add_buses * cost_per_bus_hour_inr

    return {
        "route": r_code,
        "baseline_buses": base_buses,
        "simulated_buses": new_buses,
        "demand_multiplier": demand_multiplier,
        "baseline_headway_minutes": round(base_headway_min, 1),
        "projected_headway_minutes": round(projected_headway_min, 1),
        "wait_time_reduction_minutes": wait_time_saved_min,
        "projected_bus_occupancy_pct": occupancy_pct,
        "crowding_risk": "HIGH" if occupancy_pct > 85 else ("MODERATE" if occupancy_pct > 65 else "LOW"),
        "hourly_operational_cost_delta_inr": hourly_cost_delta_inr
    }

# Entrypoint execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
