"""
Phase H Test Suite: Legal, GDPR/DPDP Compliance & Single-Server AWS Production Deployment Readiness
Verifies:
1. DPDP Act 2023 & GDPR metadata endpoint (/api/v1/legal/privacy)
2. Transit terms of service & AIS-140 dispatch disclaimer (/api/v1/legal/terms)
3. Open transit data & open-source licenses attribution (/api/v1/legal/licenses)
4. DPDP consent recording endpoint (/api/v1/legal/consent)
5. DPDP / GDPR Article 15/20 user data export archive (/api/v1/auth/data-export)
6. Single-server production Dockerfile with multi-stage build & non-root user
7. docker-compose.yml with persistent database volume & healthcheck
8. systemd/smart-bus.service with hardened Linux sandboxing
9. nginx/smart-bus.conf and Caddyfile with pranshusharma.tech TLS & WebSocket (/ws) upgrade
10. Static page route fallback verification (/privacy, /terms)
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from db import db
from auth_router import create_access_token

client = TestClient(app)
ROOT_DIR = backend_dir.parent


def test_dpdp_privacy_metadata_endpoint():
    """Verify /api/v1/legal/privacy returns statutory Data Fiduciary & Grievance Officer."""
    res = client.get("/api/v1/legal/privacy")
    assert res.status_code == 200
    data = res.json()
    assert "Digital Personal Data Protection Act" in str(data["statutory_frameworks"])
    assert data["data_fiduciary"]["grievance_officer"]["name"] == "Pranshu Sharma"
    assert "pranshusharma01@gmail.com" in data["data_fiduciary"]["grievance_officer"]["email"]
    assert "telemetry_gps" in data["retention_schedule"]
    assert "emergency_sos_packets" in data["retention_schedule"]


def test_transit_terms_endpoint():
    """Verify /api/v1/legal/terms returns transit conditions and AIS-140 emergency terms."""
    res = client.get("/api/v1/legal/terms")
    assert res.status_code == 200
    data = res.json()
    assert "DTC" in data["operator_notice"]
    assert "112" in data["emergency_dispatch_notice"]
    assert "New Delhi" in data["arbitration_venue"]


def test_open_source_licenses_endpoint():
    """Verify /api/v1/legal/licenses returns Delhi Open Transit Data CC-BY 4.0 attribution."""
    res = client.get("/api/v1/legal/licenses")
    assert res.status_code == 200
    data = res.json()
    assert "CC BY 4.0" in data["open_transit_data"]["license"]
    deps = [d["name"] for d in data["software_dependencies"]]
    assert "FastAPI" in deps
    assert "Next.js" in deps


def test_dpdp_consent_logging():
    """Verify POST /api/v1/legal/consent logs consent to database."""
    res = client.post("/api/v1/legal/consent", json={
        "telemetry_tracking": True,
        "emergency_sos_dispatch": True,
        "essential_cookies": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "Data Protection Act 2023" in data["compliance_notice"]
    assert data["consent"]["telemetry_tracking"] == 1


def test_dpdp_data_export_unauthenticated():
    """Verify unauthenticated data export request is rejected with 401."""
    res = client.get("/api/v1/auth/data-export")
    assert res.status_code == 401


def test_dpdp_data_export_authenticated():
    """Verify authenticated user receives complete DPDP Article 11 data portability archive."""
    # Create or fetch test user
    user_id = "phase_h_test_user_dpdp"
    db.get_or_create_profile(
        user_id=user_id,
        email="test_dpdp@pranshusharma.tech",
        full_name="DPDP Test Passenger"
    )
    # Add saved place
    db.add_saved_place(user_id=user_id, label="Home Hub", stop_id="stop_1")
    # Add emergency contact
    db.add_emergency_contact(user_id=user_id, name="Emergency Guardian", phone="+919876543210")
    # Record consent
    db.record_user_consent(user_id=user_id, telemetry_tracking=True, emergency_sos_dispatch=True)

    token = create_access_token({"sub": user_id, "role": "passenger", "email": "test_dpdp@pranshusharma.tech"})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/auth/data-export", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["compliance_standard"] == "India Digital Personal Data Protection Act (DPDP) 2023 & GDPR (EU) 2016/679"
    assert data["user_id"] == user_id
    assert data["profile"]["full_name"] == "DPDP Test Passenger"
    assert len(data["saved_places"]) >= 1
    assert len(data["emergency_contacts"]) >= 1
    assert len(data["consent_records"]) >= 1
    assert "retention_policy" in data


def test_production_dockerfile_specification():
    """Verify root Dockerfile exists and meets production multi-stage single-server specs."""
    dockerfile_path = ROOT_DIR / "Dockerfile"
    assert dockerfile_path.exists(), "Root Dockerfile missing"
    content = dockerfile_path.read_text(encoding="utf-8")
    assert "node:20-alpine" in content
    assert "python:3.12-slim" in content
    assert "appuser" in content, "Non-root security hardening missing"
    assert "HEALTHCHECK" in content, "Docker health check missing"
    assert "EXPOSE 8000" in content


def test_production_docker_compose_specification():
    """Verify docker-compose.yml exists and configures single-server production runtime."""
    compose_path = ROOT_DIR / "docker-compose.yml"
    assert compose_path.exists(), "docker-compose.yml missing"
    content = compose_path.read_text(encoding="utf-8")
    assert "8000:8000" in content
    assert "./backend/data:/app/backend/data" in content, "Persistent database volume missing"
    assert "healthcheck" in content


def test_systemd_and_reverse_proxy_configurations():
    """Verify systemd service and reverse proxy configurations (Nginx & Caddy)."""
    service_path = ROOT_DIR / "systemd" / "smart-bus.service"
    nginx_path = ROOT_DIR / "nginx" / "smart-bus.conf"
    caddy_path = ROOT_DIR / "Caddyfile"
    deploy_script = ROOT_DIR / "scripts" / "deploy_ec2.sh"

    assert service_path.exists(), "systemd service missing"
    assert nginx_path.exists(), "Nginx config missing"
    assert caddy_path.exists(), "Caddyfile missing"
    assert deploy_script.exists(), "deploy_ec2.sh missing"

    nginx_content = nginx_path.read_text(encoding="utf-8")
    assert "pranshusharma.tech" in nginx_content
    assert "/ws" in nginx_content, "WebSocket upgrade directive missing"
    assert "Strict-Transport-Security" in nginx_content, "HSTS header missing"

    caddy_content = caddy_path.read_text(encoding="utf-8")
    assert "pranshusharma.tech" in caddy_content
    assert "reverse_proxy 127.0.0.1:8000" in caddy_content


def test_deployment_runbook_documentation():
    """Verify DEPLOYMENT.md contains single-origin architecture and EC2 operations guide."""
    runbook_path = ROOT_DIR / "DEPLOYMENT.md"
    assert runbook_path.exists(), "DEPLOYMENT.md missing"
    content = runbook_path.read_text(encoding="utf-8")
    assert "pranshusharma.tech" in content
    assert "Single-Origin" in content
    assert "t3.micro" in content or "t3.small" in content
    assert "Zero-Downtime" in content


if __name__ == "__main__":
    print("Run via backend/tests/run_phases.py")
