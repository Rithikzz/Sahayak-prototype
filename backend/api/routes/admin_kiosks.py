from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta

from api.database import get_db
from api.models import Kiosk, AdminUser, AuditLog
from api.routes.admin_auth import get_current_admin

router = APIRouter()

OFFLINE_THRESHOLD_MINUTES = 2


def kiosk_to_dict(k: Kiosk) -> dict:
    # Compute live status based on heartbeat
    now = datetime.utcnow()
    if k.last_heartbeat:
        delta = now - k.last_heartbeat.replace(tzinfo=None)
        computed_status = "online" if delta.total_seconds() < OFFLINE_THRESHOLD_MINUTES * 60 else "offline"
    else:
        computed_status = "offline"

    return {
        "id": k.id,
        "device_id": k.device_id,
        "branch_name": k.branch_name,
        "branch_code": k.branch_code,
        "region": k.region,
        "ip_address": k.ip_address,
        "status": computed_status,
        "last_heartbeat": k.last_heartbeat.isoformat() if k.last_heartbeat else None,
        "installed_version": k.installed_version,
        "last_sync": k.last_sync.isoformat() if k.last_sync else None,
        "forms_today": k.forms_today,
        "created_at": k.created_at.isoformat() if k.created_at else None,
    }


# ── Schemas ─────────────────────────────────────────────────────────────────

class CreateKioskRequest(BaseModel):
    device_id: str
    branch_name: str
    branch_code: str
    region: str
    ip_address: Optional[str] = None
    installed_version: str = "1.0.0"


class UpdateKioskRequest(BaseModel):
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    region: Optional[str] = None
    ip_address: Optional[str] = None
    installed_version: Optional[str] = None


class KioskStatusRequest(BaseModel):
    status: str  # online | offline | maintenance


class HeartbeatRequest(BaseModel):
    device_id: str
    installed_version: Optional[str] = None
    forms_today: Optional[int] = None
    ip_address: Optional[str] = None


# ── Admin Routes (protected) ─────────────────────────────────────────────────

@router.get("")
def list_kiosks(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    kiosks = db.query(Kiosk).all()
    return [kiosk_to_dict(k) for k in kiosks]


@router.post("")
def create_kiosk(
    request: Request,
    body: CreateKioskRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    existing = db.query(Kiosk).filter(
        (Kiosk.device_id == body.device_id) | (Kiosk.branch_code == body.branch_code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kiosk with same device_id or branch_code already exists")

    kiosk = Kiosk(
        device_id=body.device_id,
        branch_name=body.branch_name,
        branch_code=body.branch_code,
        region=body.region,
        ip_address=body.ip_address,
        installed_version=body.installed_version,
        status="offline"
    )
    db.add(kiosk)
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Register Kiosk",
        details=f"Registered kiosk {body.branch_code} ({body.device_id})",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    db.refresh(kiosk)
    return kiosk_to_dict(kiosk)


@router.put("/{kiosk_id}")
def update_kiosk(
    kiosk_id: int,
    request: Request,
    body: UpdateKioskRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    kiosk = db.query(Kiosk).filter(Kiosk.id == kiosk_id).first()
    if not kiosk:
        raise HTTPException(status_code=404, detail="Kiosk not found")

    if body.branch_name is not None: kiosk.branch_name = body.branch_name
    if body.branch_code is not None: kiosk.branch_code = body.branch_code
    if body.region is not None: kiosk.region = body.region
    if body.ip_address is not None: kiosk.ip_address = body.ip_address
    if body.installed_version is not None: kiosk.installed_version = body.installed_version

    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Update Kiosk",
        details=f"Updated kiosk {kiosk.branch_code}",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    db.refresh(kiosk)
    return kiosk_to_dict(kiosk)


@router.delete("/{kiosk_id}")
def delete_kiosk(
    kiosk_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    kiosk = db.query(Kiosk).filter(Kiosk.id == kiosk_id).first()
    if not kiosk:
        raise HTTPException(status_code=404, detail="Kiosk not found")
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Delete Kiosk",
        details=f"Deleted kiosk {kiosk.branch_code}",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.delete(kiosk)
    db.commit()
    return {"message": "Kiosk deleted"}


@router.patch("/{kiosk_id}/status")
def set_kiosk_status(
    kiosk_id: int,
    request: Request,
    body: KioskStatusRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    kiosk = db.query(Kiosk).filter(Kiosk.id == kiosk_id).first()
    if not kiosk:
        raise HTTPException(status_code=404, detail="Kiosk not found")
    kiosk.status = body.status
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Update Kiosk Status",
        details=f"Kiosk {kiosk.branch_code} status set to {body.status}",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    return kiosk_to_dict(kiosk)


# ── Kiosk Device Route (no admin auth) ──────────────────────────────────────

kiosk_device_router = APIRouter()


@kiosk_device_router.post("/heartbeat")
def kiosk_heartbeat(body: HeartbeatRequest, db: Session = Depends(get_db)):
    """Called by kiosk devices every 60 seconds to report their liveness.
    Auto-registers the device if it has never checked in before so heartbeats
    never return 404 for legitimate kiosk devices.
    """
    kiosk = db.query(Kiosk).filter(Kiosk.device_id == body.device_id).first()
    if not kiosk:
        # Auto-register on first heartbeat – admin can edit the branch details later
        kiosk = Kiosk(
            device_id=body.device_id,
            branch_name="Auto-registered",
            branch_code=body.device_id[:30],   # use device_id prefix as temporary code
            region="Unknown",
            status="online",
            installed_version=body.installed_version or "1.0.0",
        )
        db.add(kiosk)

    kiosk.last_heartbeat = datetime.utcnow()
    kiosk.last_sync = datetime.utcnow()
    if body.installed_version:
        kiosk.installed_version = body.installed_version
    if body.forms_today is not None:
        kiosk.forms_today = body.forms_today
    if body.ip_address:
        kiosk.ip_address = body.ip_address

    db.commit()
    return {"message": "Heartbeat received", "device_id": body.device_id}
