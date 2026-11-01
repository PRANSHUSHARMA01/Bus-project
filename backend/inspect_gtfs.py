import csv
from pathlib import Path

gtfs_dir = Path(r"C:\Users\prans\Downloads\delhi_buses_static_gtfs_v1\delhi_buses_static_gtfs_v1-2")

for fn in ["agency.txt", "routes.txt", "stops.txt", "trips.txt", "shapes.txt", "stop_times.txt"]:
    p = gtfs_dir / fn
    if p.exists():
        with open(p, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f)
            header = next(reader)
            rows = []
            for _ in range(3):
                try:
                    rows.append(next(reader))
                except StopIteration:
                    break
            print(f"=== {fn} ===")
            print("Header:", header)
            for r in rows:
                print("Row:", r)
            print()
