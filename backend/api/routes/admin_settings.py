from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any, Dict
from datetime import datetime

from api.database import get_db
from api.models import SystemSetting, AuditLog, AdminUser
from api.routes.admin_auth import get_current_admin

router = APIRouter()


@router.get("/settings")
def get_settings(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    rows = db.query(SystemSetting).all()
    return {row.key: row.value for row in rows}


class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, Any]


@router.put("/settings")
def update_settings(
    request: Request,
    body: SettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    for key, value in body.settings.items():
        existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if existing:
            existing.value = value
            existing.updated_by = current_admin.id
            existing.updated_at = datetime.utcnow()
        else:
            db.add(SystemSetting(key=key, value=value, updated_by=current_admin.id))

    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Update System Settings",
        details=f"Updated keys: {', '.join(body.settings.keys())}",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    rows = db.query(SystemSetting).all()
    return {row.key: row.value for row in rows}


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    total = db.query(AuditLog).count()
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    def log_to_dict(log):
        user = None
        if log.admin_user:
            user = log.admin_user.name
        return {
            "id": log.id,
            "timestamp": log.created_at.isoformat() if log.created_at else None,
            "user": user,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "status": log.status,
        }

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "logs": [log_to_dict(l) for l in logs]
    }
