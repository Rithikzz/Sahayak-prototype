"""
LLM Field Extraction Microservice
POST /extract

Accepts raw STT transcript + field context.
Calls AWS Bedrock to extract a clean, formatted field value.
Gracefully falls back to raw transcript if Bedrock is unavailable or slow.
"""
import os
import json
import asyncio
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SAHAYAK LLM Field Extractor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AWS_REGION              = os.getenv("AWS_REGION", "eu-north-1")
AWS_BEARER_TOKEN_BEDROCK = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
BEDROCK_MODEL_ID        = os.getenv("BEDROCK_MODEL_ID", "openai.gpt-oss-20b-1:0")
TIMEOUT_SECS            = float(os.getenv("LLM_TIMEOUT", "25"))

BEDROCK_URL = (
    f"https://bedrock-runtime.{AWS_REGION}.amazonaws.com"
    f"/model/{BEDROCK_MODEL_ID}/converse"
)

# --------------------------------------------------------------------------- #
# Prompt templates per field type
# --------------------------------------------------------------------------- #
SYSTEM_PROMPT = (
    "You are a banking form assistant for Indian bank branches. "
    "Your only job is to extract a single clean field value from what a customer said. "
    "Reply with ONLY the extracted value — no explanation, no punctuation, no extra words. "
    "If the customer repeats the same word or phrase multiple times (e.g. 'Deposit Deposit Deposit'), "
    "treat it as a single utterance and return the value only once (e.g. 'Deposit'). "
    "If the value cannot be determined, reply with an empty string."
)

TYPE_INSTRUCTIONS = {
    "number": (
        "The field expects a number. "
        "Convert spoken numbers to digits (e.g. 'five thousand two fifty' → '5250'). "
        "Remove currency words like 'rupees'. "
        "Return only the numeric digits."
    ),
    "amount": (
        "The field expects a rupee amount as digits only. "
        "Convert spoken amounts (e.g. 'ten thousand five hundred' → '10500'). "
        "Return only digits, no symbols."
    ),
    "tel": (
        "The field expects a phone/account number. "
        "Return only the digits, no spaces or dashes."
    ),
    "date": (
        "The field expects a date. "
        "Format it as DD/MM/YYYY. "
        "If the customer says 'today' use today's context. "
        "Return only the formatted date."
    ),
    "text": (
        "The field expects a name or short text. "
        "Capitalise each word properly. "
        "Return only the extracted value."
    ),
    "default": (
        "The field expects a short value. "
        "Extract the most relevant part from what the customer said. "
        "Return only the extracted value."
    ),
}


def build_prompt(field_label: str, field_type: str, raw_text: str, language: str) -> str:
    type_key = field_type.lower() if field_type.lower() in TYPE_INSTRUCTIONS else "default"
    if "amount" in field_label.lower() or "figure" in field_label.lower():
        type_key = "amount"
    instruction = TYPE_INSTRUCTIONS[type_key]
    return (
        f"Field name: \"{field_label}\"\n"
        f"Customer said (in {language}): \"{raw_text}\"\n"
        f"{instruction}\n"
        f"Extracted value:"
    )


# --------------------------------------------------------------------------- #
# Request / Response models
# --------------------------------------------------------------------------- #
class ExtractRequest(BaseModel):
    field_label: str
    field_type: str = "text"
    raw_text: str
    language: str = "en"


class ExtractResponse(BaseModel):
    extracted_value: str
    raw_text: str
    model_used: str


# --------------------------------------------------------------------------- #
# Startup check
# --------------------------------------------------------------------------- #
@app.on_event("startup")
async def check_bedrock_on_startup():
    print(f"[LLM] Using AWS Bedrock model: {BEDROCK_MODEL_ID} in {AWS_REGION}")
    if not AWS_BEARER_TOKEN_BEDROCK:
        print("[LLM] WARNING: AWS_BEARER_TOKEN_BEDROCK not set — Bedrock calls will fail")
    else:
        print("[LLM] Bedrock bearer token loaded OK.")


# --------------------------------------------------------------------------- #
# Main endpoint
# --------------------------------------------------------------------------- #
@app.post("/extract", response_model=ExtractResponse)
async def extract_field(req: ExtractRequest):
    """
    Extract a clean field value from raw STT transcript using AWS Bedrock.
    Falls back to raw_text on any failure so the kiosk never blocks.
    """
    raw = req.raw_text.strip()

    # Trivially empty — don't bother the model
    if not raw:
        return ExtractResponse(extracted_value="", raw_text=raw, model_used="none")

    prompt = build_prompt(req.field_label, req.field_type, raw, req.language)

    try:
        extracted = await asyncio.wait_for(
            _call_bedrock(prompt),
            timeout=TIMEOUT_SECS,
        )

        extracted = extracted.strip().strip('"').strip("'")
        print(f"[LLM] '{raw}' → '{extracted}' (field: {req.field_label})")

        if not extracted:
            extracted = raw

        return ExtractResponse(extracted_value=extracted, raw_text=raw, model_used=BEDROCK_MODEL_ID)

    except asyncio.TimeoutError:
        print(f"[LLM] Bedrock timeout after {TIMEOUT_SECS}s, falling back")
        return ExtractResponse(extracted_value=raw, raw_text=raw, model_used="fallback")
    except Exception as e:
        print(f"[LLM] Bedrock error, falling back: {e}")
        return ExtractResponse(extracted_value=raw, raw_text=raw, model_used="fallback")


async def _call_bedrock(prompt: str) -> str:
    """Async Bedrock Converse call via HTTP bearer token auth."""
    headers = {
        "Authorization": f"Bearer {AWS_BEARER_TOKEN_BEDROCK}",
        "Content-Type": "application/json",
    }
    body = {
        "system": [{"text": SYSTEM_PROMPT}],
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"maxTokens": 50, "temperature": 0.0},
    }
    async with httpx.AsyncClient(timeout=TIMEOUT_SECS) as client:
        resp = await client.post(BEDROCK_URL, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
    return data["output"]["message"]["content"][0]["text"]


@app.get("/health")
def health():
    return {"status": "OK", "model": BEDROCK_MODEL_ID, "region": AWS_REGION}
