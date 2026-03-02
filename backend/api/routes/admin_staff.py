from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import bcrypt

from api.database import get_db
from api.models import StaffUser, AdminUser, AuditLog
from api.routes.admin_auth import get_current_admin

router = APIRouter()


class CreateStaffRequest(BaseModel):
    name: str
    pin: str   # 4-digit PIN
    role: Optional[str] = "staff"


class ResetPinRequest(BaseModel):
    pin: str


def staff_to_dict(s: StaffUser) -> dict:
    return {
        "id": s.id,
        "name": s.name or "Staff",
        "role": s.role or "staff",
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.get("")
def list_staff(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """List all kiosk staff users (not their PINs)."""
    staff = db.query(StaffUser).all()
    return [staff_to_dict(s) for s in staff]


@router.post("")
def create_staff(
    body: CreateStaffRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Create a new kiosk staff user with a 4-digit PIN."""
    if not body.pin.isdigit() or len(body.pin) != 4:
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits (0-9)")

    pin_hash = bcrypt.hashpw(body.pin.encode(), bcrypt.gensalt()).decode()
    staff = StaffUser(name=body.name, pin_hash=pin_hash, role=body.role)
    db.add(staff)
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Create Staff User",
        details=f"Created kiosk staff '{body.name}' (role: {body.role})",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    db.refresh(staff)
    return staff_to_dict(staff)


@router.put("/{staff_id}/reset-pin")
def reset_pin(
    staff_id: int,
    body: ResetPinRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Reset the PIN for a kiosk staff user."""
    if not body.pin.isdigit() or len(body.pin) != 4:
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits (0-9)")

    staff = db.query(StaffUser).filter(StaffUser.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")

    staff.pin_hash = bcrypt.hashpw(body.pin.encode(), bcrypt.gensalt()).decode()
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Reset Staff PIN",
        details=f"Reset PIN for staff '{staff.name}'",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    return {"message": "PIN reset successfully"}


@router.delete("/{staff_id}")
def delete_staff(
    staff_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Delete a kiosk staff user."""
    staff = db.query(StaffUser).filter(StaffUser.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")

    name = staff.name
    db.delete(staff)
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Delete Staff User",
        details=f"Deleted kiosk staff '{name}'",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    return {"message": "Staff user deleted"}
