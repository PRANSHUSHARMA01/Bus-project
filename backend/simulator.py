"""
Smart Public Bus Tracking & Fleet Management System
High-Fidelity Autonomous GPS & Telemetry Simulator
Location: Delhi, India
"""

import time
import math
import random
import requests
from datetime import datetime
from typing import List, Tuple, Dict

API_BASE_URL = "http://localhost:8000"

# ==============================================================================
# ROUTE WAYPOINTS (LATITUDE, LONGITUDE) FOR ROUTES A, B, AND C
# ==============================================================================

WAYPOINTS_A = [
    (28.6667, 77.2286),  # 1. Kashmere Gate ISBT
    (28.6603, 77.2184),  # 2. Tis Hazari Court
    (28.6562, 77.2113),  # 3. Filmistan
    (28.6560, 77.2049),  # 4. Sadar Bazaar
    (28.6481, 77.2010),  # 5. Rani Jhansi Road
    (28.6514, 77.1907),  # 6. Karol Bagh Metro
    (28.6434, 77.1773),  # 7. Rajendra Place
    (28.6523, 77.1457),  # 8. Moti Nagar
]

WAYPOINTS_B = [
    (28.6315, 77.2167),  # 9. Connaught Place
    (28.6310, 77.2280),  # 10. Barakhamba Road
    (28.6258, 77.2348),  # 11. Mandi House
    (28.6275, 77.2465),  # 12. ITO
    (28.6235, 77.2500),  # 13. Pragati Maidan
    (28.6127, 77.2773),  # 14. Akshardham
    (28.6468, 77.3155),  # 15. Anand Vihar ISBT
    (28.6545, 77.3049),  # 16. Karkardooma Court
]

WAYPOINTS_C = [
    (28.5672, 77.2100),  # 17. AIIMS
    (28.5741, 77.2094),  # 18. INA Colony
    (28.5742, 77.2243),  # 19. South Extension
    (28.5700, 77.2400),  # 20. Lajpat Nagar
    (28.5696, 77.2434),  # 21. Moolchand
    (28.5745, 77.2330),  # 22. Defence Colony
    (28.5491, 77.2533),  # 23. Nehru Place
]

# ==============================================================================
# BUS AGENT CLASS WITH INTERPOLATION & DYNAMICS
# ==============================================================================

class SimulatedBus:
    def __init__(self, bus_id: str, route: str, waypoints: List[Tuple[float, float]], offset: float):
        self.bus_id = bus_id
        self.route = route
        self.waypoints = waypoints
        self.num_segments = len(waypoints) - 1
        self.progress = offset % self.num_segments
        self.forward = True
        self.speed = 24.0
        self.passengers = 25
        self.lat = waypoints[0][0]
        self.lng = waypoints[0][1]
        self.heading = 0.0

        # Calibrate initial passengers based on corridor profile
        if self.route == "A":
            self.passengers = random.randint(38, 48)  # Route A is naturally dense
        elif self.route == "B":
            self.passengers = random.randint(22, 34)
        else:
            self.passengers = random.randint(12, 20)  # Route C stays light

    def update_position(self, delta_t_hours: float):
        # 1. Determine speed based on time of day and corridor congestion
        current_hour = datetime.now().hour
        is_rush_hour = current_hour in [8, 9, 10, 17, 18, 19]

        if is_rush_hour:
            # Dense traffic around Sadar Bazaar / Connaught Place
            base_speed = 13.0 if self.route == "A" else (16.0 if self.route == "B" else 22.0)
        else:
            base_speed = 28.0 if self.route != "A" else 22.0

        # Small random speed flutter (+/- 2.5 km/h)
        self.speed = max(6.0, base_speed + random.uniform(-2.5, 2.5))

        # 2. Approximate segment length (~1.5 km per stop)
        segment_km = 1.5
        progress_increment = (self.speed * delta_t_hours) / segment_km

        # 3. Advance progress along path
        if self.forward:
            self.progress += progress_increment
            if self.progress >= self.num_segments:
                self.progress = self.num_segments - 0.01
                self.forward = False  # Reverse direction at terminus
        else:
            self.progress -= progress_increment
            if self.progress <= 0:
                self.progress = 0.01
                self.forward = True  # Loop back forward

        # 4. Linear interpolation between waypoints
        seg_idx = int(self.progress)
        seg_fraction = self.progress - seg_idx
        seg_idx = min(seg_idx, self.num_segments - 1)

        p1 = self.waypoints[seg_idx]
        p2 = self.waypoints[seg_idx + 1]

        # Calculate interpolated coordinates
        raw_lat = p1[0] + (p2[0] - p1[0]) * seg_fraction
        raw_lng = p1[1] + (p2[1] - p1[1]) * seg_fraction

        # 5. Calculate magnetic heading in degrees
        d_lat = p2[0] - p1[0]
        d_lng = p2[1] - p1[1]
        raw_heading = math.degrees(math.atan2(d_lng, d_lat))
        self.heading = (raw_heading + 360) % 360 if self.forward else (raw_heading + 180) % 360

        # 6. Add Gaussian GPS noise (sigma = 0.00018 deg, ~18-20 meters)
        gps_noise_lat = random.gauss(0, 0.00018)
        gps_noise_lng = random.gauss(0, 0.00018)

        self.lat = round(raw_lat + gps_noise_lat, 6)
        self.lng = round(raw_lng + gps_noise_lng, 6)

        # 7. Passenger boarding dynamics
        # Route A gets heavily crowded (reaching 46-52 passengers); Route C stays light
        if self.route == "A":
            if is_rush_hour or random.random() < 0.6:
                # Upward pressure on Route A
                self.passengers = min(52, self.passengers + random.choice([0, 1, 2, -1]))
            else:
                self.passengers = max(28, min(48, self.passengers + random.choice([-1, 0, 1])))
        elif self.route == "B":
            self.passengers = max(18, min(44, self.passengers + random.choice([-2, -1, 0, 1, 2])))
        elif self.route == "C":
            # Route C stays comfortably light throughout the day
            self.passengers = max(8, min(24, self.passengers + random.choice([-1, 0, 1])))

