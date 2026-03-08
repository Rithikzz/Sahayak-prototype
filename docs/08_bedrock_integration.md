# 08 — AWS Bedrock Integration

Everything added/changed in the Bedrock migration session (March 8 2026).
Covers four separate changes across the LLM and OCR microservices.

---

## 1. Replace Ollama with AWS Bedrock LLM

### What changed

| File | Change |
|---|---|
| `microservices/llm/main.py` | Full rewrite — boto3 → httpx bearer token, Bedrock Converse API |
| `microservices/llm/requirements.txt` | `boto3==1.34.0` → `httpx==0.27.0` |
| `docker-compose.ec2.yml` | Removed `ollama` service + `ollama_data` volume, added Bedrock env vars to `llm` service |
| `.env.example` | Replaced IAM key vars with `AWS_BEARER_TOKEN_BEDROCK` |

### Why

Ollama required a 7B+ model to be downloaded and kept in GPU/RAM on the EC2 instance.
Cold starts took 60–300 seconds. Bedrock is an API call — no model hosting, no cold start.

### How the LLM service works now

```
Customer speaks into kiosk mic
        ↓
Whisper STT  →  raw transcript  e.g. "ten thousand five hundred rupees"
        ↓
POST /voice/transcribe  (backend/api/routes/voice.py)
        ↓
POST http://llm:8004/extract  (microservices/llm/main.py)
  body: { field_label, field_type, raw_text, language }
        ↓
httpx  →  POST https://bedrock-runtime.eu-north-1.amazonaws.com
              /model/openai.gpt-oss-20b-1:0/converse
  auth: Bearer <AWS_BEARER_TOKEN_BEDROCK>
        ↓
Bedrock returns cleaned value  →  "10500"
        ↓
Kiosk field filled with "10500"
```

Timeout is 25 s. Any failure returns `raw_text` so the kiosk never blocks.

### Environment variables (LLM service)

| Variable | Description | Default |
|---|---|---|
| `AWS_BEARER_TOKEN_BEDROCK` | Bedrock long-term API key from AWS console | — (required) |
| `AWS_REGION` | AWS region where the model is available | `eu-north-1` |
| `BEDROCK_MODEL_ID` | Bedrock model ID | `openai.gpt-oss-20b-1:0` |
| `LLM_TIMEOUT` | Seconds before fallback | `25` |

### How to get the bearer token

1. Go to AWS Console → Amazon Bedrock → API keys
2. Generate a **long-term API key**
3. Copy the key string (starts with `ABSK…`)
4. Set it as `AWS_BEARER_TOKEN_BEDROCK` in EC2 `.env`

---

## 2. Repeated-word deduplication fix

### Problem

Whisper transcribes everything it hears for the full recording window. If a user says
"Deposit" once but the mic keeps recording, Whisper outputs:

```
"Deposit Deposit Deposit Deposit Deposit"
```

The LLM was then returning the same repeated string.

### What changed

| File | Change |
|---|---|
| `backend/api/routes/voice.py` | Added `_dedup_repeated()` regex function, runs on raw STT text before LLM call and again on the final result |
| `microservices/llm/main.py` | Updated system prompt to explicitly handle repeated input |
| `kiosk/src/components/InputController.jsx` | Recording window reduced from 8 s → 4 s |

### How `_dedup_repeated()` works

```python
def _dedup_repeated(text: str) -> str:
    for _ in range(6):
        text = re.sub(
            r'\b((?:\w+\s+){0,5}\w+)(\s+\1)+',
            r'\1',
            text,
            flags=re.IGNORECASE,
        ).strip()
    return text
```

It repeatedly collapses any sequence of 1–6 words that repeats consecutively.
Runs up to 6 times to handle chained repetitions.

Examples:
- `"Deposit Deposit Deposit"` → `"Deposit"`
- `"ten thousand ten thousand"` → `"ten thousand"`
- `"SBI Kolkata SBI Kolkata SBI Kolkata"` → `"SBI Kolkata"`

### Three-layer defence

1. **Recording time** (4 s) — mic stops quickly, less repetition captured
2. **`_dedup_repeated()` on raw STT** — before the LLM even sees it
3. **LLM system prompt** — instructed to treat repeated words as a single utterance
4. **`_dedup_repeated()` on LLM output** — final safety net

---

## 3. Pixtral vision model for OCR field detection

### What changed

| File | Change |
|---|---|
| `microservices/ocr/main.py` | Added `call_pixtral()`, `pixtral_bbox_to_pdf_coords()`, updated `/extract` endpoint to use Pixtral as primary with regex as fallback |
| `microservices/ocr/requirements.txt` | Added `httpx==0.27.0` |
| `docker-compose.ec2.yml` | Added `AWS_BEARER_TOKEN_BEDROCK`, `AWS_REGION`, `VISION_MODEL_ID`, `VISION_TIMEOUT` env vars to `ocr` service |
| `.env.example` | Added `VISION_MODEL_ID` var |

### Why

