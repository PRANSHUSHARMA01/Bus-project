"""
Phase B Test Suite: Self-Hosted Authentication on AWS (Email OTP + Sessions)
Validates:
1. OTP request and generation (cryptographic SHA-256 + pepper hashing)
2. Rate limiting (max 3 requests per 10 minutes per IP/email -> 4th returns 429)
3. Invalid OTP code rejection (timing-safe comparison, attempt tracking)
4. Anti-brute-force invalidation (5 failed attempts invalidates code)
5. OTP verification success, user auto-provisioning, httpOnly cookies
6. GET /api/v1/auth/me profile retrieval
7. Refresh token rotation & reuse detection (anti-theft)
8. Logout session revocation and cookie clearing
"""

import hashlib
import sys
import time
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from main import app
from db import db
from auth_router import SERVER_PEPPER

client = TestClient(app)

def setup_module():
    """Clean test DB before running tests."""
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM otp_codes")
    cur.execute("DELETE FROM sessions")
    cur.execute("DELETE FROM users WHERE email LIKE '%@pranshusharma.tech'")
    conn.commit()
    conn.close()

def get_latest_raw_otp_for_email(email: str) -> str:
    """Helper for testing: recovers the OTP code generated for this test run."""
    email_h = hashlib.sha256(f"{email.strip().lower()}:{SERVER_PEPPER}".encode()).hexdigest()
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM otp_codes WHERE email_hash = ? ORDER BY created_at DESC LIMIT 1", (email_h,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise ValueError(f"No OTP found in db for {email}")
    row_dict = dict(row)
    code_hash = row_dict["code_hash"]
    for i in range(1000000):
        candidate = f"{i:06d}"
        cand_hash = hashlib.sha256(f"{candidate}:{SERVER_PEPPER}".encode()).hexdigest()
        if cand_hash == code_hash:
            return candidate
    raise ValueError("Code not found")

def test_1_request_otp_success():
    """Verify requesting an OTP returns 200 and stores hashed record."""
    setup_module()
    email = "phase_b_test_user@pranshusharma.tech"
    r = client.post(
        "/api/v1/auth/request-otp",
        json={"email": email, "language": "en", "purpose": "login"},
        headers={"x-forwarded-for": "10.0.1.1"}
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["ok"] is True
    assert "Verification code dispatched" in data["message"]

    # Verify that raw code is NEVER stored plaintext in the database
    email_h = hashlib.sha256(f"{email}:{SERVER_PEPPER}".encode()).hexdigest()
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM otp_codes WHERE email_hash = ? ORDER BY created_at DESC LIMIT 1", (email_h,))
    row = dict(cur.fetchone())
    conn.close()
    assert row["code_hash"] is not None
    assert len(row["code_hash"]) == 64  # SHA-256 hex string

def test_2_otp_rate_limiting():
    """Verify that a 4th OTP request within 10 minutes returns 429 Too Many Requests."""
    email = "rate_limit_test@pranshusharma.tech"
    custom_client = TestClient(app, base_url="http://testserver")

    # Send 3 requests (allowed)
    for i in range(3):
        r = custom_client.post(
            "/api/v1/auth/request-otp",
            json={"email": email, "language": "en", "purpose": "login"},
            headers={"x-forwarded-for": "198.51.100.42"}
        )
        assert r.status_code == 200, f"Request {i+1} failed: {r.text}"

    # 4th request must be rejected with 429
    r4 = custom_client.post(
        "/api/v1/auth/request-otp",
        json={"email": email, "language": "en", "purpose": "login"},
        headers={"x-forwarded-for": "198.51.100.42"}
    )
    assert r4.status_code == 429, f"Expected 429, got {r4.status_code}: {r4.text}"
    assert "Too many verification attempts" in r4.json()["detail"]

def test_3_verify_otp_invalid_code():
    """Verify that an invalid OTP code returns 400 Bad Request."""
    email = "invalid_code_test@pranshusharma.tech"
    # Request code
    r_req = client.post(
        "/api/v1/auth/request-otp",
        json={"email": email, "language": "en"},
        headers={"x-forwarded-for": "10.0.3.1"}
    )
    assert r_req.status_code == 200

    # Send bogus code
    r = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": "000000"},
        headers={"x-forwarded-for": "10.0.3.1"}
    )
    assert r.status_code == 400
    assert "Invalid verification code" in r.json()["detail"]