# ==============================================================================
# INITIALIZE 18 SIMULATED FLEET BUSES
# ==============================================================================

def create_fleet() -> List[SimulatedBus]:
    fleet = []

    # Route A (6 Buses): Staggered offsets
    # A-01 and A-02 are close together to demonstrate bunching detection
    offsets_a = [0.2, 0.35, 1.8, 3.2, 4.6, 5.8]
    for i in range(6):
        fleet.append(SimulatedBus(f"A-0{i+1}", "A", WAYPOINTS_A, offsets_a[i]))

    # Route B (6 Buses): Evenly distributed
    offsets_b = [0.1, 1.2, 2.4, 3.6, 4.8, 6.0]
    for i in range(6):
        fleet.append(SimulatedBus(f"B-0{i+1}", "B", WAYPOINTS_B, offsets_b[i]))

    # Route C (6 Buses): Evenly distributed
    offsets_c = [0.2, 1.1, 2.1, 3.1, 4.1, 5.1]
    for i in range(6):
        fleet.append(SimulatedBus(f"C-0{i+1}", "C", WAYPOINTS_C, offsets_c[i]))

    return fleet

# ==============================================================================
# MAIN SIMULATION TELEMETRY TRANSMISSION LOOP
# ==============================================================================

def run_simulator():
    print("=" * 72)
    print("  DELHI SMART BUS FLEET SIMULATOR")
    print("  Publishing GPS Telemetry for 18 Buses to http://localhost:8000")
    print("  Press Ctrl+C to terminate simulation.")
    print("=" * 72)

    fleet = create_fleet()
    tick_interval_seconds = 1.0  # 1 second refresh cycle
    delta_t_hours = tick_interval_seconds / 3600.0
    iteration = 0

    while True:
        iteration += 1
        active_pings = 0

        for bus in fleet:
            bus.update_position(delta_t_hours)

            # 1. Post GPS position telemetry
            pos_payload = {
                "bus_id": bus.bus_id,
                "lat": bus.lat,
                "lng": bus.lng,
                "speed": round(bus.speed, 1),
                "heading": round(bus.heading, 1),
                "timestamp": datetime.now().isoformat()
            }

            try:
                requests.post(f"{API_BASE_URL}/ingest/position", json=pos_payload, timeout=0.8)
                active_pings += 1
            except Exception:
                # Backend may still be initializing
                pass

            # 2. Every 5 ticks, synchronize passenger count
            if iteration % 5 == 0:
                boarding_payload = {
                    "bus_id": bus.bus_id,
                    "current_passengers": bus.passengers
                }
                try:
                    requests.post(f"{API_BASE_URL}/ingest/boarding", json=boarding_payload, timeout=0.8)
                except Exception:
                    pass

        # Terminal status summary every 10 ticks
        if iteration % 10 == 0:
            crowded_a = [b for b in fleet if b.route == "A" and b.passengers >= 45]
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Tick #{iteration:04d} | "
                  f"18 Buses Live | Route A Overcrowded: {len(crowded_a)} buses | "
                  f"Route C Average Load: ~14 pass.")

        time.sleep(tick_interval_seconds)

if __name__ == "__main__":
    run_simulator()
