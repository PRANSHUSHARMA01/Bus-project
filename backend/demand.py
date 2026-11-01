"""Shared 'city behaviour' numbers used by the simulator, the history generator and the API."""
import math

# Passengers per hour on a normal weekday peak (modelled on typical Delhi corridors)
ROUTE_PEAK = {
    "502": 680,
    "427": 490,
    "102": 560,
    "534": 620,
    "615": 410,
    "764": 530,
    "73": 580,
    "78": 460,
    "761": 520,
    "543A": 500,
    "721": 540,
    "623": 470,
    "861A": 480,
    "144": 510,
    "192": 450,
    "AIRPORT": 420,
    "A": 680,
    "B": 490,
    "C": 560,
}

# Fleet maths from the project PPT: buses = ceil(peak / (capacity x target load factor))
BUS_CAPACITY = 60 # low-floor bus, passengers
TRIPS_PER_HOUR = 1.0 # one-way trips a bus completes per hour
TURNOVER = 1.5 # each seat-trip is used ~1.5x because people get on/off en route
BUS_HOUR_CAPACITY = BUS_CAPACITY * TRIPS_PER_HOUR * TURNOVER # 90 pax per bus per hour
TARGET_LF = 0.8 # we aim to keep buses at 80 % full at peak

def _g(h, mean, sd):
    return math.exp(-((h - mean) ** 2) / (2 * sd * sd))

def hourly_factor(hour, weekend=False):
    """0..1 demand multiplier for an hour of the day (0-23)."""
    if weekend:
        return min(1.0, 0.10 + 0.55 * _g(hour, 12, 3.5) + 0.40 * _g(hour, 18, 2.2))
    peak = max(_g(hour, 9, 1.6), _g(hour, 18, 1.8))
    return min(1.0, 0.10 + 0.82 * peak + 0.22 * _g(hour, 13, 2.5))

def hist_speed_kmh(hour):
    """Typical city bus speed by hour: ~24 km/h free flow, ~13 km/h in the rush."""
    peak = max(_g(hour, 9, 1.6), _g(hour, 18, 1.8))
    return 24 - 11 * peak
