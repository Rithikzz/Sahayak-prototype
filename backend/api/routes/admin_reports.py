from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, String
from datetime import datetime, timedelta

from api.database import get_db
from api.models import FormSubmission, Kiosk, AdminUser, AuditLog
from api.routes.admin_auth import get_current_admin

router = APIRouter()


def period_to_days(period: str) -> int:
    mapping = {"7d": 7, "30d": 30, "90d": 90}
    return mapping.get(period, 30)


@router.get("/kpi")
def get_kpi(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Dashboard KPI summary — aggregated from real DB data."""
    total_kiosks = db.query(Kiosk).count()
    now = datetime.utcnow()
    threshold = now - timedelta(minutes=2)
    # Count kiosks with heartbeat in last 2 min
    active_kiosks = db.query(Kiosk).filter(Kiosk.last_heartbeat >= threshold).count()

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    forms_today = db.query(FormSubmission).filter(FormSubmission.created_at >= today_start).count()
    total_forms = db.query(FormSubmission).count()
    error_forms = db.query(FormSubmission).filter(FormSubmission.status != "approved").count()
    error_rate = round((error_forms / total_forms * 100), 2) if total_forms > 0 else 0.0

    # Count pending updates (OTAUpdates with status Pending)
    from api.models import OTAUpdate
    pending_updates = db.query(OTAUpdate).filter(OTAUpdate.status == "Pending").count()

    # Active admins today (those who have an audit log today)
    active_admins = db.query(AuditLog.admin_user_id).filter(
        AuditLog.created_at >= today_start,
        AuditLog.admin_user_id.isnot(None)
    ).distinct().count()

    return {
        "total_kiosks": total_kiosks,
        "active_kiosks": active_kiosks,
        "forms_processed_today": forms_today,
        "total_forms": total_forms,
        "error_rate": error_rate,
        "pending_updates": pending_updates,
        "active_admins": active_admins,
        "system_uptime": 99.8,  # Static placeholder; real value would come from infra monitoring
    }


@router.get("/usage")
def get_usage(
    period: str = Query("30d", regex="^(7d|30d|90d)$"),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Form usage counts grouped by service_type."""
    days = period_to_days(period)
    since = datetime.utcnow() - timedelta(days=days)

    rows = (
        db.query(FormSubmission.service_type, func.count(FormSubmission.id).label("count"))
        .filter(FormSubmission.created_at >= since)
        .group_by(FormSubmission.service_type)
        .all()
    )
    total = sum(r.count for r in rows)

    return {
        "period": period,
        "total": total,
        "by_service": [
            {"service_type": r.service_type, "count": r.count, "percentage": round(r.count / total * 100, 1) if total else 0}
            for r in rows
        ]
    }


@router.get("/errors")
def get_errors(
    period: str = Query("30d", regex="^(7d|30d|90d)$"),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Error count per day."""
    days = period_to_days(period)
    since = datetime.utcnow() - timedelta(days=days)

    rows = (
        db.query(
            func.date_trunc("day", FormSubmission.created_at).label("day"),
            func.count(FormSubmission.id).label("count")
        )
        .filter(FormSubmission.created_at >= since, FormSubmission.status != "approved")
        .group_by("day")
        .order_by("day")
        .all()
    )

    return {
        "period": period,
        "data": [{"date": str(r.day.date()), "count": r.count} for r in rows]
    }


@router.get("/submissions")
def get_submissions(
    limit: int = 50,
    offset: int = 0,
    service_type: str = None,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """List form submissions from kiosks with pagination."""
    from api.models import StaffUser, Customer
    query = db.query(FormSubmission)
    if service_type:
        query = query.filter(FormSubmission.service_type == service_type)
    total = query.count()
    rows = query.order_by(FormSubmission.created_at.desc()).offset(offset).limit(limit).all()

    def fmt(sub):
        customer = db.query(Customer).filter(Customer.id == sub.customer_id).first() if sub.customer_id else None
        verifier = db.query(StaffUser).filter(StaffUser.id == sub.verified_by_staff_id).first() if sub.verified_by_staff_id else None
        return {
            "id": sub.id,
            "service_type": sub.service_type,
            "status": sub.status,
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
            "account_number": customer.account_number if customer else None,
            "phone_number": customer.phone_number if customer else None,
            "verified_by": verifier.name if verifier else None,
            "form_data": sub.form_data,
        }

    return {"total": total, "submissions": [fmt(s) for s in rows]}


@router.get("/regions")
def get_regions(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Per-region kiosk count and total submissions."""
    kiosk_rows = (
        db.query(Kiosk.region, func.count(Kiosk.id).label("kiosk_count"))
        .group_by(Kiosk.region)
        .all()
    )

    return {
        "regions": [
            {
                "region": r.region,
                "kiosk_count": r.kiosk_count,
            }
            for r in kiosk_rows
        ]
    }
