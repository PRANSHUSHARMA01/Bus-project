import sys
import json
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent / "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from db import db
from auth_router import create_access_token

def seed():
    email = "pooja.sharma@pranshusharma.tech"
    user = db.get_or_create_user(email, full_name="Pooja Sharma")
    uid = user["id"]

    db.update_profile(uid, {
        "full_name": "Pooja Sharma",
        "phone": "+91 98111 22334",
        "language": "en",
        "home_stop_id": "7572 (Kashmere Gate ISBT)",
        "work_stop_id": "1002 (Connaught Place Radial)"
    })

    # Saved Places
    # Clean up existing for clean screenshot
    conn = db.get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM saved_places WHERE user_id = ?", (uid,))
    cur.execute("DELETE FROM emergency_contacts WHERE user_id = ?", (uid,))
    cur.execute("DELETE FROM trips WHERE user_id = ?", (uid,))
    conn.commit()
    conn.close()

    db.add_saved_place(uid, label="Campus Central Library", stop_id="7908")
    db.add_saved_place(uid, label="South Ex Market", stop_id="7552")

    # Emergency Contacts
    db.add_emergency_contact(uid, name="Anita Sharma (Mother)", phone="+91 98765 43210", relationship="Family")
    db.add_emergency_contact(uid, name="Rohit Sharma (Brother)", phone="+91 98111 22334", relationship="Family")

    # Trips
    t1 = db.start_trip(uid, bus_id=1, route_id="102", board_stop_id="Kashmere Gate ISBT", source="live")
    db.end_trip(t1["id"], user_id=uid, alight_stop_id="Connaught Place Radial", distance_km=8.4)

    t2 = db.start_trip(uid, bus_id=4, route_id="427", board_stop_id="Lajpat Nagar Ring Road", source="live")
    # leave t2 active!

    token = create_access_token(user)
    updated_user = db.get_or_create_profile(uid, email, "Pooja Sharma")

    result = {
        "user": updated_user,
        "token": token
    }
    print(json.dumps(result))

if __name__ == "__main__":
    seed()
