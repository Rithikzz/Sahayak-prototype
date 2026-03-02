import io
import re
import os
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
OCR_LANG = os.getenv("OCR_LANG", "eng+hin+tam")


def extract_fields_from_text(raw_text: str) -> list:
    """
    Heuristic field extraction: look for 'Label: Value' patterns
    and common banking field keywords to build a suggested field list.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    detected = []

    # Pattern 1: "Label : Value" or "Label - Value"
    colon_pattern = re.compile(r'^([A-Za-z\s/()]+?)\s*[:|-]\s*(.+)$')

    # Banking keyword mapping → field id suggestions
    keyword_map = {
        "account number": "accountNumber",
        "account no": "accountNumber",
        "full name": "fullName",
        "name": "fullName",
        "date of birth": "dateOfBirth",
        "dob": "dateOfBirth",
        "aadhar": "aadharNumber",
        "aadhaar": "aadharNumber",
        "pan": "panNumber",
        "phone": "phoneNumber",
        "mobile": "phoneNumber",
        "email": "email",
        "address": "address",
        "amount": "amount",
        "deposit": "amount",
        "ifsc": "ifscCode",
        "branch": "branchName",
        "date": "date",
        "signature": None,  # skip
    }

    seen_ids = set()

    for line in lines:
        match = colon_pattern.match(line)
        if match:
            label = match.group(1).strip()
            value = match.group(2).strip()
        else:
            label = line
            value = ""

        label_lower = label.lower()
        field_id = None

        for keyword, fid in keyword_map.items():
            if keyword in label_lower:
                field_id = fid
                break

        if field_id is None:
            # Generate a camelCase id from the label
            words = re.sub(r'[^a-zA-Z0-9 ]', '', label).split()
            if not words:
                continue
            field_id = words[0].lower() + "".join(w.capitalize() for w in words[1:])

        if field_id in seen_ids:
            continue
        seen_ids.add(field_id)

        detected.append({
            "id": field_id,
            "label": label,
            "type": "text",
            "required": True,
            "detected_value": value if value else None,
        })

    return detected


@app.get("/health")
def health():
    return {"status": "OK", "service": "OCR"}


@app.post("/extract")
async def extract_form(file: UploadFile = File(...)):
    """
    Accept a PDF or image file, run Tesseract OCR, return raw text
    and a heuristic list of detected form fields.
    """
    filename = file.filename or ""
    contents = await file.read()
    images: list = []

    try:
        if filename.lower().endswith(".pdf"):
            # pdf2image converts each PDF page to a PIL Image
            from pdf2image import convert_from_bytes
            images = convert_from_bytes(contents, dpi=200)
        else:
            images = [Image.open(io.BytesIO(contents))]
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not open file: {str(e)}")

    raw_text_parts = []
    for idx, img in enumerate(images):
        try:
            text = pytesseract.image_to_string(img, lang=OCR_LANG)
            raw_text_parts.append(text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OCR failed on page {idx + 1}: {str(e)}")

    raw_text = "\n".join(raw_text_parts)
    detected_fields = extract_fields_from_text(raw_text)

    return {
        "raw_text": raw_text,
        "detected_fields": detected_fields,
        "page_count": len(images),
        "file_name": filename,
    }
