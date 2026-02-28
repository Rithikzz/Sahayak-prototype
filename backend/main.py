from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import httpx

from api.database import engine, Base, get_db
from api.routes import auth, forms, voice
from api import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SAHAYAK Kiosk Core API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(forms.router, prefix="/api/forms", tags=["Forms"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice Integration (Proxy)"])

@app.get("/health")
def health_check():
    return {"status": "OK", "service": "Core API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
