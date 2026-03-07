from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Any, Dict
from datetime import datetime
import httpx
import os
import base64

from api.database import get_db
from api.models import FormTemplateMetadata, AdminUser, AuditLog
from api.routes.admin_auth import get_current_admin
from app.pdf.storage import save_pdf, save_temp_pdf, load_pdf, delete_pdf, pdf_exists

router = APIRouter()

OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "http://ocr:8003")


def form_to_dict(f: FormTemplateMetadata, *, include_pdf_blob: bool = False) -> dict:
    """Serialize a FormTemplateMetadata row.
    By default the heavy PDF is NOT included — callers get
    `has_pdf` (bool) and `pdf_url` (endpoint path) instead.
    """
    d = {
        "id": f.id,
        "name": f.name,
        "category": f.category,
        "version": f.version,
        "status": f.status,
        "description": f.description,
        "languages": f.languages or ["English", "Hindi", "Tamil"],
        "field_definitions": f.field_definitions or [],
        "has_pdf": bool(f.pdf_filename),
        "pdf_filename": f.pdf_filename or None,
        "field_coordinates": f.field_coordinates or {},
        "created_by": f.created_by,
        "created_at": f.created_at.isoformat() if f.created_at else None,
        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
    }
    if f.id:
        d["pdf_url"] = f"/api/admin/forms/{f.id}/pdf" if f.pdf_filename else None
    return d


# ── Schemas ─────────────────────────────────────────────────────────────────

class CreateFormRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    languages: Optional[List[str]] = ["English", "Hindi", "Tamil"]
    field_definitions: List[Dict[str, Any]]
    original_pdf: Optional[str] = None        # base64 string (stored to disk)
    pdf_filename: Optional[str] = None        # if provided, use this temp file instead of original_pdf
    field_coordinates: Optional[Dict[str, Any]] = None


class UpdateFormRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    languages: Optional[List[str]] = None
    field_definitions: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    original_pdf: Optional[str] = None           # base64-encoded PDF (stored to disk)
    pdf_filename: Optional[str] = None           # temp filename from OCR upload
    field_coordinates: Optional[Dict[str, Any]] = None  # { field_id: {page,x,y,...} }


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


@router.get("/{form_id}/pdf")
def get_form_pdf(
    form_id: int,
    db: Session = Depends(get_db),
):
    """Stream the original PDF file for a template (used by the visual editor & preview)."""
    form = db.query(FormTemplateMetadata).filter(FormTemplateMetadata.id == form_id).first()
    if not form or not form.pdf_filename:
        raise HTTPException(status_code=404, detail="No PDF for this template")
    try:
        pdf_bytes = load_pdf(form.pdf_filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="PDF file missing from storage")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="template_{form_id}.pdf"'},
    )


def _resolve_pdf_filename(body, template_id: int) -> str | None:
    """Resolve the PDF to store: either from temp file (OCR flow) or base64 upload."""
    # Prefer pre-saved temp file from OCR upload
    if body.pdf_filename and pdf_exists(body.pdf_filename):
        # Rename temp file to permanent name
        temp_bytes = load_pdf(body.pdf_filename)
        fname = save_pdf(template_id, temp_bytes)
        delete_pdf(body.pdf_filename)  # remove temp
        return fname
    # Fallback: base64 blob in request (legacy / direct upload)
    if body.original_pdf:
        try:
            pdf_bytes = base64.b64decode(body.original_pdf)
            return save_pdf(template_id, pdf_bytes)
        except Exception:
            return None
    return None


@router.post("")
def create_form(
    request: Request,
    body: CreateFormRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    # Allow multiple templates per category
    form = FormTemplateMetadata(
        name=body.name,
        category=body.category,
        description=body.description,
        languages=body.languages,
        field_definitions=body.field_definitions,
        field_coordinates=body.field_coordinates,
        status="Draft",
        version=1,
        created_by=current_admin.id
    )
    db.add(form)
    db.flush()  # get form.id before commit

    # Store PDF on disk, save only filename in DB
    pdf_fname = _resolve_pdf_filename(body, form.id)
    if pdf_fname:
        form.pdf_filename = pdf_fname

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
    # Handle PDF update (disk-based storage)
    if body.original_pdf is not None or body.pdf_filename is not None:
        old_pdf = form.pdf_filename
        new_fname = _resolve_pdf_filename(body, form.id)
        if new_fname:
            form.pdf_filename = new_fname
            if old_pdf and old_pdf != new_fname:
                delete_pdf(old_pdf)  # clean up old file
    if body.field_coordinates is not None:
        form.field_coordinates = body.field_coordinates

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
    """Upload a PDF/image form → OCR service extracts fields → return detected mapping.
    For PDFs the file is saved to disk immediately so the admin can later attach
    it to a template without re-uploading.  Returns `pdf_filename` (temp file)
    instead of the raw base64 blob.
    """
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

    result = resp.json()
    # Save the PDF to disk and return the temp filename (instead of huge base64 blob)
    if file.filename and file.filename.lower().endswith(".pdf"):
        temp_fname = save_temp_pdf(contents)
        result["pdf_filename"] = temp_fname
        # Also provide a URL to view the temp PDF in the visual editor
        result["pdf_temp_url"] = f"/api/admin/forms/temp-pdf/{temp_fname}"
    return result


@router.get("/temp-pdf/{filename}")
def get_temp_pdf(filename: str):
    """Serve a temporary PDF saved during OCR upload (for the visual editor preview)."""
    if not filename.startswith("temp") or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    try:
        pdf_bytes = load_pdf(filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Temp PDF not found or expired")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
