import io
import os
import base64
import json
import re
import httpx
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image

app = FastAPI(title="SAHAYAK OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tesseract supports Hindi (hin) and Tamil (tam) in addition to English (eng)
OCR_LANG        = os.getenv("OCR_LANG", "eng+hin+tam")

# ── Bedrock / Pixtral vision config ─────────────────────────────────────────
AWS_BEARER_TOKEN_BEDROCK = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
AWS_REGION               = os.getenv("AWS_REGION", "eu-north-1")
VISION_MODEL_ID          = os.getenv("VISION_MODEL_ID", "mistral.pixtral-large-2502-v1:0")
VISION_TIMEOUT           = float(os.getenv("VISION_TIMEOUT", "60"))

BEDROCK_VISION_URL = (
    f"https://bedrock-runtime.{AWS_REGION}.amazonaws.com"
    f"/model/{VISION_MODEL_ID}/converse"
)

PIXTRAL_PROMPT = """You are analyzing a scanned Indian bank form image.
Identify every input field — any blank line, empty box, or underline where a customer must write data.
Ignore printed instructions, titles, logos, and watermarks.

Return ONLY a valid JSON array (no markdown, no explanation) using this exact schema:
[
  {
    "id": "camelCaseId",
    "label": "Exact label text as printed on the form",
    "type": "text|number|tel|date|email",
    "required": true,
    "bbox": {"x": 0.12, "y": 0.23, "w": 0.45, "h": 0.04}
  }
]

bbox values are fractions of the image dimensions (0.0 to 1.0).
x,y = top-left corner of the input area (NOT the label).
w,h = width and height of the input area.
type rules: use "tel" for phone/account numbers, "number" for amounts/counts, "date" for dates, "email" for email, "text" for everything else.
required: true unless the field is clearly optional (e.g. has "(optional)" or "if applicable").
"""


async def call_pixtral(images: list) -> list:
    """Send all page images to Pixtral via Bedrock and return merged field list.

    Each image is encoded as base64 JPEG and sent in a single multi-image message.
    Returns a list of field dicts with keys: id, label, type, required, bbox, page.
    Falls back to empty list on any error so the regex fallback can take over.
    """
    if not AWS_BEARER_TOKEN_BEDROCK:
        print("[OCR] AWS_BEARER_TOKEN_BEDROCK not set — skipping Pixtral, using regex fallback")
        return []

    all_fields: list = []

    for page_num, img in enumerate(images):
        try:
            # Convert PIL image → JPEG bytes → base64
            buf = io.BytesIO()
            img_rgb = img.convert("RGB")
            img_rgb.save(buf, format="JPEG", quality=90)
            img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

            payload = {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "image": {
                                    "format": "jpeg",
                                    "source": {"bytes": img_b64},
                                }
                            },
                            {"text": PIXTRAL_PROMPT},
                        ],
                    }
                ],
                "inferenceConfig": {"maxTokens": 2048, "temperature": 0.0},
            }

            headers = {
                "Authorization": f"Bearer {AWS_BEARER_TOKEN_BEDROCK}",
                "Content-Type": "application/json",
            }

            async with httpx.AsyncClient(timeout=VISION_TIMEOUT) as client:
                resp = await client.post(BEDROCK_VISION_URL, headers=headers, json=payload)
                resp.raise_for_status()

            raw_reply = resp.json()["output"]["message"]["content"][0]["text"]

            # Strip markdown code fences if present
            clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_reply.strip(), flags=re.MULTILINE).strip()
            page_fields = json.loads(clean)

            if isinstance(page_fields, list):
                for f in page_fields:
                    f["page"] = page_num
                all_fields.extend(page_fields)
                print(f"[OCR] Pixtral detected {len(page_fields)} fields on page {page_num + 1}")

        except Exception as e:
            print(f"[OCR] Pixtral failed on page {page_num + 1}: {e}")

    return all_fields


def pixtral_bbox_to_pdf_coords(fields: list, images: list) -> dict:
    """Convert Pixtral fractional bboxes → PDF point coordinates.

    Pixtral returns bbox as fractions of image dimensions.
    We convert back to PDF points: 1 px = 72/DPI pt (DPI=200).
    """
    DPI = 200
    PT_PER_PX = 72.0 / DPI
    coordinates: dict = {}

    for f in fields:
        fid   = f.get("id")
        bbox  = f.get("bbox", {})
        page  = f.get("page", 0)
        if not fid or not bbox or page >= len(images):
            continue

        img = images[page]
        img_w, img_h = img.width, img.height

        x_px = bbox.get("x", 0) * img_w
        y_px = bbox.get("y", 0) * img_h
        w_px = bbox.get("w", 0) * img_w
        h_px = bbox.get("h", 0) * img_h

        x_pt = round(x_px * PT_PER_PX, 2)
        y_pt = round(y_px * PT_PER_PX, 2)
        w_pt = round(w_px * PT_PER_PX, 2)
        h_pt = round(h_px * PT_PER_PX, 2)

        coordinates[fid] = {
            "page":       page,
            "x":          x_pt,
            "y":          y_pt,
            "width":      w_pt,
            "height":     h_pt,
            "input_y":    round(y_pt + h_pt + 4, 2),
            "box_width":  w_pt,
            "box_height": h_pt if h_pt > 0 else 16.0,
        }

    return coordinates


