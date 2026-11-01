"""
Smart Public Bus Tracking & Fleet Management System
Pure-Python JWT Authentication & Role-Based Access Control
Zero binary dependencies (100% resilient on Windows with Python 3.14)
"""

import hmac
import hashlib
import base64
import json
import time
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

JWT_SECRET = "delhi_transit_smart_secret_key_2026_hackathon_qubits"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_SECONDS = 86400 * 7  # 7 days

security_bearer = HTTPBearer(auto_error=False)

# ==============================================================================
# DEMO USER SEED STORE
# ==============================================================================

# Simple PBKDF2 hash helper
def hash_password(password: str, salt: str = "delhi_salt_2026") -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()

# Pre-seeded users:
# admin@demo.in / Admin@123
# conductor@demo.in / Conductor@123
# passenger@demo.in / Passenger@123
DEMO_USERS = {
    "admin@demo.in": {
        "email": "admin@demo.in",
        "name": "Admin Controller",
        "role": "admin",
        "password_hash": hash_password("Admin@123")
    },
    "conductor@demo.in": {
        "email": "conductor@demo.in",
        "name": "Conductor Rajesh",
        "role": "conductor",
        "password_hash": hash_password("Conductor@123")
    },
    "passenger@demo.in": {
        "email": "passenger@demo.in",
        "name": "Passenger Amit",
        "role": "passenger",
        "password_hash": hash_password("Passenger@123")
    }
}

# ==============================================================================
# BASE64URL & JWT SERIALIZATION (PURE PYTHON)
# ==============================================================================

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def b64url_decode(s: str) -> bytes:
    padding = "=" * ((4 - len(s) % 4) % 4)
    return base64.urlsafe_b64decode(s + padding)

def create_access_token(payload: Dict[str, Any]) -> str:
    header = {"typ": "JWT", "alg": "HS256"}
    header_json = json.dumps(header, separators=(",", ":")).encode("utf-8")
    
    body = {
        **payload,
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS,
        "iat": int(time.time())
    }
    body_json = json.dumps(body, separators=(",", ":")).encode("utf-8")
    
    unsigned_token = f"{b64url_encode(header_json)}.{b64url_encode(body_json)}"
    signature = hmac.new(JWT_SECRET.encode("utf-8"), unsigned_token.encode("utf-8"), hashlib.sha256).digest()
    
    return f"{unsigned_token}.{b64url_encode(signature)}"

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        
        header_b64, body_b64, signature_b64 = parts
        unsigned_token = f"{header_b64}.{body_b64}"
        
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), unsigned_token.encode("utf-8"), hashlib.sha256).digest()
        provided_sig = b64url_decode(signature_b64)
        
        if not hmac.compare_digest(expected_sig, provided_sig):
            return None
        
        payload_bytes = b64url_decode(body_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
        
        # Expiry check
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None

# ==============================================================================
# FASTAPI DEPENDENCIES
# ==============================================================================

def get_current_user_optional(creds: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Optional[Dict[str, Any]]:
    if not creds:
        return None
    token = creds.credentials
    return verify_access_token(token)

def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = verify_access_token(creds.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)):
        user_role = user.get("role", "passenger")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {allowed_roles}"
            )
        return user
    return role_checker
