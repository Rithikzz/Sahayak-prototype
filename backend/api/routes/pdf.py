"""
PDF Overlay Route
POST /api/forms/generate-pdf

Accepts { form_template_id: int, form_data: dict }
Loads the original PDF from disk, overlays filled values using PyMuPDF,
and returns the filled PDF bytes.
Core overlay logic lives in app/pdf/overlay.py and is shared with the
submission endpoint so we never need to regenerate a lost PDF.
"""
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import FormTemplateMetadata
from app.pdf.overlay import generate_filled_pdf_bytes

router = APIRouter()


class GeneratePDFRequest(BaseModel):
    form_template_id: int
    form_data: Dict[str, Any]


@router.post("/generate-pdf")
def generate_pdf(request: GeneratePDFRequest, db: Session = Depends(get_db)):
    """Overlay form_data onto the original PDF template and return the filled PDF."""
    template = db.query(FormTemplateMetadata).filter(
        FormTemplateMetadata.id == request.form_template_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")

    if not template.pdf_filename:
        raise HTTPException(
            status_code=422,
            detail="This template has no PDF stored. "
                   "Re-scan the form in the Admin portal to save the PDF.",
        )

    try:
        pdf_out = generate_filled_pdf_bytes(template, request.form_data)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="PDF file missing from storage")
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    return Response(
        content=pdf_out,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="filled_form_{request.form_template_id}.pdf"'
        },
    )