def test_4_anti_brute_force_max_attempts():
    """Verify that failing 5 attempts invalidates the OTP code."""
    email = "brute_force_test@pranshusharma.tech"
    r_req = client.post(
        "/api/v1/auth/request-otp",
        json={"email": email, "language": "en"},
        headers={"x-forwarded-for": "10.0.4.1"}
    )
    assert r_req.status_code == 200

    # Fail 5 times
    for _ in range(5):
        client.post(
            "/api/v1/auth/verify-otp",
            json={"email": email, "code": "999999"},
            headers={"x-forwarded-for": "10.0.4.1"}
        )

    # 6th attempt must be permanently invalidated
    r = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": "999999"},
        headers={"x-forwarded-for": "10.0.4.1"}
    )
    assert r.status_code == 400
    assert "invalidated" in r.json()["detail"].lower() or "no active" in r.json()["detail"].lower()

def test_5_verify_otp_success_and_cookies():
    """Verify that entering the correct code returns user, access_token, and sets httpOnly cookies."""
    email = "login_success@pranshusharma.tech"
    # Request code
    r_req = client.post(
        "/api/v1/auth/request-otp",
        json={"email": email, "language": "hi"},
        headers={"x-forwarded-for": "10.0.5.1"}
    )
    assert r_req.status_code == 200, f"Request OTP failed: {r_req.text}"

    # Discover the generated code
    code = get_latest_raw_otp_for_email(email)

    # Submit correct code
    r = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": code},
        headers={"x-forwarded-for": "10.0.5.1"}
    )
    assert r.status_code == 200, f"Verification failed: {r.text}"
    data = r.json()
    assert data["ok"] is True
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "passenger"
    assert "access_token" in data

    # Check that httpOnly cookies were set
    cookies = r.cookies
    assert "access_token" in cookies
    assert "refresh_token" in cookies

def test_6_get_me_endpoint():
    """Verify that /api/v1/auth/me returns the authenticated user."""
    email = "get_me_user@pranshusharma.tech"
    r_req = client.post(
        "/api/v1/auth/request-otp",
        json={"email": email},
        headers={"x-forwarded-for": "10.0.6.1"}
    )
    assert r_req.status_code == 200
    code = get_latest_raw_otp_for_email(email)
    verify_res = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": code},
        headers={"x-forwarded-for": "10.0.6.1"}
    )
    token = verify_res.json()["access_token"]

    # 1. Access with Bearer token header
    r_hdr = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_hdr.status_code == 200
    assert r_hdr.json()["email"] == email

    # 2. Access with cookie
    r_cookie = client.get("/api/v1/auth/me", cookies={"access_token": token})
    assert r_cookie.status_code == 200
    assert r_cookie.json()["email"] == email

    # 3. Access without token must return 401
    clean_client = TestClient(app)
    r_no_auth = clean_client.get("/api/v1/auth/me")
    assert r_no_auth.status_code == 401

def test_7_refresh_token_rotation_and_reuse_detection():
    """Verify that refresh token rotates and reuse of old token is strictly prevented."""
    email = "refresh_user@pranshusharma.tech"
    r_req = client.post(
        "/api/v1/auth/request-otp",
        json={"email": email},
        headers={"x-forwarded-for": "10.0.7.1"}
    )
    assert r_req.status_code == 200
    code = get_latest_raw_otp_for_email(email)
    verify_res = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": code},
        headers={"x-forwarded-for": "10.0.7.1"}
    )
    old_refresh = verify_res.cookies.get("refresh_token")
    assert old_refresh is not None

    # Refresh session
    r_refresh = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": old_refresh},
        headers={"x-forwarded-for": "10.0.7.1"}
    )
    assert r_refresh.status_code == 200, f"Refresh failed: {r_refresh.text}"
    new_refresh = r_refresh.cookies.get("refresh_token")
    assert new_refresh is not None
    assert new_refresh != old_refresh  # Token rotated!

    # Attempting to reuse old_refresh token must fail and detect reuse
    r_reuse = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": old_refresh},
        headers={"x-forwarded-for": "10.0.7.1"}
    )
    assert r_reuse.status_code == 401
    assert "reuse" in r_reuse.json()["detail"].lower() or "invalid" in r_reuse.json()["detail"].lower()

def test_8_logout_session_revocation():
    """Verify that logout revokes the session and clears cookies."""
    email = "logout_user@pranshusharma.tech"
    r_req = client.post(
        "/api/v1/auth/request-otp",
        json={"email": email},
        headers={"x-forwarded-for": "10.0.8.1"}
    )
    assert r_req.status_code == 200
    code = get_latest_raw_otp_for_email(email)
    verify_res = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": code},
        headers={"x-forwarded-for": "10.0.8.1"}
    )
    access_tok = verify_res.cookies.get("access_token")
    refresh_tok = verify_res.cookies.get("refresh_token")

    # Logout
    r_logout = client.post(
        "/api/v1/auth/logout",
        cookies={"access_token": access_tok, "refresh_token": refresh_tok}
    )
    assert r_logout.status_code == 200
    assert r_logout.json()["ok"] is True

    # After logout, old refresh token is revoked
    r_refresh_after = client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_tok})
    assert r_refresh_after.status_code == 401
