from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
import json
import bcrypt

from app.crypto.chacha import encrypt as chacha_encrypt, decrypt as chacha_decrypt

from api.database import engine, Base, get_db
from api.routes import auth, forms, voice
from api.routes import admin_auth, admin_users, admin_kiosks, admin_forms, admin_updates, admin_reports, admin_settings, admin_staff
from api.routes import pdf as pdf_routes
from api.routes.admin_kiosks import kiosk_device_router
from api.routes.admin_updates import kiosk_update_router
from api import models

# Create all database tables (including new admin tables)
models.Base.metadata.create_all(bind=engine)

# ── Runtime schema migrations ─────────────────────────────────────────────────
# SQLAlchemy create_all() does NOT add columns to already-existing tables.
# These ALTER statements are idempotent (IF NOT EXISTS) so they are safe to run
# on every start-up without risk of data loss or duplicate errors.
_MIGRATIONS = [
    "ALTER TABLE form_template_metadata ADD COLUMN IF NOT EXISTS original_pdf TEXT",
    "ALTER TABLE form_template_metadata ADD COLUMN IF NOT EXISTS field_coordinates JSONB",
    "ALTER TABLE form_template_metadata ADD COLUMN IF NOT EXISTS pdf_filename VARCHAR(255)",
    "ALTER TABLE form_template_metadata ADD COLUMN IF NOT EXISTS has_pdf BOOLEAN DEFAULT FALSE",
]

with engine.connect() as _conn:
    for _sql in _MIGRATIONS:
        try:
            _conn.execute(text(_sql))
        except Exception as _e:
            print(f"[migration] Warning: {_e}")
    _conn.commit()
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="SAHAYAK Kiosk Core API")

# ── ChaCha20-Poly1305 middleware ──────────────────────────────────────────────
_SKIP_ENCRYPT = {'/health', '/docs', '/openapi.json', '/redoc'}

class ChaChaMiddleware(BaseHTTPMiddleware):
    """
    Transparently decrypt incoming JSON bodies and encrypt outgoing JSON responses
    when the client sends the X-Chacha-Encrypted: 1 header.

    Wire format: {"payload": "<base64(nonce + ciphertext + tag)>"}
    FormData uploads and binary responses are passed through unchanged.
    """

    async def dispatch(self, request: Request, call_next):
        if (
            request.headers.get('X-Chacha-Encrypted') == '1'
            and request.url.path not in _SKIP_ENCRYPT
        ):
            # ── Decrypt request body ──────────────────────────────────────────
            ct = request.headers.get('content-type', '')
            if ct.startswith('application/json'):
                raw = await request.body()
                if raw:
                    try:
                        envelope = json.loads(raw)
                        if 'payload' in envelope:
                            request._body = chacha_decrypt(envelope['payload'])
                    except Exception:
                        return Response(
                            content=json.dumps({"detail": "Request decryption failed"}),
                            status_code=400,
                            media_type='application/json',
                        )

            response = await call_next(request)

            # ── Encrypt response body ─────────────────────────────────────────
            resp_ct = response.headers.get('content-type', '')
            if 'application/json' in resp_ct:
                body = b''
                async for chunk in response.body_iterator:
                    body += chunk
                encrypted = chacha_encrypt(body)
                new_body = json.dumps({'payload': encrypted}).encode()
                return Response(
                    content=new_body,
                    status_code=response.status_code,
                    media_type='application/json',
                )
            return response

        return await call_next(request)

app.add_middleware(ChaChaMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost,http://localhost:80,http://localhost:8080"
)
_allowed_origins = [o.strip() for o in _raw_origins.split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Kiosk routes ──────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Kiosk Auth"])
app.include_router(forms.router, prefix="/api/forms", tags=["Forms"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(pdf_routes.router, prefix="/api/forms", tags=["PDF"])

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
app.include_router(admin_staff.router, prefix="/api/admin/staff", tags=["Admin Staff"])


@app.get("/health")
def health_check():
    return {"status": "OK", "service": "Core API"}


# ── Startup seed ──────────────────────────────────────────────────────────────

@app.on_event("startup")
def seed_database():
    db = next(get_db())
    try:
        _migrate_pdf_data(db)  # RUN FIRST: migrate base64 PDFs to disk-based storage
        _seed_admin_user(db)
        _seed_staff_users(db)
        _seed_form_templates(db)
        _seed_default_settings(db)
        _seed_demo_customer(db)
    finally:
        db.close()


def _migrate_pdf_data(db):
    """
    Migrate old base64-encoded PDFs from original_pdf column to disk-based storage.
    For each template with base64 data in original_pdf but no pdf_filename,
    decode and save to disk, then update pdf_filename.
    """
    from app.pdf.storage import save_pdf
    import base64
    
    templates_to_migrate = db.query(models.FormTemplateMetadata).filter(
        models.FormTemplateMetadata.original_pdf.isnot(None),
        models.FormTemplateMetadata.pdf_filename.is_(None)
    ).all()
    
    migrated_count = 0
    for template in templates_to_migrate:
        try:
            # Check if original_pdf looks like base64 (starts with PDF magic bytes when decoded)
            if template.original_pdf.startswith("JVBERi"):  # base64 for "%PDF"
                pdf_bytes = base64.b64decode(template.original_pdf)
                # Save to disk
                new_filename = save_pdf(template.id, pdf_bytes)
                # Update template to point to new filename
                template.pdf_filename = new_filename
                db.add(template)
                migrated_count += 1
        except Exception as e:
            print(f"[MIGRATE] Warning: Failed to migrate template {template.id}: {e}")
    
    if migrated_count > 0:
        db.commit()
        print(f"[MIGRATE] Migrated {migrated_count} templates from base64 to disk storage")


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


def _seed_staff_users(db):
    """Create default kiosk staff user with PIN 1234 if none exist."""
    if db.query(models.StaffUser).count() > 0:
        return
    pin_hash = bcrypt.hashpw(b"1234", bcrypt.gensalt()).decode()
    staff = models.StaffUser(
        name="Bank Staff",
        pin_hash=pin_hash,
        role="Operator"
    )
    db.add(staff)
    db.commit()
    print("[SEED] Created default staff user: PIN=1234")


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


def _seed_demo_customer(db):
    """Create a demo customer for kiosk testing if not present."""
    DEMO_ACCOUNT = "1234567890123456"
    if db.query(models.Customer).filter(models.Customer.account_number == DEMO_ACCOUNT).first():
        return
    pin_hash = bcrypt.hashpw(b"1234", bcrypt.gensalt()).decode()
    customer = models.Customer(
        account_number=DEMO_ACCOUNT,
        name="Rahul Kumar",
        phone_number="9876543210",
        email="rahul.kumar@example.com",
        date_of_birth="01/01/1990",
        pan_number="ABCPK1234Q",
        aadhaar_number="123456789012",
        address="12 MG Road, Bengaluru, Karnataka 560001",
        pin_hash=pin_hash,
    )
    db.add(customer)
    db.commit()
    print(f"[SEED] Created demo customer: {DEMO_ACCOUNT} PIN=1234")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
