"""
Schema Migration Runner for Smart Bus Tracking
Executes versioned SQL files in backend/migrations against Supabase Postgres,
or initializes the SQLite database schema when running offline/local tests.
"""

import os
import sys
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import db, is_postgres

MIGRATIONS_DIR = os.path.dirname(__file__)

def run_migrations():
    conn = db.get_conn()
    cur = conn.cursor()

    # Ensure schema_migrations table exists
    if is_postgres():
        cur.execute("""
            CREATE TABLE IF NOT EXISTS _schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
            );
        """)
        conn.commit()
    else:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS _schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TEXT NOT NULL
            );
        """)
        conn.commit()

    # Find SQL migration files
    files = sorted([f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql")])
    applied_count = 0

    for file in files:
        if is_postgres():
            cur.execute("SELECT 1 FROM _schema_migrations WHERE version = %s", (file,))
            if cur.fetchone():
                continue
        else:
            cur.execute("SELECT 1 FROM _schema_migrations WHERE version = ?", (file,))
            if cur.fetchone():
                continue

        filepath = os.path.join(MIGRATIONS_DIR, file)
        print(f"Applying migration: {file}...")

        try:
            if is_postgres():
                with open(filepath, "r", encoding="utf-8") as f:
                    sql = f.read()
                cur.execute(sql)
                cur.execute("INSERT INTO _schema_migrations (version) VALUES (%s)", (file,))
                conn.commit()
            else:
                # For SQLite local fallback, invoke database schema initializer
                db.init_db()
                cur.execute(
                    "INSERT INTO _schema_migrations (version, applied_at) VALUES (?, ?)",
                    (file, datetime.now(timezone.utc).isoformat())
                )
                conn.commit()
            applied_count += 1
            print(f"[OK] Successfully applied {file}")
        except Exception as e:
            conn.rollback()
            print(f"[FAIL] Failed applying {file}: {e}")
            conn.close()
            sys.exit(1)

    conn.close()
    print(f"Migrations complete. {applied_count} new migrations applied.")

if __name__ == "__main__":
    run_migrations()
