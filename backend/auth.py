"""
Authentication & Authorization Module for Smart Bus Tracking
Handles Supabase JWT Verification, Role-Based Access Control (RBAC), and session profiles.
"""

import os
import time
import json
import urllib.request
from typing import Any, Dict, Optional
import jwt
from fastapi import Depends, HTTPException, Header, status
from pydantic import BaseModel
from db import db

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://mock-supabase.supabase.co")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "super-secret-jwt-token-key-for-development-32chars")
DEV_AUTH_BYPASS = os.environ.get("DEV_AUTH_BYPASS", "true").lower() in ("true", "1", "yes")

# JWKS Cache (1 hour TTL)
_JWKS_CACHE: Dict[str, Any] = {"keys": [], "expires_at": 0}

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "passenger"
    language: str = "en"
    avatar_url: Optional[str] = None
    home_stop_id: Optional[str] = None
    work_stop_id: Optional[str] = None

def get_supabase_jwks() -> list:
    global _JWKS_CACHE
    now = time.time()
    if _JWKS_CACHE["keys"] and now < _JWKS_CACHE["expires_at"]:
        return _JWKS_CACHE["keys"]

    jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    try:
        req = urllib.request.Request(jwks_url, headers={"User-Agent": "FastAPI-Auth"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            keys = data.get("keys", [])
            _JWKS_CACHE = {"keys": keys, "expires_at": now + 3600}
            return keys
    except Exception:
        return _JWKS_CACHE.get("keys", [])

def verify_token(token: str) -> Dict[str, Any]:
    """
    Decodes and verifies a JWT token.
    Supports:
    1. HS256 signature with SUPABASE_JWT_SECRET
    2. RS256 with Supabase JWKS
    3. Dev mock tokens for testing/offline: 'dev-token:<user_id>:<role>' or 'Bearer test-token'
    """
    if DEV_AUTH_BYPASS and token.startswith("dev-user-"):
        parts = token.split("-")
        uid = parts[2] if len(parts) > 2 else "dev-user-123"
        role = parts[3] if len(parts) > 3 else "passenger"
        return {
            "sub": uid,
            "email": f"{uid}@example.com",
            "user_metadata": {"full_name": uid.replace("_", " ").title()},
            "role": role,
            "exp": time.time() + 86400,
            "aud": "authenticated",
        }

    # Attempt decoding without verification first to check algorithm
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token structure"
        )

    alg = unverified_header.get("alg", "HS256")

    # 1. HS256 verification (Default for Supabase JWTs)
    if alg == "HS256":
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False, "verify_exp": True}
            )
            # Verify audience if present
            aud = payload.get("aud")
            if aud and aud not in ("authenticated", "smart-bus-tracking"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token audience: {aud}"
                )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token signature: {str(e)}"
            )

    # 2. RS256 verification via Supabase JWKS
    elif alg == "RS256":
        jwks = get_supabase_jwks()
        kid = unverified_header.get("kid")
        key_data = next((k for k in jwks if k.get("kid") == kid), None)
        if not key_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Public key not found for token kid"
            )
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key_data))
        try:
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False, "verify_exp": True}
            )
            aud = payload.get("aud")
            if aud and aud not in ("authenticated", "smart-bus-tracking"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token audience"
                )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Unsupported token algorithm: {alg}"
    )

def current_user(authorization: Optional[str] = Header(None)) -> UserProfile:
    """FastAPI dependency to verify JWT and return the user profile from DB."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with Bearer"
        )

    token = authorization[7:].strip()
    payload = verify_token(token)

    user_id = payload.get("sub") or payload.get("id")
    email = payload.get("email") or f"{user_id}@example.com"
    meta = payload.get("user_metadata", {})
    full_name = meta.get("full_name") or meta.get("name") or email.split("@")[0]
    avatar_url = meta.get("avatar_url")

    # Fetch or auto-create database profile
    db_profile = db.get_or_create_profile(user_id, email, full_name, avatar_url)

    # Check if role is overridden in token claims or DB
    token_role = payload.get("role")
    effective_role = db_profile.get("role", "passenger")
    if token_role in ("conductor", "admin") and effective_role == "passenger":
        # Allow token to promote during tests/dev
        effective_role = token_role

    return UserProfile(
        id=db_profile["id"],
        email=db_profile["email"],
        full_name=db_profile["full_name"],
        role=effective_role,
        language=db_profile.get("language", "en"),
        avatar_url=db_profile.get("avatar_url"),
        home_stop_id=db_profile.get("home_stop_id"),
        work_stop_id=db_profile.get("work_stop_id"),
    )

def require_role(required_role: str):
    """Dependency factory checking that user has required role (e.g. 'conductor' or 'admin')."""
    def _role_checker(user: UserProfile = Depends(current_user)):
        # Admin has access to conductor and admin
        if required_role == "conductor" and user.role in ("conductor", "admin"):
            return user
        if user.role == required_role:
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: {required_role} role required, but user has {user.role}"
        )
    return _role_checker
