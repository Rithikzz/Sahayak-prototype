"""
PDF file storage helper.

Stores original PDF templates on disk under DATA_DIR/pdfs/ instead of as
base64 blobs in PostgreSQL.  The DB column `original_pdf` stores only
the filename (e.g. "16_1709820000.pdf").

Public API:
    save_pdf(template_id, pdf_bytes) -> filename
    load_pdf(filename)               -> bytes
    delete_pdf(filename)             -> None
    pdf_exists(filename)             -> bool
"""
import os
import time

DATA_DIR = os.getenv("DATA_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "data"))
PDF_DIR = os.path.join(DATA_DIR, "pdfs")

# Ensure directory exists on import
os.makedirs(PDF_DIR, exist_ok=True)


def save_pdf(template_id: int | str, pdf_bytes: bytes, *, suffix: str = "") -> str:
    """Write *pdf_bytes* to disk and return the filename (not full path)."""
    ts = int(time.time())
    fname = f"{template_id}{suffix}_{ts}.pdf"
    path = os.path.join(PDF_DIR, fname)
    with open(path, "wb") as f:
        f.write(pdf_bytes)
    return fname


def save_temp_pdf(pdf_bytes: bytes) -> str:
    """Save an uploaded PDF before we know the template id (OCR upload step)."""
    return save_pdf("temp", pdf_bytes)


def load_pdf(filename: str) -> bytes:
    """Return raw bytes of a stored PDF.  Raises FileNotFoundError."""
    path = os.path.join(PDF_DIR, filename)
    with open(path, "rb") as f:
        return f.read()


def delete_pdf(filename: str) -> None:
    """Remove a stored PDF file (best-effort, swallows errors)."""
    try:
        os.remove(os.path.join(PDF_DIR, filename))
    except OSError:
        pass


def pdf_exists(filename: str) -> bool:
    return os.path.isfile(os.path.join(PDF_DIR, filename))


def cleanup_temp_pdfs(max_age_s: int = 86400) -> int:
    """Delete temp_*.pdf files older than *max_age_s* seconds (default 24 h).

    Returns the number of files removed.  Safe to call on every startup.
    """
    import glob
    removed = 0
    for path in glob.glob(os.path.join(PDF_DIR, "temp_*.pdf")):
        try:
            if time.time() - os.path.getmtime(path) > max_age_s:
                os.remove(path)
                removed += 1
        except OSError:
            pass
    if removed:
        print(f"[pdf.storage] Cleaned up {removed} expired temp PDF(s)")
    return removed
