import os
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
# Using "base" as requested for good accuracy vs resource mix
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

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...)):
    if not model:
        raise HTTPException(status_code=500, detail="Whisper model not initialized")

    # Save incoming audio to a temporary file for Whisper to read
    try:
        suffix = os.path.splitext(file.filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Transcribe
        result = model.transcribe(tmp_path)
        
        # Clean up
        os.unlink(tmp_path)
        
        return TranscriptionResponse(
            text=result["text"].strip(),
            language=result.get("language", "unknown")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "OK", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001)
