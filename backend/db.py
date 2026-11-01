"""
Database Manager for Smart Bus Tracking
Supports Supabase Postgres via psycopg2 or local SQLite for offline dev/tests.
"""

import hashlib
import hmac
import os
import secrets
import sqlite3
import time
import uuid
from datetime import datetime, timezone, timedelta
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

        CREATE TABLE IF NOT EXISTS emergency_contacts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            relationship TEXT DEFAULT 'Family',
            is_verified INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS conductor_duties (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            bus_id INTEGER NOT NULL,
            route_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            started_at TEXT NOT NULL,
            ended_at TEXT
        );

        CREATE TABLE IF NOT EXISTS conductor_tickets (
            id TEXT PRIMARY KEY,
            duty_id TEXT,
            bus_id INTEGER NOT NULL,
            conductor_id TEXT,
            stop_id TEXT,
            fare INTEGER NOT NULL,
            payment_method TEXT NOT NULL DEFAULT 'cash',
            issued_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sos_events (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            bus_id INTEGER,
            route_id TEXT,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            accuracy_m REAL,
            reference_code TEXT,
            note TEXT,
            status TEXT NOT NULL DEFAULT 'dispatched',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS trip_shares (
            id TEXT PRIMARY KEY,
            trip_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_consents (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            telemetry_tracking INTEGER NOT NULL DEFAULT 1,
            emergency_sos_dispatch INTEGER NOT NULL DEFAULT 1,
            essential_cookies INTEGER NOT NULL DEFAULT 1,
            ip_hash TEXT,
            user_agent TEXT,
            consented_at TEXT NOT NULL
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

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            email_verified_at TEXT,
            full_name TEXT,
            avatar_url TEXT,
            phone TEXT,
            language TEXT NOT NULL DEFAULT 'en',
            role TEXT NOT NULL DEFAULT 'passenger',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS otp_codes (
            id TEXT PRIMARY KEY,
            email_hash TEXT NOT NULL,
            code_hash TEXT NOT NULL,
            expires_at REAL NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            consumed_at REAL,
            ip TEXT,
            created_at REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            refresh_hash TEXT NOT NULL,
            device TEXT,
            ip TEXT,
            user_agent TEXT,
            created_at REAL NOT NULL,
            last_used_at REAL NOT NULL,
            expires_at REAL NOT NULL,
            revoked_at REAL
        );
        """)

        # Safe schema migrations for Phase G
        for col, col_type in [("route_id", "TEXT"), ("accuracy_m", "REAL"), ("reference_code", "TEXT"), ("note", "TEXT")]:
            try:
                cur.execute(f"ALTER TABLE sos_events ADD COLUMN {col} {col_type}")
            except Exception:
                pass

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

        user_fields = [k for k in fields if k in ("full_name", "language", "avatar_url", "phone", "role", "updated_at")]
        if user_fields:
            if is_postgres():
                u_clause = ", ".join([f"{f} = %s" for f in user_fields])
                u_vals = [updates[f] for f in user_fields] + [user_id]
                cur.execute(f"UPDATE users SET {u_clause} WHERE id = %s", u_vals)
            else:
                u_clause = ", ".join([f"{f} = ?" for f in user_fields])
                u_vals = [updates[f] for f in user_fields] + [user_id]
                cur.execute(f"UPDATE users SET {u_clause} WHERE id = ?", u_vals)

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

    def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Returns user profile or None."""
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("SELECT * FROM profiles WHERE id = %s", (user_id,))
            row = cur.fetchone()
        else:
            cur.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
            row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def delete_account_data(self, user_id: str):
        """GDPR compliant user deletion: removes profile and cascade personal data."""
        conn = self.get_conn()
        cur = conn.cursor()
        tables = [
            "saved_places",
            "trips",
            "trip_shares",
            "notifications_subscriptions",
            "emergency_contacts",
            "recent_searches",
            "user_consents",
            "sessions",
            "profiles",
            "users",
        ]
        if is_postgres():
            for t in tables:
                cur.execute(f"DELETE FROM {t} WHERE user_id = %s" if t not in ("profiles", "users") else f"DELETE FROM {t} WHERE id = %s", (user_id,))
            conn.commit()
        else:
            for t in tables:
                cur.execute(f"DELETE FROM {t} WHERE user_id = ?" if t not in ("profiles", "users") else f"DELETE FROM {t} WHERE id = ?", (user_id,))
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

    def create_trip_share(self, trip_id: str, user_id: str, hours: int = 3) -> Dict[str, Any]:
        """Creates or returns an active public share token for a user's trip."""
        conn = self.get_conn()
        cur = conn.cursor()
        now_dt = datetime.now(timezone.utc)
        now = now_dt.isoformat()
        expires_at = (now_dt + timedelta(hours=hours)).isoformat()

        # Check existing valid share token
        if is_postgres():
            cur.execute("""
                SELECT * FROM trip_shares WHERE trip_id = %s AND user_id = %s AND expires_at > %s
                ORDER BY created_at DESC LIMIT 1
            """, (trip_id, user_id, now))
        else:
            cur.execute("""
                SELECT * FROM trip_shares WHERE trip_id = ? AND user_id = ? AND expires_at > ?
                ORDER BY created_at DESC LIMIT 1
            """, (trip_id, user_id, now))
        existing = cur.fetchone()
        if existing:
            conn.close()
            return dict(existing)

        # Generate new 8-char URL-safe token
        share_id = str(uuid.uuid4())
        token = secrets.token_urlsafe(8)

        if is_postgres():
            cur.execute("""
                INSERT INTO trip_shares (id, trip_id, user_id, token, expires_at, created_at)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
            """, (share_id, trip_id, user_id, token, expires_at, now))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return dict(row)
        else:
            cur.execute("""
                INSERT INTO trip_shares (id, trip_id, user_id, token, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (share_id, trip_id, user_id, token, expires_at, now))
            conn.commit()
            cur.execute("SELECT * FROM trip_shares WHERE id = ?", (share_id,))
            row = cur.fetchone()
            conn.close()
            return dict(row)

    def get_shared_trip(self, token: str) -> Optional[Dict[str, Any]]:
        """Resolves an anonymous public trip share token without requiring auth."""
        conn = self.get_conn()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        query = """
            SELECT ts.token, ts.expires_at, ts.created_at as shared_at,
                   t.id as trip_id, t.user_id, t.bus_id, t.route_id,
                   t.board_stop_id, t.alight_stop_id, t.boarded_at, t.status, t.source,
                   coalesce(p.full_name, u.full_name, 'Passenger') as passenger_name
            FROM trip_shares ts
            JOIN trips t ON ts.trip_id = t.id
            LEFT JOIN profiles p ON t.user_id = p.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE ts.token = ? AND ts.expires_at > ?
        """
        if is_postgres():
            query_pg = query.replace("?", "%s")
            cur.execute(query_pg, (token, now))
        else:
            cur.execute(query, (token, now))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

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
    # Emergency Contacts (Safety & Women's Transit Support)
    # -------------------------------------------------------------
    def get_emergency_contacts(self, user_id: str) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("SELECT * FROM emergency_contacts WHERE user_id = %s ORDER BY created_at ASC", (user_id,))
            rows = cur.fetchall()
        else:
            cur.execute("SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY created_at ASC", (user_id,))
            rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def add_emergency_contact(self, user_id: str, name: str, phone: str, relationship: Optional[str] = "Family") -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        cid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        if is_postgres():
            cur.execute("""
                INSERT INTO emergency_contacts (id, user_id, name, phone, relationship, is_verified, created_at)
                VALUES (%s, %s, %s, %s, %s, 0, %s) RETURNING *
            """, (cid, user_id, name, phone, relationship or "Family", now))
            row = cur.fetchone()
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO emergency_contacts (id, user_id, name, phone, relationship, is_verified, created_at)
                VALUES (?, ?, ?, ?, ?, 0, ?)
            """, (cid, user_id, name, phone, relationship or "Family", now))
            conn.commit()
            cur.execute("SELECT * FROM emergency_contacts WHERE id = ?", (cid,))
            row = cur.fetchone()
        conn.close()
        return dict(row)

    def delete_emergency_contact(self, contact_id: str, user_id: str) -> bool:
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("DELETE FROM emergency_contacts WHERE id = %s AND user_id = %s", (contact_id, user_id))
            deleted = cur.rowcount > 0
            conn.commit()
        else:
            cur.execute("DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?", (contact_id, user_id))
            deleted = cur.rowcount > 0
            conn.commit()
        conn.close()
        return deleted

    # -------------------------------------------------------------
    # SOS Events & Audit Log
    # -------------------------------------------------------------
    def record_sos(
        self,
        lat: float,
        lng: float,
        user_id: Optional[str] = None,
        bus_id: Optional[int] = None,
        route_id: Optional[str] = None,
        accuracy_m: Optional[float] = None,
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        sos_id = str(uuid.uuid4())
        ref_code = f"SOS-112-{uuid.uuid4().hex[:6].upper()}"
        now = datetime.now(timezone.utc).isoformat()
        if is_postgres():
            cur.execute("""
                INSERT INTO sos_events (id, user_id, bus_id, route_id, lat, lng, accuracy_m, reference_code, note, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'dispatched', %s) RETURNING *
            """, (sos_id, user_id, bus_id, route_id, lat, lng, accuracy_m, ref_code, note, now))
            row = cur.fetchone()
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO sos_events (id, user_id, bus_id, route_id, lat, lng, accuracy_m, reference_code, note, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'dispatched', ?)
            """, (sos_id, user_id, bus_id, route_id, lat, lng, accuracy_m, ref_code, note, now))
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

    # -------------------------------------------------------------
    # Self-Hosted Auth (Phase B): Users, OTP Codes, & Sessions
    # -------------------------------------------------------------
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        norm_email = email.strip().lower()
        if is_postgres():
            cur.execute("SELECT * FROM users WHERE lower(email) = %s AND deleted_at IS NULL", (norm_email,))
            row = cur.fetchone()
        else:
            cur.execute("SELECT * FROM users WHERE lower(email) = ? AND deleted_at IS NULL", (norm_email,))
            row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("SELECT * FROM users WHERE id = %s AND deleted_at IS NULL", (user_id,))
            row = cur.fetchone()
        else:
            cur.execute("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL", (user_id,))
            row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_or_create_user(self, email: str, language: str = "en", full_name: Optional[str] = None) -> Dict[str, Any]:
        existing = self.get_user_by_email(email)
        if existing:
            return existing

        conn = self.get_conn()
        cur = conn.cursor()
        user_id = f"usr_{uuid.uuid4().hex[:16]}"
        now = datetime.now(timezone.utc).isoformat()
        norm_email = email.strip().lower()
        name = full_name or norm_email.split("@")[0].replace(".", " ").title()

        if is_postgres():
            cur.execute("""
                INSERT INTO users (id, email, full_name, language, role, created_at, updated_at)
                VALUES (%s, %s, %s, %s, 'passenger', %s, %s)
                RETURNING *
            """, (user_id, norm_email, name, language, now, now))
            row = cur.fetchone()
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO users (id, email, full_name, language, role, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'passenger', ?, ?)
            """, (user_id, norm_email, name, language, now, now))
            conn.commit()
            cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cur.fetchone()

        # Also sync to legacy profiles table for seamless backward compatibility
        try:
            self.get_or_create_profile(user_id=user_id, email=norm_email, full_name=name)
        except Exception:
            pass

        conn.close()
        return dict(row)

    def count_recent_otp_requests(self, email_hash: str, ip: str, window_sec: int = 600) -> int:
        """Count OTP requests for the same IP or email within the rolling rate-limit window."""
        conn = self.get_conn()
        cur = conn.cursor()
        since = time.time() - window_sec
        if is_postgres():
            cur.execute("""
                SELECT COUNT(*) as cnt FROM otp_codes
                WHERE (email_hash = %s OR ip = %s) AND created_at > %s
            """, (email_hash, ip, since))
            row = cur.fetchone()
            count = row["cnt"] if isinstance(row, dict) else row[0]
        else:
            cur.execute("""
                SELECT COUNT(*) as cnt FROM otp_codes
                WHERE (email_hash = ? OR ip = ?) AND created_at > ?
            """, (email_hash, ip, since))
            row = cur.fetchone()
            count = row["cnt"] if isinstance(row, dict) or hasattr(row, "__getitem__") else row[0]
        conn.close()
        return int(count)

    def record_otp_request(self, email_hash: str, code_hash: str, ip: str, expires_in_sec: int = 300) -> str:
        conn = self.get_conn()
        cur = conn.cursor()
        otp_id = str(uuid.uuid4())
        now = time.time()
        expires_at = now + expires_in_sec

        if is_postgres():
            cur.execute("""
                INSERT INTO otp_codes (id, email_hash, code_hash, expires_at, attempts, ip, created_at)
                VALUES (%s, %s, %s, %s, 0, %s, %s)
            """, (otp_id, email_hash, code_hash, expires_at, ip, now))
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO otp_codes (id, email_hash, code_hash, expires_at, attempts, ip, created_at)
                VALUES (?, ?, ?, ?, 0, ?, ?)
            """, (otp_id, email_hash, code_hash, expires_at, ip, now))
            conn.commit()
        conn.close()
        return otp_id

    def verify_and_consume_otp(self, email_hash: str, raw_code: str, pepper: str) -> tuple[bool, str, Optional[str]]:
        """
        Verify code with timing-safe comparison, enforcing:
        1. Code expiration (5 min)
        2. Max 5 failed attempts per OTP record
        3. Single-use invalidation
        """
        conn = self.get_conn()
        cur = conn.cursor()
        now = time.time()

        # Find latest unconsumed OTP for this email hash
        if is_postgres():
            cur.execute("""
                SELECT * FROM otp_codes
                WHERE email_hash = %s AND consumed_at IS NULL
                ORDER BY created_at DESC LIMIT 1
            """, (email_hash,))
            row = cur.fetchone()
        else:
            cur.execute("""
                SELECT * FROM otp_codes
                WHERE email_hash = ? AND consumed_at IS NULL
                ORDER BY created_at DESC LIMIT 1
            """, (email_hash,))
            row = cur.fetchone()

        if not row:
            conn.close()
            return False, "No active verification code found. Please request a new one.", None

        rec = dict(row)
        otp_id = rec["id"]

        # Check expiration
        if now > rec["expires_at"]:
            conn.close()
            return False, "Verification code has expired. Please request a new code.", None

        # Check max attempts
        if rec["attempts"] >= 5:
            # Invalidate record
            if is_postgres():
                cur.execute("UPDATE otp_codes SET consumed_at = %s WHERE id = %s", (now, otp_id))
                conn.commit()
            else:
                cur.execute("UPDATE otp_codes SET consumed_at = ? WHERE id = ?", (now, otp_id))
                conn.commit()
            conn.close()
            return False, "Too many failed attempts. This code is invalidated. Please request a new one.", None

        # Timing-safe comparison of SHA-256 hash
        target_hash = hashlib.sha256(f"{raw_code.strip()}:{pepper}".encode()).hexdigest()
        is_match = hmac.compare_digest(target_hash, rec["code_hash"])

        if is_match:
            # Mark consumed
            if is_postgres():
                cur.execute("UPDATE otp_codes SET consumed_at = %s WHERE id = %s", (now, otp_id))
                conn.commit()
            else:
                cur.execute("UPDATE otp_codes SET consumed_at = ? WHERE id = ?", (now, otp_id))
                conn.commit()
            conn.close()
            return True, "Verification successful.", otp_id
        else:
            # Increment attempts
            new_attempts = rec["attempts"] + 1
            if is_postgres():
                cur.execute("UPDATE otp_codes SET attempts = %s WHERE id = %s", (new_attempts, otp_id))
                conn.commit()
            else:
                cur.execute("UPDATE otp_codes SET attempts = ? WHERE id = ?", (new_attempts, otp_id))
                conn.commit()
            conn.close()
            remaining = max(0, 5 - new_attempts)
            return False, f"Invalid verification code. {remaining} attempt(s) remaining.", None

    def create_session(self, user_id: str, raw_refresh_token: str, pepper: str, ip: str, user_agent: str, expires_in_days: int = 30) -> str:
        conn = self.get_conn()
        cur = conn.cursor()
        session_id = str(uuid.uuid4())
        refresh_hash = hashlib.sha256(f"{raw_refresh_token}:{pepper}".encode()).hexdigest()
        now = time.time()
        expires_at = now + (expires_in_days * 86400)
        device = (user_agent or "Browser")[:128]

        if is_postgres():
            cur.execute("""
                INSERT INTO sessions (id, user_id, refresh_hash, device, ip, user_agent, created_at, last_used_at, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (session_id, user_id, refresh_hash, device, ip, user_agent, now, now, expires_at))
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO sessions (id, user_id, refresh_hash, device, ip, user_agent, created_at, last_used_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (session_id, user_id, refresh_hash, device, ip, user_agent, now, now, expires_at))
            conn.commit()
        conn.close()
        return session_id

    def rotate_session(self, old_raw_refresh: str, new_raw_refresh: str, pepper: str, ip: str, user_agent: str) -> tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Rotates refresh token for the active session. Detects reuse attacks:
        if token was already revoked, immediately terminates all sessions for security.
        """
        conn = self.get_conn()
        cur = conn.cursor()
        old_hash = hashlib.sha256(f"{old_raw_refresh}:{pepper}".encode()).hexdigest()
        now = time.time()

        if is_postgres():
            cur.execute("SELECT * FROM sessions WHERE refresh_hash = %s", (old_hash,))
            row = cur.fetchone()
        else:
            cur.execute("SELECT * FROM sessions WHERE refresh_hash = ?", (old_hash,))
            row = cur.fetchone()

        if not row:
            conn.close()
            return False, "Invalid session refresh token.", None

        session = dict(row)

        # Detect reuse of revoked token (possible token theft)
        if session.get("revoked_at") is not None:
            # Revoke all sessions for this user for security
            uid = session["user_id"]
            if is_postgres():
                cur.execute("UPDATE sessions SET revoked_at = %s WHERE user_id = %s", (now, uid))
                conn.commit()
            else:
                cur.execute("UPDATE sessions SET revoked_at = ? WHERE user_id = ?", (now, uid))
                conn.commit()
            conn.close()
            return False, "Token reuse detected. All active sessions have been invalidated for security.", None

        # Check expiration
        if now > session["expires_at"]:
            conn.close()
            return False, "Session expired. Please log in again.", None

        # Revoke old session and issue new session
        new_hash = hashlib.sha256(f"{new_raw_refresh}:{pepper}".encode()).hexdigest()
        new_session_id = str(uuid.uuid4())
        device = (user_agent or "Browser")[:128]
        new_expires = now + (30 * 86400)

        if is_postgres():
            cur.execute("UPDATE sessions SET revoked_at = %s WHERE id = %s", (now, session["id"]))
            cur.execute("""
                INSERT INTO sessions (id, user_id, refresh_hash, device, ip, user_agent, created_at, last_used_at, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (new_session_id, session["user_id"], new_hash, device, ip, user_agent, now, now, new_expires))
            conn.commit()
        else:
            cur.execute("UPDATE sessions SET revoked_at = ? WHERE id = ?", (now, session["id"]))
            cur.execute("""
                INSERT INTO sessions (id, user_id, refresh_hash, device, ip, user_agent, created_at, last_used_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_session_id, session["user_id"], new_hash, device, ip, user_agent, now, now, new_expires))
            conn.commit()

        user = self.get_user_by_id(session["user_id"])
        conn.close()
        return True, "Session refreshed.", user

    def revoke_session(self, raw_refresh: str, pepper: str) -> bool:
        conn = self.get_conn()
        cur = conn.cursor()
        r_hash = hashlib.sha256(f"{raw_refresh}:{pepper}".encode()).hexdigest()
        now = time.time()
        if is_postgres():
            cur.execute("UPDATE sessions SET revoked_at = %s WHERE refresh_hash = %s", (now, r_hash))
            conn.commit()
        else:
            cur.execute("UPDATE sessions SET revoked_at = ? WHERE refresh_hash = ?", (now, r_hash))
            conn.commit()
        conn.close()
        return True

    # -------------------------------------------------------------
    # Phase D: Conductor & Driver Duty Management
    # -------------------------------------------------------------
    def start_conductor_duty(self, user_id: str, bus_id: int, route_id: str) -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        # End any prior active duty for this conductor
        if is_postgres():
            cur.execute("UPDATE conductor_duties SET status = 'ended', ended_at = %s WHERE user_id = %s AND status = 'active'", (now, user_id))
        else:
            cur.execute("UPDATE conductor_duties SET status = 'ended', ended_at = ? WHERE user_id = ? AND status = 'active'", (now, user_id))

        duty_id = str(uuid.uuid4())
        if is_postgres():
            cur.execute("""
                INSERT INTO conductor_duties (id, user_id, bus_id, route_id, status, started_at)
                VALUES (%s, %s, %s, %s, 'active', %s) RETURNING *
            """, (duty_id, user_id, bus_id, route_id, now))
            row = cur.fetchone()
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO conductor_duties (id, user_id, bus_id, route_id, status, started_at)
                VALUES (?, ?, ?, ?, 'active', ?)
            """, (duty_id, user_id, bus_id, route_id, now))
            conn.commit()
            cur.execute("SELECT * FROM conductor_duties WHERE id = ?", (duty_id,))
            row = cur.fetchone()
        conn.close()
        return dict(row)

    def end_conductor_duty(self, duty_id: str, user_id: str) -> bool:
        conn = self.get_conn()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        if is_postgres():
            cur.execute("UPDATE conductor_duties SET status = 'ended', ended_at = %s WHERE id = %s AND user_id = %s", (now, duty_id, user_id))
            updated = cur.rowcount > 0
            conn.commit()
        else:
            cur.execute("UPDATE conductor_duties SET status = 'ended', ended_at = ? WHERE id = ? AND user_id = ?", (now, duty_id, user_id))
            updated = cur.rowcount > 0
            conn.commit()
        conn.close()
        return updated

    def get_active_conductor_duty(self, user_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("SELECT * FROM conductor_duties WHERE user_id = %s AND status = 'active' ORDER BY started_at DESC LIMIT 1", (user_id,))
            row = cur.fetchone()
        else:
            cur.execute("SELECT * FROM conductor_duties WHERE user_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1", (user_id,))
            row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def record_conductor_ticket(
        self,
        bus_id: int,
        fare: int,
        payment_method: str = "cash",
        conductor_id: Optional[str] = None,
        stop_id: Optional[str] = None,
        duty_id: Optional[str] = None
    ) -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        tid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        if is_postgres():
            cur.execute("""
                INSERT INTO conductor_tickets (id, duty_id, bus_id, conductor_id, stop_id, fare, payment_method, issued_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
            """, (tid, duty_id, bus_id, conductor_id, stop_id, fare, payment_method, now))
            row = cur.fetchone()
            conn.commit()
        else:
            cur.execute("""
                INSERT INTO conductor_tickets (id, duty_id, bus_id, conductor_id, stop_id, fare, payment_method, issued_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (tid, duty_id, bus_id, conductor_id, stop_id, fare, payment_method, now))
            conn.commit()
            cur.execute("SELECT * FROM conductor_tickets WHERE id = ?", (tid,))
            row = cur.fetchone()
        conn.close()
        return dict(row)

    def get_conductor_shift_stats(self, conductor_id: Optional[str] = None, bus_id: Optional[int] = None) -> Dict[str, Any]:
        conn = self.get_conn()
        cur = conn.cursor()
        query = "SELECT COUNT(*) as total_tickets, COALESCE(SUM(fare), 0) as total_collection, " \
                "COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN fare ELSE 0 END), 0) as cash_collection, " \
                "COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN fare ELSE 0 END), 0) as upi_collection " \
                "FROM conductor_tickets WHERE 1=1"
        params = []
        if conductor_id:
            query += " AND conductor_id = ?" if not is_postgres() else " AND conductor_id = %s"
            params.append(conductor_id)
        if bus_id:
            query += " AND bus_id = ?" if not is_postgres() else " AND bus_id = %s"
            params.append(bus_id)

        cur.execute(query, tuple(params))
        row = cur.fetchone()
        conn.close()
        if row:
            d = dict(row)
            return {
                "total_tickets": d.get("total_tickets", 0),
                "total_collection": d.get("total_collection", 0),
                "cash_collection": d.get("cash_collection", 0),
                "upi_collection": d.get("upi_collection", 0),
            }
        return {"total_tickets": 0, "total_collection": 0, "cash_collection": 0, "upi_collection": 0}

    # -------------------------------------------------------------
    # Legal, DPDP Act 2023 & GDPR Compliance Methods
    # -------------------------------------------------------------
    def record_user_consent(
        self,
        user_id: Optional[str],
        telemetry_tracking: bool = True,
        emergency_sos_dispatch: bool = True,
        essential_cookies: bool = True,
        ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Records DPDP Act 2023 / GDPR compliant consent log."""
        conn = self.get_conn()
        cur = conn.cursor()
        cid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:16] if ip else None

        if is_postgres():
            cur.execute("""
                INSERT INTO user_consents (id, user_id, telemetry_tracking, emergency_sos_dispatch, essential_cookies, ip_hash, user_agent, consented_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
            """, (cid, user_id, 1 if telemetry_tracking else 0, 1 if emergency_sos_dispatch else 0, 1 if essential_cookies else 0, ip_hash, user_agent, now))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return dict(row)
        else:
            cur.execute("""
                INSERT INTO user_consents (id, user_id, telemetry_tracking, emergency_sos_dispatch, essential_cookies, ip_hash, user_agent, consented_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (cid, user_id, 1 if telemetry_tracking else 0, 1 if emergency_sos_dispatch else 0, 1 if essential_cookies else 0, ip_hash, user_agent, now))
            conn.commit()
            cur.execute("SELECT * FROM user_consents WHERE id = ?", (cid,))
            row = cur.fetchone()
            conn.close()
            return dict(row)

    def get_user_consents(self, user_id: str) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        cur = conn.cursor()
        if is_postgres():
            cur.execute("SELECT * FROM user_consents WHERE user_id = %s ORDER BY consented_at DESC", (user_id,))
        else:
            cur.execute("SELECT * FROM user_consents WHERE user_id = ? ORDER BY consented_at DESC", (user_id,))
        rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_data_export(self, user_id: str) -> Dict[str, Any]:
        """Generates full DPDP Act 2023 Sec 11 & GDPR Art 15/20 data portability archive."""
        profile = self.get_profile(user_id) or {}
        places = self.get_saved_places(user_id)
        contacts = self.get_emergency_contacts(user_id)
        trips = self.get_user_trips(user_id, limit=500)
        subscriptions = self.get_subscriptions(user_id)
        consents = self.get_user_consents(user_id)

        now = datetime.now(timezone.utc).isoformat()
        return {
            "compliance_standard": "India Digital Personal Data Protection Act (DPDP) 2023 & GDPR (EU) 2016/679",
            "data_fiduciary": {
                "organization": "Delhi Smart Public Bus Transit Project",
                "partner": "Government of NCT of Delhi (Open Transit Data)",
                "grievance_officer": "Pranshu Sharma (New Delhi, India)",
                "email": "pranshusharma01@gmail.com",
                "jurisdiction": "National Capital Territory of Delhi, India"
            },
            "exported_at": now,
            "user_id": user_id,
            "profile": profile,
            "saved_places": places,
            "emergency_contacts": contacts,
            "trips": trips,
            "subscriptions": subscriptions,
            "consent_records": consents,
            "retention_policy": {
                "telemetry_gps": "Anonymized, purged after 90 days",
                "transit_tickets": "Retained for 3 years per statutory DTC audit regulations",
                "account_data": "Deleted immediately upon user erasure request"
            }
        }

db = Database()

