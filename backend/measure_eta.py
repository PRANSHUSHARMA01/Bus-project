"""Measures how accurate the ETAs are. Needs the API + simulator running.
Run: python measure_eta.py --speedup 8 --minutes 9 (use the SAME --speedup as the simulator)
It watches every stop, remembers each ETA the API promised, and compares it with when the bus really arrived."""
import argparse, json, time
from pathlib import Path
from collections import defaultdict, deque
import requests

DATA_DIR = Path(__file__).parent / "data"

ap = argparse.ArgumentParser()
ap.add_argument("--api", default="http://127.0.0.1:8000")
ap.add_argument("--speedup", type=float, default=6.0)
ap.add_argument("--minutes", type=float, default=9.0)
args = ap.parse_args()

s = requests.Session()
stops = [x["id"] for x in s.get(args.api + "/stops").json()]
samples = defaultdict(lambda: deque(maxlen=900)) # (bus, stop) -> [(t_wall, eta_min, dist_m)]
was_far = defaultdict(lambda: True)
errors = {5: [], 10: []} # horizon (sim-minutes before arrival) -> errors in minutes
end = time.time() + args.minutes * 60
print(f"Measuring for {args.minutes} minutes...")

while time.time() < end:
    t = time.time()
    for sid in stops:
        try:
            arr = s.get(f"{args.api}/stops/{sid}/arrivals", timeout=3).json()
        except Exception:
            continue
        for a in arr:
            key = (a["bus_id"], sid)
            if a["distance_m"] > 30:
                samples[key].append((t, a["eta_min"], a["distance_m"]))
                was_far[key] = True
            elif was_far[key]: # first sample at the stop = arrival
                was_far[key] = False
                for horizon in errors:
                    cand = [x for x in samples[key] if abs(x[1] - horizon) <= 0.7]
                    if cand:
                        ts, eta, _ = min(cand, key=lambda x: abs(x[1] - horizon))
                        actual_min = (t - ts) * args.speedup / 60 # real minutes that passed in the city
                        errors[horizon].append(eta - actual_min)
                samples[key].clear()
    time.sleep(max(0, 2 - (time.time() - t)))

result = {}
for h, errs in errors.items():
    if errs:
        mae = sum(abs(e) for e in errs) / len(errs)
        within = 100 * sum(abs(e) <= 2 for e in errs) / len(errs)
        result[f"{h}_min_ahead"] = {"arrivals_measured": len(errs), "mean_abs_error_min": round(mae, 2),
                                    "within_2_min_pct": round(within, 1)}

print(json.dumps(result, indent=2))
json.dump(result, open(DATA_DIR / "eta_accuracy.json", "w"), indent=2)
