"""
Playwright Visual Verification for Phase C:
- User Profile & Preferences
- Transit Places & Custom Saved Places
- Women's Transit Support / Emergency Contacts
- Activity / Ride History
"""

import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

backend_dir = str(Path(__file__).resolve().parent.parent / "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from db import db
from auth_router import create_access_token

os.makedirs("screenshots", exist_ok=True)

def run():
    # 1. Create a demo test user in DB with preferences and contacts
    email = "phase_c_rider@pranshusharma.tech"
    user = db.get_or_create_user(email, full_name="Pooja Sharma")
    user_id = user["id"]

    # Seed profile preferences
    db.update_profile(user_id, {
        "phone": "+91 98111 22334",
        "home_stop_id": "7572 (Kashmere Gate)",
        "work_stop_id": "1002 (Connaught Place)",
        "language": "en"
    })

    # Seed custom saved place
    db.add_saved_place(user_id, label="Campus Library", stop_id="7908")

    # Seed emergency contact
    db.add_emergency_contact(user_id, name="Anita Sharma", phone="+91 98765 43210", relationship="Family")

    # Seed a live and completed trip
    db.start_trip(user_id=user_id, bus_id=1, route_id="102", board_stop_id="7572", source="live")
    old_trip = db.start_trip(user_id=user_id, bus_id=4, route_id="427", board_stop_id="1002", source="live")
    db.end_trip(old_trip["id"], user_id=user_id, alight_stop_id="7908", distance_km=9.2)

    # Generate access token
    token = create_access_token(user)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 430, "height": 932}, # Modern mobile iPhone/Pixel viewport
            device_scale_factor=2
        )

        page = context.new_page()

        # Set auth token in localStorage before navigating
        page.goto("http://127.0.0.1:8000/account")
        page.evaluate(f"""() => {{
            localStorage.setItem('smart_bus_token', '{token}');
            localStorage.setItem('smart_bus_user', JSON.stringify({json_dumps(user)}));
        }}""")

        # Navigate to Account page
        page.goto("http://127.0.0.1:8000/account")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Capture Profile & Emergency Contacts
        page.screenshot(path="screenshots/phase_c_profile_screen.png", full_page=True)
        print("[VISUAL] Captured screenshots/phase_c_profile_screen.png")

        # Navigate to Activity / Trips page
        page.goto("http://127.0.0.1:8000/activity")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Capture Activity / Trips
        page.screenshot(path="screenshots/phase_c_activity_trips.png", full_page=True)
        print("[VISUAL] Captured screenshots/phase_c_activity_trips.png")

        browser.close()

def json_dumps(obj):
    import json
    return json.dumps(obj)

if __name__ == "__main__":
    run()
