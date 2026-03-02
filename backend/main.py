from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import bcrypt

from api.database import engine, Base, get_db
from api.routes import auth, forms, voice
from api.routes import admin_auth, admin_users, admin_kiosks, admin_forms, admin_updates, admin_reports, admin_settings
from api.routes.admin_kiosks import kiosk_device_router
from api.routes.admin_updates import kiosk_update_router
from api import models

# Create all database tables (including new admin tables)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SAHAYAK Kiosk Core API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Kiosk routes ──────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Kiosk Auth"])
app.include_router(forms.router, prefix="/api/forms", tags=["Forms"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])

# ── Kiosk device routes (heartbeat, OTA check) ───────────────────────────────
app.include_router(kiosk_device_router, prefix="/api/kiosk", tags=["Kiosk Device"])
app.include_router(kiosk_update_router, prefix="/api/kiosk", tags=["Kiosk Device"])

# ── Admin routes ──────────────────────────────────────────────────────────────
app.include_router(admin_auth.router, prefix="/api/admin/auth", tags=["Admin Auth"])
app.include_router(admin_users.router, prefix="/api/admin/users", tags=["Admin Users"])
app.include_router(admin_kiosks.router, prefix="/api/admin/kiosks", tags=["Admin Kiosks"])
app.include_router(admin_forms.router, prefix="/api/admin/forms", tags=["Admin Forms"])
app.include_router(admin_updates.router, prefix="/api/admin/updates", tags=["Admin Updates"])
app.include_router(admin_reports.router, prefix="/api/admin/reports", tags=["Admin Reports"])
app.include_router(admin_settings.router, prefix="/api/admin", tags=["Admin Settings"])


@app.get("/health")
def health_check():
    return {"status": "OK", "service": "Core API"}


# ── Startup seed ──────────────────────────────────────────────────────────────

@app.on_event("startup")
def seed_database():
    db = next(get_db())
    try:
        _seed_admin_user(db)
        _seed_form_templates(db)
        _seed_default_settings(db)
    finally:
        db.close()


def _seed_admin_user(db):
    """Create initial super admin if none exist."""
    if db.query(models.AdminUser).count() > 0:
        return
    admin_email = os.getenv("ADMIN_EMAIL", "admin@sahayak.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    hashed = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
    admin = models.AdminUser(
        name="Super Admin",
        email=admin_email,
        hashed_password=hashed,
        role="Super Admin",
        region="All Regions",
        permissions=["All"],
        status="Active"
    )
    db.add(admin)
    db.commit()
    print(f"[SEED] Created super admin: {admin_email}")


def _seed_form_templates(db):
    """Migrate hardcoded form templates to DB as Published templates."""
    if db.query(models.FormTemplateMetadata).count() > 0:
        return
    from api.routes.forms import FORM_TEMPLATES
    display_names = {
        "accountOpeningForms":     "Account Opening",
        "transactionForms":        "Transaction / Cash",
        "loanApplicationForms":    "Loan Application",
        "kycForms":                "KYC Update",
        "serviceRequestForms":     "Service Request",
        "transferRemittanceForms": "Transfer / Remittance",
        "investmentWealthForms":   "Investment & Wealth",
        "enquiryDisputeForms":     "Enquiry & Dispute",
        "closureNominationForms":  "Closure / Nomination",
    }
    for category, data in FORM_TEMPLATES.items():
        db.add(models.FormTemplateMetadata(
            name=display_names.get(category, category),
            category=category,
            version=1,
            status="Published",
            description=f"Default {display_names.get(category, category)} form",
            languages=["English", "Hindi", "Tamil"],
            field_definitions=data.get("fields", []),
        ))
    db.commit()
    print("[SEED] Seeded 9 form templates")


def _seed_default_settings(db):
    """Seed default system settings if not present."""
    if db.query(models.SystemSetting).count() > 0:
        return
    defaults = {
        "offlineMode": True,
        "hybridMode": False,
        "voiceVerification": True,
        "autoSync": True,
        "syncIntervalMinutes": 30,
        "dataRetentionDays": 90,
    }
    for key, value in defaults.items():
        db.add(models.SystemSetting(key=key, value=value))
    db.commit()
    print("[SEED] Seeded default system settings")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
