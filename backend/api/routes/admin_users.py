from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import bcrypt

from api.database import get_db
from api.models import AdminUser, AuditLog
from api.routes.admin_auth import get_current_admin

router = APIRouter()


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def admin_to_dict(admin: AdminUser) -> dict:
    return {
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "role": admin.role,
        "region": admin.region,
        "permissions": admin.permissions or [],
        "status": admin.status,
        "last_login": admin.last_login.isoformat() if admin.last_login else None,
        "created_at": admin.created_at.isoformat() if admin.created_at else None,
        "avatar": "".join(w[0].upper() for w in admin.name.split()[:2])
    }


# ── Schemas ─────────────────────────────────────────────────────────────────

class CreateAdminUserRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Regional Admin"
    region: str = "All Regions"
    permissions: List[str] = []


class UpdateAdminUserRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    region: Optional[str] = None
    permissions: Optional[List[str]] = None
    status: Optional[str] = None


# ── Routes ──────────────────────────────────────────────────────────────────

@router.get("")
def list_admin_users(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    users = db.query(AdminUser).all()
    return [admin_to_dict(u) for u in users]


@router.post("")
def create_admin_user(
    request: Request,
    body: CreateAdminUserRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    existing = db.query(AdminUser).filter(AdminUser.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_admin = AdminUser(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
        region=body.region,
        permissions=body.permissions,
        status="Active"
    )
    db.add(new_admin)
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Create Admin User",
        details=f"Created user {body.email} ({body.role})",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    db.refresh(new_admin)
    return admin_to_dict(new_admin)


@router.put("/{user_id}")
def update_admin_user(
    user_id: int,
    request: Request,
    body: UpdateAdminUserRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    admin = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="User not found")

    if body.name is not None: admin.name = body.name
    if body.role is not None: admin.role = body.role
    if body.region is not None: admin.region = body.region
    if body.permissions is not None: admin.permissions = body.permissions
    if body.status is not None: admin.status = body.status

    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Update Admin User",
        details=f"Updated user {admin.email}",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    db.refresh(admin)
    return admin_to_dict(admin)


@router.delete("/{user_id}")
def delete_admin_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    admin = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="User not found")
    if admin.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    admin.status = "Inactive"
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Deactivate Admin User",
        details=f"Deactivated user {admin.email}",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    return {"message": "User deactivated"}
