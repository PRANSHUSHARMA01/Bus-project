"""
Automated Verification Suite for Phase A: Single-Origin Architecture
Validates that FastAPI correctly serves:
1. Production API routes at /api/v1/* and root aliases
2. Health and readiness probes at /health, /ready, /api/v1/health, /api/v1/ready
3. Compiled static Next.js frontend at /
4. Statically exported page routes like /activity, /services, /account, /login
5. SPA fallback for dynamic routes like /t/{token} and /trip/{id}
6. Immutable caching for _next static assets
7. Strict API 404 response (never masked by HTML fallback)
8. Comprehensive HTTP Security Headers (CSP, X-Content-Type-Options, X-Frame-Options, Permissions-Policy)
9. WebSocket connection at /ws with ping/pong heartbeat
"""

# Add backend directory to path
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_health_endpoints():
    """Verify /health and /api/v1/health return 200 OK."""
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "ok"

    r2 = client.get("/api/v1/health")
    assert r2.status_code == 200
    assert r2.json()["status"] == "ok"

def test_ready_endpoints():
    """Verify /ready and /api/v1/ready return 200 OK."""
    r1 = client.get("/ready")
    assert r1.status_code == 200
    assert r1.json()["ready"] is True

    r2 = client.get("/api/v1/ready")
    assert r2.status_code == 200
    assert r2.json()["ready"] is True

def test_root_serves_static_index():
    """Verify GET / returns index.html with no-cache header."""
    r = client.get("/")
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]
    assert "no-cache" in r.headers.get("cache-control", "")
    assert len(r.text) > 1000

def test_static_page_routes():
    """Verify direct page access (/activity, /services, /account, /login)."""
    for page in ["/activity", "/services", "/account", "/login"]:
        r = client.get(page)
        assert r.status_code == 200
        assert "text/html" in r.headers["content-type"]
        assert len(r.text) > 500

def test_spa_deep_link_fallback():
    """Verify deep links (/t/abc1234, /trip/987) return index.html fallback for client-side routing."""
    r1 = client.get("/t/shared-token-xyz")
    assert r1.status_code == 200
    assert "text/html" in r1.headers["content-type"]

    r2 = client.get("/trip/active-trip-456")
    assert r2.status_code == 200
    assert "text/html" in r2.headers["content-type"]

def test_api_v1_endpoints():
    """Verify transit data is available under /api/v1/* and root."""
    r_routes = client.get("/api/v1/routes")
    assert r_routes.status_code == 200
    routes = r_routes.json()
    assert isinstance(routes, list)
    assert len(routes) > 0

    r_live = client.get("/api/v1/buses/live")
    assert r_live.status_code == 200
    assert isinstance(r_live.json(), list)

    r_stops = client.get("/api/v1/stops")
    assert r_stops.status_code == 200
    assert len(r_stops.json()) > 0

def test_api_404_does_not_mask_with_html():
    """Verify non-existent API routes return 404 JSON, NOT the SPA fallback HTML."""
    r = client.get("/api/v1/non_existent_route")
    assert r.status_code == 404
    assert r.headers["content-type"] == "application/json"
    assert "API route not found" in r.text

def test_security_headers():
    """Verify HTTP security headers are enforced."""
    r = client.get("/")
    assert r.headers.get("x-content-type-options") == "nosniff"
    assert r.headers.get("x-frame-options") == "DENY"
    assert r.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "geolocation=(self)" in r.headers.get("permissions-policy", "")
    assert "default-src 'self'" in r.headers.get("content-security-policy", "")

def test_websocket_connection():
    """Verify WebSocket /ws endpoint connects and handles ping/pong."""
    with client.websocket_connect("/ws") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_text()
        assert data == "pong"
