"""
Shared PDF overlay helper.

generate_filled_pdf_bytes(template, form_data) -> bytes

Used by:
  - api/routes/pdf.py   (GET /generate-pdf endpoint — preview + print)
  - api/routes/forms.py (persists a filled PDF at submission time)
"""
import io
import re
import logging
from typing import Any, Dict, Optional, Callable

log = logging.getLogger(__name__)

FONT_SIZE = 11          # minimum readable size; insert_textbox will shrink for long values
TEXT_COLOR = (0, 0, 0)
WHITEOUT_COLOR = (1, 1, 1)
DEFAULT_BOX_WIDTH = 200
DEFAULT_LINE_HEIGHT = 16


def _normalize(s: str) -> str:
    """Lowercase + strip everything except alphanumerics for fuzzy key matching.

    Examples:
      'Full Name'   -> 'fullname'
      'fullName'    -> 'fullname'
      'full_name'   -> 'fullname'
      'f_abc123'    -> 'fabc123'
    """
    return re.sub(r'[^a-z0-9]', '', s.lower()) if s else ''


def _build_coord_lookup(
    coordinates: dict,
    field_definitions: list,
) -> Callable[[str], Optional[dict]]:
    """Return a lookup function: form_data_key -> coordinate dict (or None).

    Matching order (first hit wins):
    1. Exact key match:             coordinates[form_key]
    2. Normalised key match:        any coord key where normalize(k) == normalize(form_key)
    3. Label match via definitions: field whose label normalises to same as form_key,
                                    then look up that field's coord by its id
    """
    # Build normalized-coord-key → coord dict
    norm_to_coord: dict[str, dict] = {}
    for k, v in coordinates.items():
        nk = _normalize(k)
        if nk not in norm_to_coord:
            norm_to_coord[nk] = v

    # Build normalized-label → coord dict using field_definitions
    label_to_coord: dict[str, dict] = {}
    for fld in (field_definitions or []):
        fld_id = fld.get('id', '') if isinstance(fld, dict) else ''
        label  = fld.get('label', '') if isinstance(fld, dict) else ''
        if fld_id and fld_id in coordinates:
            nl = _normalize(label)
            if nl and nl not in label_to_coord:
                label_to_coord[nl] = coordinates[fld_id]

    def lookup(form_key: str) -> Optional[dict]:
        # 1. Exact
        coord = coordinates.get(form_key)
        if coord:
            return coord
        # 2. Normalised coord key
        nk = _normalize(form_key)
        coord = norm_to_coord.get(nk)
        if coord:
            return coord
        # 3. Label match
        coord = label_to_coord.get(nk)
        if coord:
            return coord
        return None

    return lookup


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

    Key matching
    ------------
    Tries exact key first, then normalised-key (case/underscore/space insensitive),
    then label match via ``template.field_definitions``.  This means even if the
    admin used random IDs like ``f_abc123`` in field_definitions and the kiosk
    submits ``{"fullName": "John"}`` the overlay will still work as long as the
    field label is "Full Name".

    Raises
    ------
    FileNotFoundError – stored PDF file is missing from disk
    RuntimeError      – pymupdf not installed
    """
    from app.pdf.storage import load_pdf

    pdf_bytes = load_pdf(template.pdf_filename)
    coordinates: dict = template.field_coordinates or {}
    field_definitions: list = template.field_definitions or []

    if not coordinates:
        log.warning(
            "[overlay] Template %s has no field_coordinates – returning blank PDF",
            getattr(template, 'id', '?'),
        )

    coord_lookup = _build_coord_lookup(coordinates, field_definitions)

    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise RuntimeError("pymupdf not installed on backend")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    placed = 0
    try:
        for field_id, value in form_data.items():
            if not value:
                continue
            coord = coord_lookup(field_id)
            if not coord:
                log.debug("[overlay] No coordinate for field %r – skipping", field_id)
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
            rc = page.insert_textbox(
                rect,
                str(value),
                fontsize=FONT_SIZE,
                color=TEXT_COLOR,
                align=0,
                warn_empty=False,
            )
            if rc < 0:
                log.debug(
                    "[overlay] insert_textbox overflow for field %r (rc=%d) — text truncated",
                    field_id, rc,
                )
            placed += 1

        log.info(
            "[overlay] Template %s: placed %d / %d fields",
            getattr(template, 'id', '?'), placed, len(form_data),
        )

        output = io.BytesIO()
        doc.save(output)
        return output.getvalue()
    finally:
        doc.close()
