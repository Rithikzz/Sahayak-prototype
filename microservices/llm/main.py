"""
LLM Field Extraction Microservice
POST /extract

Accepts raw STT transcript + field context.
Calls local Ollama (llama3.2:1b) to extract a clean, formatted field value.
Gracefully falls back to raw transcript if Ollama is unavailable or slow.
"""
import os
import httpx
import asyncio
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

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "llama3.2:1b-instruct-q4_K_M")
TIMEOUT_SECS = float(os.getenv("LLM_TIMEOUT", "8"))

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
# Pull model on startup (non-blocking, tolerates failure)
# --------------------------------------------------------------------------- #
@app.on_event("startup")
async def pull_model_on_startup():
    await asyncio.sleep(5)  # wait for Ollama container to be ready
    print(f"[LLM] Attempting to pull model {MODEL_NAME} …")
    try:
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/pull",
                json={"name": MODEL_NAME, "stream": False},
            )
            if resp.status_code == 200:
                print(f"[LLM] Model {MODEL_NAME} ready.")
            else:
                print(f"[LLM] Pull returned {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"[LLM] Could not pull model at startup (will retry on first request): {e}")


# --------------------------------------------------------------------------- #
# Main endpoint
# --------------------------------------------------------------------------- #
@app.post("/extract", response_model=ExtractResponse)
async def extract_field(req: ExtractRequest):
    """
    Extract a clean field value from raw STT transcript using Llama.
    Falls back to raw_text on any failure so the kiosk never blocks.
    """
    raw = req.raw_text.strip()

    # Trivially empty — don't bother the model
    if not raw:
        return ExtractResponse(extracted_value="", raw_text=raw, model_used="none")

    prompt = build_prompt(req.field_label, req.field_type, raw, req.language)

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECS) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "system": SYSTEM_PROMPT,
                    "stream": False,
                    "options": {
                        "temperature": 0.0,   # deterministic for form extraction
                        "num_predict": 50,    # short answers only
                    },
                },
            )

        if resp.status_code != 200:
            print(f"[LLM] Ollama error {resp.status_code}, falling back to raw text")
            return ExtractResponse(extracted_value=raw, raw_text=raw, model_used="fallback")

        result = resp.json()
        extracted = result.get("response", "").strip().strip('"').strip("'")
        print(f"[LLM] '{raw}' → '{extracted}' (field: {req.field_label})")

        # Safety: if model returns garbage/empty, fall back
        if not extracted:
            extracted = raw

        return ExtractResponse(extracted_value=extracted, raw_text=raw, model_used=MODEL_NAME)

    except (httpx.TimeoutException, httpx.ConnectError) as e:
        print(f"[LLM] Timeout/connection error, falling back: {e}")
        return ExtractResponse(extracted_value=raw, raw_text=raw, model_used="fallback")
    except Exception as e:
        print(f"[LLM] Unexpected error, falling back: {e}")
        return ExtractResponse(extracted_value=raw, raw_text=raw, model_used="fallback")


@app.get("/health")
def health():
    return {"status": "OK", "model": MODEL_NAME, "ollama_url": OLLAMA_URL}
