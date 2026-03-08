"""
Shared PDF overlay helper.

generate_filled_pdf_bytes(template, form_data) -> bytes

Used by:
  - api/routes/pdf.py   (GET /generate-pdf endpoint — preview + print)
  - api/routes/forms.py (persists a filled PDF at submission time)
"""
import io
from typing import Any, Dict

FONT_SIZE = 11          # minimum readable size; insert_textbox will shrink for long values
TEXT_COLOR = (0, 0, 0)
WHITEOUT_COLOR = (1, 1, 1)
DEFAULT_BOX_WIDTH = 200
DEFAULT_LINE_HEIGHT = 16


def generate_filled_pdf_bytes(template, form_data: Dict[str, Any]) -> bytes:
    """Overlay *form_data* values onto *template*'s stored PDF and return bytes.

    Coordinate expectation
    ----------------------
    ``field_coordinates[field_id]`` must contain:
      page       – 0-based page index
      x          – left edge of the input box (PDF points)
      input_y    – TOP edge of the input box (PDF points)
      box_width  – width of the input box
      box_height – height of the input box

    Pixtral path: bbox is the actual input area, so ``input_y = bbox.y`` (top edge).
    pdfplumber / Tesseract paths: ``input_y = label_bottom + 4`` (just below label),
    which is also the top of the answer area.

    Raises
    ------
    FileNotFoundError – stored PDF file is missing from disk
    RuntimeError      – pymupdf not installed
    """
    from app.pdf.storage import load_pdf

    pdf_bytes = load_pdf(template.pdf_filename)
    coordinates: dict = template.field_coordinates or {}

    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise RuntimeError("pymupdf not installed on backend")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        for field_id, value in form_data.items():
            if not value:
                continue
            coord = coordinates.get(field_id)
            if not coord:
                continue

            page_num = int(coord.get("page", 0))
            if page_num >= len(doc):
                continue

            x       = float(coord.get("x", 0))
            input_y = float(coord.get("input_y", coord.get("y", 0)))
            box_w   = float(coord.get("box_width", DEFAULT_BOX_WIDTH))
            box_h   = float(coord.get("box_height", DEFAULT_LINE_HEIGHT))

            page = doc[page_num]
            # rect covers the full input area: top=input_y, bottom=input_y+box_h
            rect = fitz.Rect(x, input_y, x + box_w, input_y + box_h)

            # Erase any pre-printed placeholder mark
            page.draw_rect(rect, color=None, fill=WHITEOUT_COLOR)

            # Fill text; insert_textbox auto-shrinks font if value overflows
            page.insert_textbox(
                rect,
                str(value),
                fontsize=FONT_SIZE,
                color=TEXT_COLOR,
                align=0,
                warn_empty=False,
            )

        output = io.BytesIO()
        doc.save(output)
        return output.getvalue()
    finally:
        doc.close()
