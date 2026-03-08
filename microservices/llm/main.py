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
import concurrent.futures
import boto3
from botocore.exceptions import ClientError, BotoCoreError
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

AWS_REGION          = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID   = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
BEDROCK_MODEL_ID    = os.getenv("BEDROCK_MODEL_ID", "openai.gpt-oss-20b-1:0")
TIMEOUT_SECS        = float(os.getenv("LLM_TIMEOUT", "25"))

def get_bedrock_client():
    return boto3.client(
        "bedrock-runtime",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )

# --------------------------------------------------------------------------- #
# Prompt templates per field type
# --------------------------------------------------------------------------- #
SYSTEM_PROMPT = (
    "You are a banking form assistant for Indian bank branches. "
    "Your only job is to extract a single clean field value from what a customer said. "
    "Reply with ONLY the extracted value — no explanation, no punctuation, no extra words. "
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
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        print("[LLM] WARNING: AWS credentials not set — set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
    else:
        print("[LLM] AWS credentials loaded OK.")


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
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            extracted = await asyncio.wait_for(
                loop.run_in_executor(pool, _call_bedrock, prompt),
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


def _call_bedrock(prompt: str) -> str:
    """Synchronous Bedrock Converse call (run in thread pool)."""
    client = get_bedrock_client()
    response = client.converse(
        modelId=BEDROCK_MODEL_ID,
        system=[{"text": SYSTEM_PROMPT}],
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={
            "maxTokens": 50,
            "temperature": 0.0,
        },
    )
    return response["output"]["message"]["content"][0]["text"]


@app.get("/health")
def health():
    return {"status": "OK", "model": BEDROCK_MODEL_ID, "region": AWS_REGION}
