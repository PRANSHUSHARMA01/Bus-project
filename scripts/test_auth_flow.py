"""
Test script for Google OAuth endpoint & Email OTP verification with automated username parsing.
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from db import db

client = TestClient(app)

def test_google_auth_start():
    print("\n--- 1. Testing GET /api/v1/auth/google/start ---")
    res = client.get("/api/v1/auth/google/start", follow_redirects=False)
    print(f"Status Code: {res.status_code}")
    print(f"Location Header: {res.headers.get('location')}")
    assert res.status_code == 303, f"Expected 303 redirect, got {res.status_code}"
    print("[PASS] Google OAuth start endpoint successfully redirects!")

def test_email_otp_and_username_flow():
    print("\n--- 2. Testing Email OTP Request & Verification ---")
    test_email = "pranshu.sharma@testtransit.org"
    
    # 1. Request OTP
    req_res = client.post("/api/v1/auth/request-otp", json={
        "email": test_email,
        "language": "en",
        "purpose": "login"
    })
    print(f"Request OTP Status: {req_res.status_code}")
    print(f"Request OTP Body: {req_res.json()}")
    assert req_res.status_code == 200
    assert req_res.json().get("ok") is True

    # 2. Verify with test passkey 123456
    verify_res = client.post("/api/v1/auth/verify-otp", json={
        "email": test_email,
        "code": "123456"
    })
    print(f"Verify OTP Status: {verify_res.status_code}")
    user_data = verify_res.json().get("user", {})
    print(f"User Created: {user_data}")
    
    assert verify_res.status_code == 200
    assert user_data.get("email") == test_email
    # Check that username is parsed from email ID automatically
    expected_name = "Pranshu Sharma"
    assert user_data.get("full_name") == expected_name, f"Expected '{expected_name}', got '{user_data.get('full_name')}'"
    print(f"[PASS] Username correctly parsed as '{user_data.get('full_name')}' from '{test_email}'!")

    token = verify_res.json().get("access_token")
    assert token, "Missing access_token"

    # 3. Test GET /api/v1/auth/me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    print(f"Auth /me Status: {me_res.status_code}")
    print(f"Auth /me Body: {me_res.json()}")
    assert me_res.status_code == 200
    assert me_res.json().get("full_name") == expected_name
    print("[PASS] /me endpoint correctly recognizes authenticated user profile!")

if __name__ == "__main__":
    try:
        test_google_auth_start()
        test_email_otp_and_username_flow()
        print("\n=== ALL AUTHENTICATION TESTS PASSED 100% SUCCESSFULLY ===")
    except Exception as e:
        print(f"\n[FAIL] Test encountered error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
