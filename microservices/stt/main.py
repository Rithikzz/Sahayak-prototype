import os
import subprocess
import tempfile
import whisper
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SAHAYAK STT Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model into memory defensively on startup
print("Loading Whisper model (base)...")
try:
    model = whisper.load_model("base")
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None


class TranscriptionResponse(BaseModel):
    text: str
    language: str


def convert_to_wav(input_path: str) -> str:
    """
    Convert any audio format (webm, ogg, mp4, etc.) to a 16 kHz mono PCM WAV
    that Whisper can reliably decode.  Browser MediaRecorder webm/ogg streams
    often lack a valid duration header, which causes Whisper's internal ffmpeg
    decoder to return empty results; an explicit conversion step fixes that.
    """
    wav_path = input_path + "_converted.wav"
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-ar", "16000",   # 16 kHz sample rate — Whisper native
        "-ac", "1",       # mono
        "-f", "wav",
        wav_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[STT] ffmpeg conversion warning: {result.stderr[-300:]}")
        # Fall back to original file if conversion fails
        return input_path
    size = os.path.getsize(wav_path)
    print(f"[STT] converted to WAV, size={size} bytes")
    return wav_path


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...)):
    if not model:
        raise HTTPException(status_code=500, detail="Whisper model not initialized")

    raw_path = None
    wav_path = None
    try:
        # 1. Save the incoming blob (webm/ogg/mp4 — whatever the browser sent)
        suffix = os.path.splitext(file.filename or "")[1] or ".webm"
        raw_bytes = await file.read()
        print(f"[STT] received audio: {len(raw_bytes)} bytes, content_type={file.content_type}")

        if len(raw_bytes) < 100:
            print("[STT] audio too small, returning empty")
            return TranscriptionResponse(text="", language="unknown")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(raw_bytes)
            raw_path = tmp.name

        # 2. Convert to clean 16 kHz mono WAV — critical for browser webm streams
        wav_path = convert_to_wav(raw_path)

        # 3. Transcribe with fp16=False (CPU-only host)
        result = model.transcribe(wav_path, fp16=False)
        text = result["text"].strip()
        lang = result.get("language", "unknown")
        print(f"[STT] transcribed: lang={lang}, text={repr(text)}")

        return TranscriptionResponse(text=text, language=lang)

    except Exception as e:
        print(f"[STT] transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        for p in [raw_path, wav_path]:
            if p and p != raw_path and os.path.exists(p):
                os.unlink(p)
        if raw_path and os.path.exists(raw_path):
            os.unlink(raw_path)

@app.get("/health")
def health_check():
    return {"status": "OK", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001)
