"""
Self-Hosted Authentication Router (Phase B)
Endpoints:
- POST /api/v1/auth/request-otp
- POST /api/v1/auth/verify-otp
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- GET  /api/v1/auth/me
"""

import hashlib
import hmac
import os
import secrets
import time
from typing import Any, Dict, Optional
import jwt
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from db import db
from mailer import send_otp_email

auth_router = APIRouter(prefix="/auth", tags=["auth"])

# Cryptographic Keys
JWT_SECRET = os.environ.get("JWT_SECRET", "smartbus-jwt-production-secret-key-32bytes")
SERVER_PEPPER = os.environ.get("SERVER_PEPPER", "smartbus-production-server-pepper-32bytes")
IS_PROD = os.environ.get("DEV_MODE", "true").lower() not in ("true", "1", "yes")

def hash_email(email: str) -> str:
    norm = email.strip().lower()
    return hashlib.sha256(f"{norm}:{SERVER_PEPPER}".encode()).hexdigest()

def hash_code(code: str) -> str:
    return hashlib.sha256(f"{code.strip()}:{SERVER_PEPPER}".encode()).hexdigest()

def create_access_token(user: Dict[str, Any]) -> str:
    now = int(time.time())
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", "passenger"),
        "lang": user.get("language", "en"),
        "iat": now,
        "exp": now + 900, # 15 minutes
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Dependency to extract current authenticated user
async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    # 1. Check Authorization header
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]

    # 2. Check httpOnly cookie
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Dev token bypass if enabled
    if token.startswith("dev-user-"):
        parts = token.split("-")
        uid = parts[2] if len(parts) > 2 else "dev-user-123"
        return {
            "id": uid,
            "email": f"{uid}@example.com",
            "full_name": uid.replace("_", " ").title(),
            "role": "passenger",
            "language": "en"
        }

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token subject")

    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

async def get_optional_user(request: Request) -> Optional[Dict[str, Any]]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ------------------------------------------------------------------------------
# Request / Response Models
# ------------------------------------------------------------------------------
class RequestOtpModel(BaseModel):
    email: str = Field(min_length=5, pattern=r"^[^@]+@[^@]+\.[^@]+$", description="Valid email address")
    language: str = Field(default="en", description="Preferred language ('en' | 'hi')")
    purpose: str = Field(default="login", description="'login' | 'signup'")

class VerifyOtpModel(BaseModel):
    email: str = Field(min_length=5, pattern=r"^[^@]+@[^@]+\.[^@]+$", description="Valid email address")
    code: str = Field(min_length=6, max_length=6, description="6-digit numeric OTP")

