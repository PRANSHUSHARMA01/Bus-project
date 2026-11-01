"""Creates 6 weeks of hourly passenger counts per route -> data/history.csv
It is SIMULATED but follows real commuter patterns: two rush hours, quieter weekends,
holiday dips, and random day-to-day noise. Replace it with your real boarding data later."""
import csv, random, datetime as dt
from pathlib import Path
from demand import ROUTE_PEAK, hourly_factor

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

random.seed(42)
HOLIDAYS = {dt.date(2026, 10, 2)} # add more gazetted holidays here
end = dt.date.today()
start = end - dt.timedelta(days=42)
rows = []
day = start
while day < end:
    weekend = day.weekday() >= 5
    holiday = day in HOLIDAYS
    day_mood = random.gauss(1.0, 0.05) # some days are just busier
    for route, peak in ROUTE_PEAK.items():
        for hour in range(24):
            f = hourly_factor(hour, weekend or holiday)
            n = peak * f * day_mood * random.gauss(1.0, 0.06)
            ts = dt.datetime(day.year, day.month, day.day, hour)
            rows.append([route, ts.isoformat(), hour, day.weekday(), int(holiday), max(0, round(n))])
    day += dt.timedelta(days=1)

with open(DATA_DIR / "history.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["route_id", "ts", "hour", "dow", "is_holiday", "passengers"])
    w.writerows(rows)
print("wrote", len(rows), "rows", start, "->", end)
