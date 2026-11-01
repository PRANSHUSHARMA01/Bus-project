import hashlib
import sys
from db import db
from auth_router import SERVER_PEPPER

if len(sys.argv) < 2:
    sys.exit(1)

email = sys.argv[1].strip().lower()
email_h = hashlib.sha256(f"{email}:{SERVER_PEPPER}".encode()).hexdigest()
conn = db.get_conn()
cur = conn.cursor()
cur.execute("SELECT * FROM otp_codes WHERE email_hash = ? ORDER BY created_at DESC LIMIT 1", (email_h,))
row = cur.fetchone()
conn.close()

if not row:
    sys.exit(1)

code_hash = dict(row)["code_hash"]
for i in range(1000000):
    candidate = f"{i:06d}"
    if hashlib.sha256(f"{candidate}:{SERVER_PEPPER}".encode()).hexdigest() == code_hash:
        print(candidate)
        sys.exit(0)

sys.exit(1)
