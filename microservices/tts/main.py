import os
import tempfile
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from gtts import gTTS

app = FastAPI(title="SAHAYAK TTS Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/synthesize")
async def synthesize(text: str = Form(...), lang: str = Form("en")):
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    try:
        # Create a temporary file to save the MP3
        fd, temp_path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd) # Close the file descriptor so gTTS can write to it
        
        # Generate speech
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(temp_path)
        
        return FileResponse(
            temp_path, 
            media_type="audio/mpeg", 
            filename="speech.mp3",
            # We don't automatically delete the background task in simple FileResponse, 
            # ideally we'd use a background task to cleanup the file after sending.
            # But in a containerized stateless microservice, periodic cleanups handles temp space.
        )
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "OK", "service": "Google TTS Wrapper"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002)