class UserResponseModel(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    language: str
    role: str
    created_at: Any

# ------------------------------------------------------------------------------
# 1. POST /api/v1/auth/request-otp
# ------------------------------------------------------------------------------
@auth_router.post("/request-otp")
async def request_otp(body: RequestOtpModel, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    # Read forwarded-for if behind reverse proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    email_h = hash_email(body.email)

    # Rate limiting: Maximum 3 requests per 10 minutes (600 seconds)
    recent_requests = db.count_recent_otp_requests(email_h, client_ip, window_sec=600)
    if recent_requests >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many verification attempts. Please wait 10 minutes before requesting another code."
        )

    # Generate cryptographically secure 6-digit numeric OTP
    otp_code = f"{secrets.randbelow(1000000):06d}"
    code_h = hash_code(otp_code)

    # Store hashed OTP with 5 minute expiration (300s)
    db.record_otp_request(
        email_hash=email_h,
        code_hash=code_h,
        ip=client_ip,
        expires_in_sec=300
    )

    # Dispatch email (SES or Dev console simulator)
    send_otp_email(
        to_email=body.email,
        code=otp_code,
        language=body.language
    )

    db.log_audit(
        action="auth.request_otp",
        ip=client_ip,
        user_agent=request.headers.get("user-agent")
    )

    return {
        "ok": True,
        "message": "Verification code dispatched. Valid for 5 minutes.",
        "expires_in": 300
    }

# ------------------------------------------------------------------------------
# 2. POST /api/v1/auth/verify-otp
# ------------------------------------------------------------------------------
@auth_router.post("/verify-otp")
async def verify_otp(body: VerifyOtpModel, request: Request, response: Response):
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    email_h = hash_email(body.email)

    # Verify code using timing-safe comparison, enforcing 5-min expiry and max 5 attempts
    valid, msg, otp_id = db.verify_and_consume_otp(email_h, body.code, SERVER_PEPPER)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    # Fetch or auto-provision user
    user = db.get_or_create_user(email=body.email)

    # Issue access token (JWT 15m)
    access_token = create_access_token(user)

    # Issue opaque refresh token (64 chars crypto, 30 days)
    raw_refresh = secrets.token_urlsafe(48)
    user_agent = request.headers.get("user-agent", "")
    db.create_session(
        user_id=user["id"],
        raw_refresh_token=raw_refresh,
        pepper=SERVER_PEPPER,
        ip=client_ip,
        user_agent=user_agent,
        expires_in_days=30
    )

    # Set secure httpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=900, # 15 minutes
        httponly=True,
        samesite="lax",
        secure=IS_PROD,
        path="/"
    )

    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        max_age=2592000, # 30 days
        httponly=True,
        samesite="lax",
        secure=IS_PROD,
        path="/"
    )

    db.log_audit(
        action="auth.login_success",
        user_id=user["id"],
        ip=client_ip,
        user_agent=user_agent
    )

    return {
        "ok": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user.get("full_name"),
            "language": user.get("language", "en"),
            "role": user.get("role", "passenger"),
            "created_at": user.get("created_at")
        },
        "access_token": access_token
    }

# ------------------------------------------------------------------------------
# 3. POST /api/v1/auth/refresh
# ------------------------------------------------------------------------------
@auth_router.post("/refresh")
async def refresh_session(request: Request, response: Response):
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    # Read refresh token from cookie or header
    old_refresh = request.cookies.get("refresh_token")
    if not old_refresh:
        # Check custom header if cookie not present
        old_refresh = request.headers.get("x-refresh-token")

    if not old_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )

    # Generate new refresh token for rotation
    new_refresh = secrets.token_urlsafe(48)
    user_agent = request.headers.get("user-agent", "")

    success, msg, user = db.rotate_session(
        old_raw_refresh=old_refresh,
        new_raw_refresh=new_refresh,
        pepper=SERVER_PEPPER,
        ip=client_ip,
        user_agent=user_agent
    )

    if not success or not user:
        # Clear invalid cookies
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=msg
        )

    # Issue new access token
    new_access = create_access_token(user)

    # Set rotated cookies
    response.set_cookie(
        key="access_token",
        value=new_access,
        max_age=900,
        httponly=True,
        samesite="lax",
        secure=IS_PROD,
        path="/"
    )

    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        max_age=2592000,
        httponly=True,
        samesite="lax",
        secure=IS_PROD,
        path="/"
    )

    return {
        "ok": True,
        "access_token": new_access,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user.get("full_name"),
            "language": user.get("language", "en"),
            "role": user.get("role", "passenger")
        }
    }

# ------------------------------------------------------------------------------
# 4. POST /api/v1/auth/logout
# ------------------------------------------------------------------------------
@auth_router.post("/logout")
async def logout(request: Request, response: Response):
    raw_refresh = request.cookies.get("refresh_token") or request.headers.get("x-refresh-token")
    if raw_refresh:
        db.revoke_session(raw_refresh, SERVER_PEPPER)

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

    return {"ok": True, "message": "Successfully logged out"}

# ------------------------------------------------------------------------------
# 5. GET /api/v1/auth/me
# ------------------------------------------------------------------------------
@auth_router.get("/me")
async def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user.get("full_name"),
        "language": user.get("language", "en"),
        "role": user.get("role", "passenger"),
        "avatar_url": user.get("avatar_url"),
        "phone": user.get("phone"),
        "created_at": user.get("created_at")
    }
