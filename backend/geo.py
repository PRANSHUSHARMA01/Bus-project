"""Tiny geometry helper: snap a GPS point onto a route line and walk along a route line."""
import math
from bisect import bisect_right

R_LAT = 110540.0 # metres per degree of latitude
R_LNG = 111320.0 # metres per degree of longitude at the equator

class Track:
    """A polyline of (lat, lng) points. circular=True means it repeats after its length."""
    def __init__(self, latlng, circular=False):
        lat0 = sum(p[0] for p in latlng) / len(latlng)
        self.k = math.cos(math.radians(lat0))
        self.xy = [self._xy(a, b) for a, b in latlng]
        self.cum = [0.0]
        for i in range(1, len(self.xy)):
            self.cum.append(self.cum[-1] + math.dist(self.xy[i - 1], self.xy[i]))
        self.length = self.cum[-1]
        self.circular = circular

    def _xy(self, lat, lng):
        return (lng * R_LNG * self.k, lat * R_LAT)

    def _far(self, a, b, hint, window):
        mid, half = (a + b) / 2, (b - a) / 2
        d = abs(mid - hint)
        if self.circular:
            d = min(d, self.length - d)
        return d > half + window

    def snap(self, lat, lng, hint=None, window=1200):
        """Return (distance along the line in metres, distance off the line in metres)."""
        x, y = self._xy(lat, lng)
        best = (1e18, 0.0)
        for i in range(len(self.xy) - 1):
            if hint is not None and self._far(self.cum[i], self.cum[i + 1], hint, window):
                continue
            (x1, y1), (x2, y2) = self.xy[i], self.xy[i + 1]
            dx, dy = x2 - x1, y2 - y1
            seg2 = dx * dx + dy * dy
            t = 0.0 if seg2 == 0 else max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / seg2))
            d = math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
            if d < best[0]:
                best = (d, self.cum[i] + t * math.sqrt(seg2))
        if hint is not None and best[0] > 400: # lost the bus -> search the whole line
            return self.snap(lat, lng, None)
        return best[1], best[0]

    def point_at(self, s):
        """Return (lat, lng) at distance s along the line."""
        if self.circular:
            s %= self.length
        s = max(0.0, min(self.length, s))
        i = min(bisect_right(self.cum, s) - 1, len(self.xy) - 2)
        seg = self.cum[i + 1] - self.cum[i]
        t = 0.0 if seg == 0 else (s - self.cum[i]) / seg
        x = self.xy[i][0] + t * (self.xy[i + 1][0] - self.xy[i][0])
        y = self.xy[i][1] + t * (self.xy[i + 1][1] - self.xy[i][1])
        return y / R_LAT, x / (R_LNG * self.k)
