from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from api.database import get_db
from api.models import OTAUpdate, Kiosk, AdminUser, AuditLog
from api.routes.admin_auth import get_current_admin

router = APIRouter()


def update_to_dict(u: OTAUpdate) -> dict:
    return {
        "id": u.id,
        "update_name": u.update_name,
        "type": u.update_type,
        "version": u.version,
        "target_region": u.target_region,
        "target_kiosks": u.target_kiosks or [],
        "status": u.status,
        "progress": u.progress,
        "successful_kiosks": u.successful_kiosks,
        "failed_kiosks": u.failed_kiosks,
        "deployed_date": u.deployed_date.isoformat() if u.deployed_date else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


# ── Schemas ─────────────────────────────────────────────────────────────────

class CreateUpdateRequest(BaseModel):
    update_name: str
    update_type: str = "firmware"
    version: str
    target_region: Optional[str] = None
    target_kiosks: Optional[List[str]] = []


class CancelUpdateRequest(BaseModel):
    reason: Optional[str] = None


# ── Admin Routes ──────────────────────────────────────────────────────────────

@router.get("")
def list_updates(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    updates = db.query(OTAUpdate).order_by(OTAUpdate.created_at.desc()).all()
    return [update_to_dict(u) for u in updates]


@router.post("")
def create_update(
    request: Request,
    body: CreateUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    update = OTAUpdate(
        update_name=body.update_name,
        update_type=body.update_type,
        version=body.version,
        target_region=body.target_region,
        target_kiosks=body.target_kiosks or [],
        status="Pending",
        progress=0,
        created_by=current_admin.id,
        deployed_date=datetime.utcnow()
    )
    db.add(update)
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Create OTA Update",
        details=f"Created update '{body.update_name}' v{body.version}",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    db.refresh(update)
    return update_to_dict(update)


@router.get("/{update_id}")
def get_update(
    update_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    update = db.query(OTAUpdate).filter(OTAUpdate.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")
    return update_to_dict(update)


@router.patch("/{update_id}/cancel")
def cancel_update(
    update_id: int,
    request: Request,
    body: CancelUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    update = db.query(OTAUpdate).filter(OTAUpdate.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")
    if update.status in ("Completed", "Cancelled"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel an update with status '{update.status}'")

    update.status = "Cancelled"
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Cancel OTA Update",
        details=f"Cancelled update '{update.update_name}': {body.reason or 'No reason given'}",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    return update_to_dict(update)


# ── Kiosk Device Route (no admin auth) ──────────────────────────────────────

kiosk_update_router = APIRouter()


@kiosk_update_router.get("/pending-update")
def check_pending_update(device_id: str, db: Session = Depends(get_db)):
    """Called by kiosk device on startup to check if a newer version is available."""
    kiosk = db.query(Kiosk).filter(Kiosk.device_id == device_id).first()
    if not kiosk:
        return {"has_update": False}

    # Find the latest non-cancelled, non-completed Pending update targeting this kiosk
    from packaging.version import Version, InvalidVersion

    updates = db.query(OTAUpdate).filter(OTAUpdate.status == "Pending").all()
    applicable = []
    for u in updates:
        region_match = (u.target_region is None) or (u.target_region == kiosk.region) or (u.target_region == "All Regions")
        device_match = (not u.target_kiosks) or (kiosk.device_id in u.target_kiosks)
        if region_match and device_match:
            applicable.append(u)

    if not applicable:
        return {"has_update": False}

    # Return the most recent by version
    def parse_ver(v):
        try:
            from packaging.version import Version
            return Version(v)
        except Exception:
            return None

    current_ver = parse_ver(kiosk.installed_version)
    newer = [u for u in applicable if current_ver is None or (parse_ver(u.version) and parse_ver(u.version) > current_ver)]

    if not newer:
        return {"has_update": False}

    best = max(newer, key=lambda u: parse_ver(u.version) or parse_ver("0"))
    return {
        "has_update": True,
        "update_id": best.id,
        "update_name": best.update_name,
        "version": best.version,
        "type": best.update_type,
    }
