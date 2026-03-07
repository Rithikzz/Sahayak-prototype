"""
PDF Overlay Route
POST /api/forms/generate-pdf

Accepts { form_template_id: int, form_data: dict }
Loads the original PDF from disk (filename stored in FormTemplateMetadata.original_pdf),
uses pymupdf (fitz) to overlay each form_data value at the coordinates stored in
FormTemplateMetadata.field_coordinates, and returns the filled PDF.

Features:
  - White-out rectangle behind each value (masks pre-printed placeholders)
  - Auto-fit text with insert_textbox() — wraps/shrinks long values
  - Multi-page support
"""
import io
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import FormTemplateMetadata
from app.pdf.storage import load_pdf

router = APIRouter()

FONT_SIZE = 9
TEXT_COLOR = (0, 0, 0)        # black
WHITEOUT_COLOR = (1, 1, 1)    # white
DEFAULT_BOX_WIDTH = 200       # default field width in PDF points
DEFAULT_LINE_HEIGHT = 16      # default row height in PDF points


class GeneratePDFRequest(BaseModel):
    form_template_id: int
    form_data: Dict[str, Any]


@router.post("/generate-pdf")
def generate_pdf(request: GeneratePDFRequest, db: Session = Depends(get_db)):
    """
    Overlay form_data values onto the original PDF template and return the filled PDF.
    """
    template = db.query(FormTemplateMetadata).filter(
        FormTemplateMetadata.id == request.form_template_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")

    # Determine which PDF file to use: prefer pdf_filename (new disk-based)
    # Fall back to original_pdf for backward compatibility (old base64 data)
    pdf_filename = template.pdf_filename
    if not pdf_filename:
        raise HTTPException(
            status_code=422,
            detail="This template has no PDF stored. "
                   "Re-scan the form in the Admin portal to save the PDF.",
        )

    # Load PDF from disk
    try:
        pdf_bytes = load_pdf(pdf_filename)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="PDF file missing from storage")

    coordinates: dict = template.field_coordinates or {}

    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise HTTPException(status_code=500, detail="pymupdf not installed on backend")

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        for field_id, value in request.form_data.items():
            if not value:
                continue
            coord = coordinates.get(field_id)
            if not coord:
                continue

            page_num = int(coord.get("page", 0))
            x = float(coord.get("x", 0))
            input_y = float(coord.get("input_y", coord.get("y", 0)))
            box_w = float(coord.get("box_width", DEFAULT_BOX_WIDTH))
            box_h = float(coord.get("box_height", DEFAULT_LINE_HEIGHT))

            if page_num >= len(doc):
                continue

            page = doc[page_num]
            text_str = str(value)

            # Define the text box rectangle
            rect = fitz.Rect(
                x,
                input_y - FONT_SIZE - 2,  # top of box (above baseline)
                x + box_w,
                input_y + box_h,           # bottom of box
            )

            # White-out: draw a filled white rectangle to mask pre-printed marks
            page.draw_rect(rect, color=None, fill=WHITEOUT_COLOR)

            # Insert text with auto-wrapping inside the rect
            page.insert_textbox(
                rect,
                text_str,
                fontsize=FONT_SIZE,
                color=TEXT_COLOR,
                align=0,  # left-align
            )

        output = io.BytesIO()
        doc.save(output)
        doc.close()
        pdf_out = output.getvalue()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    return Response(
        content=pdf_out,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="filled_form_{request.form_template_id}.pdf"'
        },
    )
