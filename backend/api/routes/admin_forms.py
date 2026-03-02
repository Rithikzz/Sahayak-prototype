from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Any, Dict
from datetime import datetime
import httpx
import os

from api.database import get_db
from api.models import FormTemplateMetadata, AdminUser, AuditLog
from api.routes.admin_auth import get_current_admin

router = APIRouter()

OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "http://ocr:8003")


def form_to_dict(f: FormTemplateMetadata) -> dict:
    return {
        "id": f.id,
        "name": f.name,
        "category": f.category,
        "version": f.version,
        "status": f.status,
        "description": f.description,
        "languages": f.languages or ["English", "Hindi", "Tamil"],
        "field_definitions": f.field_definitions or [],
        "created_by": f.created_by,
        "created_at": f.created_at.isoformat() if f.created_at else None,
        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
    }


# ── Schemas ─────────────────────────────────────────────────────────────────

class CreateFormRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    languages: Optional[List[str]] = ["English", "Hindi", "Tamil"]
    field_definitions: List[Dict[str, Any]]


class UpdateFormRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    languages: Optional[List[str]] = None
    field_definitions: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
def list_forms(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    forms = db.query(FormTemplateMetadata).all()
    return [form_to_dict(f) for f in forms]


@router.get("/{form_id}")
def get_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    form = db.query(FormTemplateMetadata).filter(FormTemplateMetadata.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form template not found")
    return form_to_dict(form)


@router.post("")
def create_form(
    request: Request,
    body: CreateFormRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    existing = db.query(FormTemplateMetadata).filter(FormTemplateMetadata.category == body.category).first()
    if existing:
        raise HTTPException(status_code=400, detail="A template with this category already exists")

    form = FormTemplateMetadata(
        name=body.name,
        category=body.category,
        description=body.description,
        languages=body.languages,
        field_definitions=body.field_definitions,
        status="Draft",
        version=1,
        created_by=current_admin.id
    )
    db.add(form)
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Create Form Template",
        details=f"Created template '{body.name}' (category: {body.category})",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    db.refresh(form)
    return form_to_dict(form)


@router.put("/{form_id}")
def update_form(
    form_id: int,
    request: Request,
    body: UpdateFormRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    form = db.query(FormTemplateMetadata).filter(FormTemplateMetadata.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form template not found")

    updated_fields = False
    if body.name is not None: form.name = body.name
    if body.description is not None: form.description = body.description
    if body.languages is not None: form.languages = body.languages
    if body.status is not None: form.status = body.status
    if body.field_definitions is not None:
        form.field_definitions = body.field_definitions
        form.version = (form.version or 1) + 1  # bump version when fields change
        updated_fields = True

    form.updated_at = datetime.utcnow()
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Update Form Template",
        details=f"Updated template '{form.name}'" + (" (new version)" if updated_fields else ""),
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    db.refresh(form)
    return form_to_dict(form)


@router.post("/{form_id}/publish")
def publish_form(
    form_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    form = db.query(FormTemplateMetadata).filter(FormTemplateMetadata.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form template not found")
    form.status = "Published"
    form.updated_at = datetime.utcnow()
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Publish Form Template",
        details=f"Published template '{form.name}' v{form.version}",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    return form_to_dict(form)


@router.post("/{form_id}/archive")
def archive_form(
    form_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    form = db.query(FormTemplateMetadata).filter(FormTemplateMetadata.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form template not found")
    form.status = "Archived"
    form.updated_at = datetime.utcnow()
    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="Archive Form Template",
        details=f"Archived template '{form.name}'",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    return form_to_dict(form)


@router.post("/ocr")
async def ocr_upload(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Upload a PDF/image form → OCR service extracts fields → return detected mapping."""
    contents = await file.read()
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{OCR_SERVICE_URL}/extract",
                files={"file": (file.filename, contents, file.content_type)}
            )
            resp.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"OCR service error: {str(e)}")

    db.add(AuditLog(
        admin_user_id=current_admin.id,
        action="OCR Form Upload",
        details=f"Processed file '{file.filename}'",
        ip_address=request.client.host if request.client else None,
        status="Success"
    ))
    db.commit()
    return resp.json()