# ── Regex fallback ────────────────────────────────────────────────────────────
BANKING_FIELD_RULES = [
    # Account info
    (["account number", "a/c no", "account no", "ac no", "credit card no", "tlidl"],
     "accountNumber", "Account Number", "text", True),
    (["account type", "sb/ca", "sp/ca", "saving", "current account"],
     "accountType", "Account Type", "text", True),
    (["ifsc"],
     "ifscCode", "IFSC Code", "text", False),
    # Person info
    (["full name", "name of depositor", "depositor name"],
     "depositorName", "Depositor Name", "text", True),
    (["^name$", "name "],
     "fullName", "Full Name", "text", True),
    (["father", "spouse"],
     "fatherName", "Father / Spouse Name", "text", False),
    (["date of birth", "dob"],
     "dateOfBirth", "Date of Birth", "date", True),
    (["aadhar", "aadhaar"],
     "aadharNumber", "Aadhaar Number", "text", True),
    (["pan no", "pan number", "pan card"],
     "panNumber", "PAN Number", "text", False),
    (["form 60"],
     "form60", "Form 60 (if no PAN)", "text", False),
    # Contact
    (["mobile no", "mobile number", "tel. no./mobile", "phone no", "contact no"],
     "phoneNumber", "Mobile / Phone Number", "tel", True),
    (["email", "e-mail", "e mail"],
     "emailId", "Email ID", "email", False),
    # Transaction
    (["transaction type", "nature of transaction"],
     "transactionType", "Transaction Type", "text", True),
    (["transaction id", "transaction no", "txn id"],
     "transactionId", "Transaction ID", "text", False),
    (["branch name", "branch :"],
     "branchName", "Branch Name", "text", True),
    (["^date$", "date :"],
     "date", "Date (DD/MM/YYYY)", "date", True),
    (["cheque no", "cheque number", "chq no", "cheque date", "name of bank"],
     "chequeDetails", "Cheque No. / Bank / Date", "text", False),
    # Cash denomination breakdown
    (["2000", "notes no", "₹ 2000", "rs.2000"],
     "notes2000", "₹ 2000 Notes — Count", "number", False),
    (["1000", "₹ 1000", "rs.1000"],
     "notes1000", "₹ 1000 Notes — Count", "number", False),
    (["500", "₹ 500", "rs.500"],
     "notes500", "₹ 500 Notes — Count", "number", False),
    (["200", "₹ 200"],
     "notes200", "₹ 200 Notes — Count", "number", False),
    (["100", "₹ 100"],
     "notes100", "₹ 100 Notes — Count", "number", False),
    (["50", "₹ 50"],
     "notes50", "₹ 50 Notes — Count", "number", False),
    (["20", "₹ 20"],
     "notes20", "₹ 20 Notes — Count", "number", False),
    (["10", "₹ 10"],
     "notes10", "₹ 10 Notes — Count", "number", False),
    (["5", "₹ 5"],
     "notes5", "₹ 5 Notes — Count", "number", False),
    (["coins"],
     "coinsTotal", "Coins Total (₹)", "number", False),
    (["total amount", "^total$", "grand total"],
     "totalAmount", "Total Amount (₹)", "number", True),
    # Amount
    (["amount in words", "rupees in words"],
     "amountInWords", "Amount in Words", "text", True),
    (["amount", "deposit amount", "cash amount"],
     "amount", "Amount (₹)", "number", True),
    # Staff / signatures
    (["signature of depositor", "depositor signature"],
     "depositorSignature", "Depositor Signature", "text", False),
    (["passing officer", "swo", "staff signature", "officer signature"],
     "staffSignature", "Staff / Passing Officer", "text", False),
    (["nominee"],
     "nomineeDetails", "Nominee Details", "text", False),
    (["loan type", "loan amount"],
     "loanDetails", "Loan Details", "text", False),
    (["address", "residential address"],
     "address", "Address", "text", False),
    (["passport", "voter id", "driving licence", "id proof"],
     "idProof", "ID Proof Type", "text", False),
]




