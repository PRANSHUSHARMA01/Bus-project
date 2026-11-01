"""
Database Manager for Smart Bus Tracking
Supports Supabase Postgres via psycopg2 or local SQLite for offline dev/tests.
"""

import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "app.db")

def is_postgres() -> bool:
    return bool(DATABASE_URL and PSYCOPG2_AVAILABLE)

class Database:
    def __init__(self):
        os.makedirs(os.path.dirname(LOCAL_DB_PATH), exist_ok=True)
        self.init_db()

    def get_conn(self):
        if is_postgres():
            return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        else:
            conn = sqlite3.connect(LOCAL_DB_PATH)
            conn.row_factory = sqlite3.Row
            return conn

    def init_db(self):
        """Initializes tables for SQLite fallback if not using external Postgres."""
        if is_postgres():
            return  # Run migrations via runner.py

        conn = self.get_conn()
        cur = conn.cursor()
        cur.executescript("""
        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            avatar_url TEXT,
            phone TEXT,
            language TEXT NOT NULL DEFAULT 'en',
            role TEXT NOT NULL DEFAULT 'passenger',
            home_stop_id TEXT,
            work_stop_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS saved_places (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            label TEXT NOT NULL,
            stop_id TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            bus_id INTEGER NOT NULL,
            route_id TEXT NOT NULL,
            board_stop_id TEXT NOT NULL,
            alight_stop_id TEXT,
            boarded_at TEXT NOT NULL,
            alighted_at TEXT,
            distance_km REAL,
            status TEXT NOT NULL DEFAULT 'active',
            source TEXT NOT NULL DEFAULT 'live'
        );

        CREATE TABLE IF NOT EXISTS notifications_subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            bus_id INTEGER NOT NULL,
            stop_id TEXT NOT NULL,
            minutes_before INTEGER NOT NULL DEFAULT 5,
            created_at TEXT NOT NULL,
            fired_at TEXT
        );

        CREATE TABLE IF NOT EXISTS sos_events (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            bus_id INTEGER,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'dispatched',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS recent_searches (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            query TEXT NOT NULL,
            stop_id TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT NOT NULL,
            ip TEXT,
            user_agent TEXT,
            created_at TEXT NOT NULL
        );
        """)
        conn.commit()
        conn.close()

    # -------------------------------------------------------------
    # Profiles
    # -------------------------------------------------------------
    def get_or_create_profile(self, user_id: str, email: str, full_name: Optional[str] = None, avatar_url: Optional[str] = None) -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        name = full_name or email.split("@")[0]

        if is_postgres():
            cur.execute("SELECT * FROM profiles WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                cur.execute("""
                    INSERT INTO profiles (id, full_name, email, avatar_url, language, role, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, 'en', 'passenger', %s, %s) RETURNING *
                """, (user_id, name, email, avatar_url, now, now))
                row = cur.fetchone()
                conn.commit()
            conn.close()
            return dict(row)
        else:
            cur.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
            row = cur.fetchone()
            if not row:
                cur.execute("""
                    INSERT INTO profiles (id, full_name, email, avatar_url, language, role, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 'en', 'passenger', ?, ?)
                """, (user_id, name, email, avatar_url, now, now))
                conn.commit()
                cur.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
                row = cur.fetchone()
            conn.close()
            return dict(row)

    def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        fields = [k for k in updates.keys() if k != "id"]
        if not fields:
            conn.close()
            return None

        if is_postgres():
            set_clause = ", ".join([f"{f} = %s" for f in fields])
            values = [updates[f] for f in fields] + [user_id]
            cur.execute(f"UPDATE profiles SET {set_clause} WHERE id = %s RETURNING *", values)
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return dict(row) if row else None
        else:
            set_clause = ", ".join([f"{f} = ?" for f in fields])
            values = [updates[f] for f in fields] + [user_id]
            cur.execute(f"UPDATE profiles SET {set_clause} WHERE id = ?", values)
            conn.commit()
            cur.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
            row = cur.fetchone()
            conn.close()
            return dict(row) if row else None

    def delete_account_data(self, user_id: str):
        """GDPR compliant user deletion: removes profile and cascade personal data."""
        conn = self.get_conn()
        cur = conn.cursor()
        tables = ["saved_places", "trips", "notifications_subscriptions", "recent_searches", "profiles"]
        if is_postgres():
            for t in tables:
                cur.execute(f"DELETE FROM {t} WHERE user_id = %s" if t != "profiles" else f"DELETE FROM profiles WHERE id = %s", (user_id,))
            conn.commit()
        else:
            for t in tables:
                cur.execute(f"DELETE FROM {t} WHERE user_id = ?" if t != "profiles" else f"DELETE FROM profiles WHERE id = ?", (user_id,))
            conn.commit()
        conn.close()

    # -------------------------------------------------------------
    # Trips
    # -------------------------------------------------------------
    def start_trip(self, user_id: str, bus_id: int, route_id: str, board_stop_id: str, source: str = "live") -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        trip_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        # End any previous active trip for this user
        if is_postgres():
            cur.execute("UPDATE trips SET status = 'completed', alighted_at = %s WHERE user_id = %s AND status = 'active'", (now, user_id))
            cur.execute("""
                INSERT INTO trips (id, user_id, bus_id, route_id, board_stop_id, boarded_at, status, source)
                VALUES (%s, %s, %s, %s, %s, %s, 'active', %s) RETURNING *
            """, (trip_id, user_id, bus_id, route_id, board_stop_id, now, source))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return dict(row)
        else:
            cur.execute("UPDATE trips SET status = 'completed', alighted_at = ? WHERE user_id = ? AND status = 'active'", (now, user_id))
            cur.execute("""
                INSERT INTO trips (id, user_id, bus_id, route_id, board_stop_id, boarded_at, status, source)
                VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
            """, (trip_id, user_id, bus_id, route_id, board_stop_id, now, source))
            conn.commit()
            cur.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
            row = cur.fetchone()
            conn.close()
            return dict(row)

    def end_trip(self, trip_id: str, user_id: str, alight_stop_id: Optional[str] = None, distance_km: Optional[float] = None) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        if is_postgres():
            cur.execute("""
                UPDATE trips SET status = 'completed', alighted_at = %s, alight_stop_id = %s, distance_km = %s
                WHERE id = %s AND user_id = %s RETURNING *
            """, (now, alight_stop_id, distance_km, trip_id, user_id))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return dict(row) if row else None
        else:
            cur.execute("""
                UPDATE trips SET status = 'completed', alighted_at = ?, alight_stop_id = ?, distance_km = ?
                WHERE id = ? AND user_id = ?
            """, (now, alight_stop_id, distance_km, trip_id, user_id))
            conn.commit()
            cur.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
            row = cur.fetchone()
            conn.close()
            return dict(row) if row else None

    def get_user_trips(self, user_id: str, limit: int = 20, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        query = "SELECT * FROM trips WHERE user_id = ? "
        params = [user_id]
        if cursor:
            query += "AND boarded_at < ? "
            params.append(cursor)
        query += "ORDER BY boarded_at DESC LIMIT ?"
        params.append(limit)

        if is_postgres():
            query_pg = query.replace("?", "%s")
            cur.execute(query_pg, params)
            rows = cur.fetchall()
            conn.close()
            return [dict(r) for r in rows]
        else:
            cur.execute(query, params)
            rows = cur.fetchall()
            conn.close()
            return [dict(r) for r in rows]

    # -------------------------------------------------------------
    # Saved Places
    # -------------------------------------------------------------
    def get_saved_places(self, user_id: str) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("SELECT * FROM saved_places WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
            rows = cur.fetchall()
        else:
            cur.execute("SELECT * FROM saved_places WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def add_saved_place(self, user_id: str, label: str, stop_id: str) -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        pid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        if is_postgres():
            cur.execute("""
                INSERT INTO saved_places (id, user_id, label, stop_id, created_at)
                VALUES (%s, %s, %s, %s, %s) RETURNING *
            """, (pid, user_id, label, stop_id, now))
            row = cur.fetchone()
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO saved_places (id, user_id, label, stop_id, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (pid, user_id, label, stop_id, now))
            conn.commit()
            cur.execute("SELECT * FROM saved_places WHERE id = ?", (pid,))
            row = cur.fetchone()
        conn.close()
        return dict(row)

    def delete_saved_place(self, place_id: str, user_id: str) -> bool:
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("DELETE FROM saved_places WHERE id = %s AND user_id = %s", (place_id, user_id))
            deleted = cur.rowcount > 0
            conn.commit()
        else:
            cur.execute("DELETE FROM saved_places WHERE id = ? AND user_id = ?", (place_id, user_id))
            deleted = cur.rowcount > 0
            conn.commit()
        conn.close()
        return deleted

    # -------------------------------------------------------------
    # Subscriptions (Arrival Alerts)
    # -------------------------------------------------------------
    def get_subscriptions(self, user_id: str) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("SELECT * FROM notifications_subscriptions WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
            rows = cur.fetchall()
        else:
            cur.execute("SELECT * FROM notifications_subscriptions WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def add_subscription(self, user_id: str, bus_id: int, stop_id: str, minutes_before: int = 5) -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        sid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        if is_postgres():
            cur.execute("""
                INSERT INTO notifications_subscriptions (id, user_id, bus_id, stop_id, minutes_before, created_at)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
            """, (sid, user_id, bus_id, stop_id, minutes_before, now))
            row = cur.fetchone()
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO notifications_subscriptions (id, user_id, bus_id, stop_id, minutes_before, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (sid, user_id, bus_id, stop_id, minutes_before, now))
            conn.commit()
            cur.execute("SELECT * FROM notifications_subscriptions WHERE id = ?", (sid,))
            row = cur.fetchone()
        conn.close()
        return dict(row)

    def delete_subscription(self, sub_id: str, user_id: str) -> bool:
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("DELETE FROM notifications_subscriptions WHERE id = %s AND user_id = %s", (sub_id, user_id))
            deleted = cur.rowcount > 0
            conn.commit()
        else:
            cur.execute("DELETE FROM notifications_subscriptions WHERE id = ? AND user_id = ?", (sub_id, user_id))
            deleted = cur.rowcount > 0
            conn.commit()
        conn.close()
        return deleted

    # -------------------------------------------------------------
    # SOS Events & Audit Log
    # -------------------------------------------------------------
    def record_sos(self, lat: float, lng: float, user_id: Optional[str] = None, bus_id: Optional[int] = None) -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        sos_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        if is_postgres():
            cur.execute("""
                INSERT INTO sos_events (id, user_id, bus_id, lat, lng, status, created_at)
                VALUES (%s, %s, %s, %s, %s, 'dispatched', %s) RETURNING *
            """, (sos_id, user_id, bus_id, lat, lng, now))
            row = cur.fetchone()
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO sos_events (id, user_id, bus_id, lat, lng, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'dispatched', ?)
            """, (sos_id, user_id, bus_id, lat, lng, now))
            conn.commit()
            cur.execute("SELECT * FROM sos_events WHERE id = ?", (sos_id,))
            row = cur.fetchone()
        conn.close()
        return dict(row)

    def log_audit(self, action: str, user_id: Optional[str] = None, ip: Optional[str] = None, user_agent: Optional[str] = None):
        try:
            conn = self.get_conn()
            cur = conn.cursor()
            aid = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            if is_postgres():
                cur.execute("""
                    INSERT INTO audit_log (id, user_id, action, ip, user_agent, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (aid, user_id, action, ip, user_agent, now))
                conn.commit()
            else:
                cur.execute("""
                    INSERT INTO audit_log (id, user_id, action, ip, user_agent, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (aid, user_id, action, ip, user_agent, now))
                conn.commit()
            conn.close()
        except Exception:
            pass

db = Database()
