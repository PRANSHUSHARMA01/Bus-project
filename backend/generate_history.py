"""
Smart Public Bus Tracking & Fleet Management System
Historical Ridership Dataset Generator (6 Weeks / 3,024 Records)
Pure Python Standard Library (Zero DLL dependencies)
Location: Delhi, India
"""

import os
import csv
import math
import random
from datetime import datetime, timedelta

def generate_ridership_history():
    print("=" * 72)
    print("  GENERATING 6 WEEKS OF HISTORICAL DELHI BUS RIDERSHIP DATA")
    print("=" * 72)

    # Output directory setup
    os.makedirs("data", exist_ok=True)
    output_path = "data/ridership_history.csv"

    # Time configuration: 42 days ending yesterday
    end_date = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=42)

    routes = [
        {"code": "A", "name": "North-West Delhi Line", "base_volume": 45.0, "peak_multiplier": 3.8},
        {"code": "B", "name": "Central-East Delhi Line", "base_volume": 35.0, "peak_multiplier": 3.2},
        {"code": "C", "name": "South Delhi Line",        "base_volume": 18.0, "peak_multiplier": 2.2},
    ]

    fieldnames = [
        "timestamp", "date", "hour", "day_of_week", "is_weekend",
        "route", "boarded_passengers", "alighted_passengers",
        "avg_bus_occupancy", "avg_speed_kmh"
    ]

    row_count = 0
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        current_time = start_date
        while current_time < end_date:
            hour = current_time.hour
            day_of_week = current_time.weekday()  # 0=Monday, 6=Sunday
            is_weekend = 1 if day_of_week >= 5 else 0

            # Commuter Gaussian peak calculations
            # Morning peak centered at 9 AM, Evening peak centered at 6 PM (18:00)
            morning_peak = math.exp(-0.5 * ((hour - 9) / 1.5) ** 2)
            evening_peak = math.exp(-0.5 * ((hour - 18) / 1.8) ** 2)
            combined_peak = morning_peak + (evening_peak * 0.9)

            # Night suppression (midnight to 5 AM)
            if 0 <= hour <= 5:
                night_factor = 0.08
            else:
                night_factor = 1.0

            for r in routes:
                base = r["base_volume"]

                if is_weekend:
                    weekend_bump = math.exp(-0.5 * ((hour - 15) / 3.0) ** 2)
                    expected_demand = (base * 0.7) + (base * 1.4 * weekend_bump)
                else:
                    expected_demand = (base * night_factor) + (base * r["peak_multiplier"] * combined_peak)

                noise = random.gauss(0, expected_demand * 0.08)
                boarded = max(2, int(round(expected_demand + noise)))
                alighted = max(1, int(round(boarded * random.uniform(0.85, 1.15))))

                bus_count = 6
                avg_occupancy = min(50, max(5, int(round(boarded / bus_count * 1.6))))

                if boarded > 100:
                    avg_speed = round(random.uniform(12.0, 16.0), 1)
                elif boarded > 50:
                    avg_speed = round(random.uniform(18.0, 24.0), 1)
                else:
                    avg_speed = round(random.uniform(28.0, 35.0), 1)

                writer.writerow({
                    "timestamp": current_time.isoformat(),
                    "date": current_time.strftime("%Y-%m-%d"),
                    "hour": hour,
                    "day_of_week": day_of_week,
                    "is_weekend": is_weekend,
                    "route": r["code"],
                    "boarded_passengers": boarded,
                    "alighted_passengers": alighted,
                    "avg_bus_occupancy": avg_occupancy,
                    "avg_speed_kmh": avg_speed
                })
                row_count += 1

            current_time += timedelta(hours=1)

    print(f"-> Successfully synthesized {row_count} records across 42 days.")
    print(f"-> Saved dataset to: {output_path}")

if __name__ == "__main__":
    generate_ridership_history()