The previous approach used 80+ hardcoded regex rules to match field labels. Any field
label not in the list was silently dropped. Hindi/Tamil labeled forms produced garbled
output. Every new bank form type required a developer to edit `BANKING_FIELD_RULES`.

Pixtral (`mistral.pixtral-large-2502-v1:0`) is a multimodal vision model — it reads
the form image like a human and identifies all visible input fields regardless of
language, layout, or form type.

### New OCR pipeline

```
Admin uploads PDF
        ↓
Step 1: pdf2image → renders each page to JPEG at 200 dpi
        ↓
Step 2: Tesseract → raw text  (kept for audit log / debugging only)
        ↓
Step 3: Each page image → base64 JPEG
        → POST https://bedrock-runtime.eu-north-1.amazonaws.com
               /model/mistral.pixtral-large-2502-v1:0/converse
          auth: Bearer <AWS_BEARER_TOKEN_BEDROCK>
        ↓
        Pixtral returns JSON array:
        [
          {
            "id": "accountNumber",
            "label": "A/C No.",
            "type": "tel",
            "required": true,
            "bbox": {"x": 0.12, "y": 0.31, "w": 0.40, "h": 0.04}
          },
          ...
        ]
        bbox values are fractions of image dimensions (0.0–1.0)
        ↓
Step 4: pixtral_bbox_to_pdf_coords() converts fractional bbox → PDF points
        ↓
Step 5: (fallback only) If Pixtral unavailable → legacy regex + pdfplumber
```

### What Pixtral detects that regex couldn't

| Scenario | Old regex | Pixtral |
|---|---|---|
| Standard English fields | ✅ (if in the list) | ✅ |
| Unusual label wording | ❌ | ✅ |
| Hindi / Tamil labels | ❌ | ✅ |
| Scanned / photographed forms | ❌ poor | ✅ |
| New bank form type | ❌ needs dev work | ✅ zero config |
| Bounding box accuracy | ❌ fragment matching | ✅ model returns directly |

### Response shape

The `/extract` response now includes an `extraction_method` field:

```json
{
  "raw_text": "...",
  "detected_fields": [...],
  "field_coordinates": {...},
  "page_count": 1,
  "file_name": "deposit_slip.pdf",
  "extraction_method": "pixtral"
}
```

`extraction_method` is `"pixtral"` when Bedrock was used, `"regex_fallback"` when it
fell back to the old approach (bearer token missing or Pixtral returned nothing).

### Environment variables (OCR service)

| Variable | Description | Default |
|---|---|---|
| `AWS_BEARER_TOKEN_BEDROCK` | Same key as the LLM service | — (required) |
| `AWS_REGION` | AWS region | `eu-north-1` |
| `VISION_MODEL_ID` | Pixtral model ID | `mistral.pixtral-large-2502-v1:0` |
| `VISION_TIMEOUT` | Seconds before timeout | `60` |

---

## 4. Deployment

### EC2 `.env` — full Bedrock section

```bash
# AWS Bedrock — shared by both LLM and OCR services
AWS_BEARER_TOKEN_BEDROCK=ABSKQmVk...   # your actual key
AWS_REGION=eu-north-1

# LLM service
BEDROCK_MODEL_ID=openai.gpt-oss-20b-1:0

# OCR service
VISION_MODEL_ID=mistral.pixtral-large-2502-v1:0
```

### Redeploy after any change

```bash
cd ~/Sahayak-prototype
git pull origin wearewinning
docker compose -f docker-compose.ec2.yml up --build -d
```

### Verify LLM service

```bash
docker exec sahayak_llm python -c \
  "import urllib.request; print(urllib.request.urlopen('http://localhost:8004/health').read().decode())"
# Expected: {"status":"OK","model":"openai.gpt-oss-20b-1:0","region":"eu-north-1"}
```

### Verify OCR service

```bash
docker exec sahayak_ocr python -c \
  "import urllib.request; print(urllib.request.urlopen('http://localhost:8003/health').read().decode())"
# Expected: {"status":"OK","service":"OCR","vision_model":"mistral.pixtral-large-2502-v1:0","vision_ready":true}
```

---

## 5. Architecture summary after these changes

```
┌─────────────────────────────────────────────────────┐
│                   AWS Bedrock (eu-north-1)           │
│                                                      │
│  openai.gpt-oss-20b-1:0      ← LLM field extraction │
│  mistral.pixtral-large-2502-v1:0  ← OCR form parsing│
│                                                      │
│  Auth: single long-term bearer token                 │
└──────────────────────────┬──────────────────────────┘
                           │ HTTPS
         ┌─────────────────┴──────────────────┐
         │                                    │
   sahayak_llm (8004)               sahayak_ocr (8003)
   POST /extract                    POST /extract
   voice transcription cleanup      PDF → field list + coords
         │                                    │
         └──────────┬─────────────────────────┘
                    │
             sahayak_backend (5000)
             orchestrates both services
```

Both services share the same `AWS_BEARER_TOKEN_BEDROCK`.
Neither requires IAM users, access keys, or instance roles.