def extract_fields_from_text(raw_text: str) -> list:
    """
    Pass 1 only: match OCR lines against known banking field rules.
    No Pass 2 — keeps output clean and free of instruction/boilerplate noise.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    detected = []
    seen_ids = set()

    def add(field_id, label, ftype, required, detected_value=None):
        if field_id and field_id not in seen_ids:
            seen_ids.add(field_id)
            detected.append({
                "id": field_id,
                "label": label,
                "type": ftype,
                "required": required,
                "detected_value": detected_value or None,
            })

    for line in lines:
        line_lower = line.lower()
        for keywords, fid, display_label, ftype, required in BANKING_FIELD_RULES:
            for kw in keywords:
                pattern = kw.lstrip('^').rstrip('$')
                if kw.startswith('^') and kw.endswith('$'):
                    if line_lower.strip() == pattern:
                        add(fid, display_label, ftype, required)
                        break
                elif kw.startswith('^'):
                    if line_lower.startswith(pattern):
                        add(fid, display_label, ftype, required)
                        break
                else:
                    if pattern in line_lower:
                        add(fid, display_label, ftype, required)
                        break

    return detected


def extract_field_coordinates(pdf_bytes: bytes, detected_fields: list, images: list = None) -> dict:
    """
    Extract bounding-box coordinates for each detected field label in the PDF.

    Strategy:
      Pass 1 — pdfplumber (fast, accurate for native/digital PDFs that have a text layer).
      Pass 2 — Tesseract image_to_data() (fallback for scanned PDFs that are image-only).

    Returns: { field_id: { page, x, y, width, height, input_y } }
    All coordinates are in PDF points at 72 dpi.
    input_y = y-position below the label line where the filled value should be written.
    """
    # Build keyword lookup: field_id → [list of cleaned keyword strings]
    field_keyword_map: dict = {}
    for f in detected_fields:
        fid = f["id"]
        for keywords, rule_fid, _, _, _ in BANKING_FIELD_RULES:
            if rule_fid == fid:
                clean = [kw.lstrip("^").rstrip("$").lower() for kw in keywords]
                field_keyword_map[fid] = clean
                break

    coordinates: dict = {}

    # ── Pass 1: pdfplumber (native text layer) ─────────────────────────────────
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages):
                page_width = float(page.width)
                words = page.extract_words(keep_blank_chars=False, x_tolerance=3, y_tolerance=3)
                if not words:
                    continue
                page_lower = " ".join(w["text"].lower() for w in words)
                for fid, search_kws in field_keyword_map.items():
                    if fid in coordinates:
                        continue
                    for kw in search_kws:
                        fragment = kw.split()[0][:6] if kw.split() else ""
                        if not fragment or fragment not in page_lower:
                            continue
                        for w in words:
                            if w["text"].lower().startswith(fragment):
                                x0 = float(w["x0"])
                                y_bottom = float(w["bottom"])
                                # Estimate box_width: distance to page edge or 250pt, whichever is less
                                box_w = min(250.0, page_width - x0 - 10)
                                coordinates[fid] = {
                                    "page": page_num,
                                    "x": round(x0, 2),
                                    "y": round(float(w["top"]), 2),
                                    "width": round(float(w["x1"] - w["x0"]), 2),
                                    "height": round(y_bottom - float(w["top"]), 2),
                                    "input_y": round(y_bottom + 4, 2),
                                    "box_width": round(box_w, 2),
                                    "box_height": 16.0,
                                }
                                break
                        if fid in coordinates:
                            break
    except Exception as e:
        print(f"[OCR] pdfplumber pass failed: {e}")

    # ── Pass 2: Tesseract image_to_data() (fallback for scanned PDFs) ──────────
    # Activate if pdfplumber found coordinates for fewer than 30 % of detected fields
    need_fallback = images and len(coordinates) < max(1, len(detected_fields) * 0.3)
    if need_fallback:
        print(f"[OCR] pdfplumber found {len(coordinates)}/{len(detected_fields)} coords — "
              f"switching to Tesseract bounding-box mode")
        try:
            from pytesseract import Output as TessOutput
            DPI = 200           # must match the dpi used in convert_from_bytes
            PT_PER_PX = 72.0 / DPI   # 0.36 pt per pixel

            for page_num, img in enumerate(images):
                data = pytesseract.image_to_data(
                    img, lang=OCR_LANG, output_type=TessOutput.DICT
                )
                n = len(data["text"])

                # Collect confident words with their pixel bounding boxes
                words_pg = []
                for i in range(n):
                    word = (data["text"][i] or "").strip()
                    raw_conf = str(data["conf"][i])
                    conf = int(raw_conf) if raw_conf.lstrip("-").isdigit() else -1
                    if word and conf > 20:
                        words_pg.append({
                            "text": word.lower(),
                            "x": int(data["left"][i]),
                            "y": int(data["top"][i]),
                            "w": int(data["width"][i]),
                            "h": int(data["height"][i]),
                        })

                if not words_pg:
                    continue

                page_text = " ".join(w["text"] for w in words_pg)

                for fid, search_kws in field_keyword_map.items():
                    if fid in coordinates:
                        continue
                    for kw in search_kws:
                        fragment = kw.split()[0][:5] if kw.split() else ""
                        if not fragment or fragment not in page_text:
                            continue
                        for w in words_pg:
                            if w["text"].startswith(fragment):
                                x_pt   = round(w["x"] * PT_PER_PX, 2)
                                y_pt   = round(w["y"] * PT_PER_PX, 2)
                                x1_pt  = round((w["x"] + w["w"]) * PT_PER_PX, 2)
                                y1_pt  = round((w["y"] + w["h"]) * PT_PER_PX, 2)
                                # Estimate page width (A4 default) and box_width
                                page_w_pt = round(img.width * PT_PER_PX, 2) if img else 595.0
                                box_w = min(250.0, page_w_pt - x_pt - 10)
                                coordinates[fid] = {
                                    "page": page_num,
                                    "x": x_pt,
                                    "y": y_pt,
                                    "width":  round(x1_pt - x_pt, 2),
                                    "height": round(y1_pt - y_pt, 2),
                                    "input_y": round(y1_pt + 4, 2),
                                    "box_width": round(box_w, 2),
                                    "box_height": 16.0,
                                }
                                break
                        if fid in coordinates:
                            break
        except Exception as e:
            print(f"[OCR] Tesseract bbox pass failed: {e}")

    print(f"[OCR] coordinate extraction complete: {len(coordinates)}/{len(detected_fields)} fields located")
    return coordinates


@app.get("/health")
def health():
    return {
        "status": "OK",
        "service": "OCR",
        "vision_model": VISION_MODEL_ID,
        "vision_ready": bool(AWS_BEARER_TOKEN_BEDROCK),
    }


@app.post("/extract")
async def extract_form(file: UploadFile = File(...)):
    """
    Accept a PDF or image file.

    Pipeline (Pixtral-first):

    Step 1 — Render pages to images (pdf2image / Pillow).
    Step 2 — Tesseract extracts raw text for audit / debugging.
    Step 3 — Pixtral (Bedrock vision) analyses each page image and returns:
               • detected_fields  — all visible input fields with type + required
               • field_coordinates — bounding boxes as PDF points
    Step 4 — If Pixtral is unavailable or returns nothing, fall back to the
               legacy regex rules + pdfplumber coordinate extraction.
    """
    filename = file.filename or ""
    contents = await file.read()
    images: list = []
    is_pdf = filename.lower().endswith(".pdf")

    # ── Step 1: render to images ─────────────────────────────────────────────
    try:
        if is_pdf:
            from pdf2image import convert_from_bytes
            images = convert_from_bytes(contents, dpi=200)
        else:
            images = [Image.open(io.BytesIO(contents))]
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not open file: {str(e)}")

    # ── Step 2: Tesseract raw text (kept for audit / fallback trigger) ────────
    raw_text_parts = []
    for idx, img in enumerate(images):
        try:
            text = pytesseract.image_to_string(img, lang=OCR_LANG)
            raw_text_parts.append(text)
        except Exception as e:
            print(f"[OCR] Tesseract failed on page {idx + 1}: {e}")
    raw_text = "\n".join(raw_text_parts)

    # ── Step 3: Pixtral vision (primary) ─────────────────────────────────────
    pixtral_fields = await call_pixtral(images)
    used_pixtral = False

    if pixtral_fields:
        used_pixtral = True
        # Normalise to the same schema as the regex fallback
        detected_fields = [
            {
                "id":             f.get("id", "unknown"),
                "label":          f.get("label", ""),
                "type":           f.get("type", "text"),
                "required":       f.get("required", True),
                "detected_value": None,
            }
            for f in pixtral_fields
        ]
        field_coordinates = pixtral_bbox_to_pdf_coords(pixtral_fields, images)
        print(f"[OCR] Pixtral path: {len(detected_fields)} fields, "
              f"{len(field_coordinates)} with coordinates")
    else:
        # ── Step 4: regex fallback ────────────────────────────────────────────
        print("[OCR] Falling back to regex field detection")
        detected_fields = extract_fields_from_text(raw_text)
        field_coordinates = {}
        if is_pdf and detected_fields:
            field_coordinates = extract_field_coordinates(
                contents, detected_fields, images=images
            )

    return {
        "raw_text":          raw_text,
        "detected_fields":   detected_fields,
        "field_coordinates": field_coordinates,
        "page_count":        len(images),
        "file_name":         filename,
        "extraction_method": "pixtral" if used_pixtral else "regex_fallback",
    }
