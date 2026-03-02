from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os

from api.database import get_db
from api.models import AdminUser, AuditLog

router = APIRouter()

ADMIN_SECRET_KEY = os.getenv("ADMIN_JWT_SECRET", "admin_supersecret_sahayak")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


# ── Helpers ────────────────────────────────────────────────────────────────────

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def create_admin_token(admin_id: int) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": str(admin_id), "exp": expire, "type": "admin"}, ADMIN_SECRET_KEY, algorithm=ALGORITHM)

def decode_admin_token(token: str) -> int:
    try:
        payload = jwt.decode(token, ADMIN_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "admin":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_admin(request: Request, db: Session = Depends(get_db)) -> AdminUser:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    token = auth_header.split(" ", 1)[1]
    admin_id = decode_admin_token(token)
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id, AdminUser.status == "Active").first()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin account not found or inactive")
    return admin


# ── Schemas ────────────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=AdminLoginResponse)
def admin_login(request: Request, body: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == body.email).first()
    if not admin or not verify_password(body.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if admin.status != "Active":
        raise HTTPException(status_code=403, detail="Account is inactive")

    # Update last login
    admin.last_login = datetime.utcnow()
    db.add(AuditLog(
        admin_user_id=admin.id,
        action="Admin Login",
        details=f"{admin.email} logged in",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()

    token = create_admin_token(admin.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "role": admin.role,
            "region": admin.region,
            "permissions": admin.permissions,
            "avatar": "".join(w[0].upper() for w in admin.name.split()[:2])
        }
    }


@router.get("/me")
def get_me(admin: AdminUser = Depends(get_current_admin)):
    return {
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "role": admin.role,
        "region": admin.region,
        "permissions": admin.permissions,
        "status": admin.status,
        "last_login": admin.last_login.isoformat() if admin.last_login else None,
        "avatar": "".join(w[0].upper() for w in admin.name.split()[:2])
    }


@router.post("/logout")
def admin_logout(request: Request, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    db.add(AuditLog(
        admin_user_id=admin.id,
        action="Admin Logout",
        details=f"{admin.email} logged out",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    return {"message": "Logged out successfully"}
