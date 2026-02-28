from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import httpx
import os

router = APIRouter()

STT_SERVICE_URL = os.getenv("STT_SERVICE_URL", "http://stt:8001")
TTS_SERVICE_URL = os.getenv("TTS_SERVICE_URL", "http://tts:8002")

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Proxies audio blob from kiosk frontend to the Python Whisper STT microservice"""
    try:
        audio_bytes = await audio.read()
        async with httpx.AsyncClient() as client:
            # We must pass the bytes explicitly because passing SpooledTemporaryFile directly 
            # to httpx can result in 0-byte uploads without explicit read/seek.
            files = {'file': (audio.filename, audio_bytes, audio.content_type)}
            response = await client.post(f"{STT_SERVICE_URL}/transcribe", files=files, timeout=30.0)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="STT Service Error")
                
            return response.json()
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
