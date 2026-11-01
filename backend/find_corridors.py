import csv
from pathlib import Path

gtfs_dir = Path(r"C:\Users\prans\Downloads\delhi_buses_static_gtfs_v1\delhi_buses_static_gtfs_v1-2")

trunk_prefixes = ["502", "534", "419", "102", "729", "522", "615", "427", "764"]

matches = []
with open(gtfs_dir / "routes.txt", "r", encoding="utf-8", errors="ignore") as f:
    for row in csv.DictReader(f):
        sname = row["route_short_name"]
        if any(sname.startswith(p) for p in trunk_prefixes):
            if ("DOWN" in sname or "UP" in sname) and "LSTL" not in sname and "STL" not in sname:
                matches.append(row)

print("Prominent trunk routes found:", len(matches))
for m in matches:
    print(f"route_id: {m['route_id']} | code: {m['route_short_name']} | desc: {m['route_desc']}")
