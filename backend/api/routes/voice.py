from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import httpx
import os

router = APIRouter()

STT_SERVICE_URL = os.getenv("STT_SERVICE_URL", "http://stt:8001")
TTS_SERVICE_URL = os.getenv("TTS_SERVICE_URL", "http://tts:8002")
LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://llm:8004")


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    field_label: str = Form(default=""),
    field_type: str = Form(default="text"),
    language: str = Form(default="en"),
):
    """
    1. Forwards audio to Whisper STT microservice for transcription.
    2. If field_label is provided, passes raw transcript through Llama LLM
       to extract a clean, formatted value (e.g. spoken numbers → digits).
    3. Falls back to raw STT text if LLM is unavailable / times out.
    """
    try:
        audio_bytes = await audio.read()
        async with httpx.AsyncClient() as client:
            files = {"file": (audio.filename, audio_bytes, audio.content_type)}
            stt_resp = await client.post(
                f"{STT_SERVICE_URL}/transcribe", files=files, timeout=30.0
            )
            if stt_resp.status_code != 200:
                raise HTTPException(status_code=stt_resp.status_code, detail="STT Service Error")

            stt_data = stt_resp.json()
            raw_text = (stt_data.get("text") or "").strip()
            detected_language = stt_data.get("language", language)

        # ── LLM extraction (best-effort) ─────────────────────────────────────
        extracted_text = raw_text
        model_used = "stt_only"

        if raw_text and field_label:
            try:
                async with httpx.AsyncClient() as client:
                    llm_resp = await client.post(
                        f"{LLM_SERVICE_URL}/extract",
                        json={
                            "field_label": field_label,
                            "field_type": field_type,
                            "raw_text": raw_text,
                            "language": detected_language,
                        },
                        timeout=30.0,
                    )
                if llm_resp.status_code == 200:
                    llm_data = llm_resp.json()
                    extracted_text = llm_data.get("extracted_value") or raw_text
                    model_used = llm_data.get("model_used", "llm")
            except Exception as llm_err:
                # LLM failure is non-fatal — raw STT text is still useful
                print(f"[VOICE] LLM extraction failed (using raw STT): {llm_err}")

        return {
            "text": extracted_text,
            "raw_text": raw_text,
            "language": detected_language,
            "model_used": model_used,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/synthesize")
async def synthesize_speech(text: str = Form(...), lang: str = Form("en")):
    """Proxies text from kiosk frontend to the Python Google TTS microservice"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TTS_SERVICE_URL}/synthesize",
                data={"text": text, "lang": lang},
                timeout=15.0
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="TTS Service Error")

            return StreamingResponse(
                response.iter_bytes(),
                media_type="audio/mpeg",
                headers={"Content-Disposition": "attachment; filename=speech.mp3"},
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/synthesize")
async def synthesize_speech(text: str = Form(...), lang: str = Form("en")):
    """Proxies text from kiosk frontend to the Python Google TTS microservice"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TTS_SERVICE_URL}/synthesize", 
                data={"text": text, "lang": lang},
                timeout=15.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="TTS Service Error")
                
            # Stream the audio response back to the client
            return StreamingResponse(
                response.iter_bytes(),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": f"attachment; filename=speech.mp3"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
