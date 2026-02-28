# SAHAYAK Kiosk System Architecture

This document provides a high-level overview of the SAHAYAK Kiosk's microservices architecture. The system is designed for high availability, specialized AI voice workloads, and containerized deployment parity.

## The 5-Container Ecosystem

The SAHAYAK application relies on 5 independent Docker containers, orchestrated by Docker Compose:

### 1. Nginx Frontend (`sahayak_frontend`)
* **Role**: Serves the optimized Vite/React static assets to the kiosk client.
* **Network Strategy**: Exposes Port 80. Acts as the single entry point. Contains a Reverse Proxy (`/api/`) which seamlessly tunnels all API requests to the Python Backend, completely avoiding CORS setup and making development simple.

### 2. Python Core API (`sahayak_backend`)
* **Role**: The central "brain" connecting the frontend forms to database rows, user auth, and AI. Built with **FastAPI**.
* **Database interaction**: Connects to PostgreSQL using `psycopg2` + `SQLAlchemy` ORM. Handles JWT auth logic and `JSONB` serialization for forms.
* **Microservice interaction**: Proxies audio bytes to STT, proxies text strings to TTS. Uses asynchronous `httpx` to avoid waiting blocks.

### 3. Speech-to-Text (`sahayak_stt`)
* **Role**: The AI listener. Runs OpenAI's `whisper-base` model locally within Python.
* **Behavior**: Pre-loads the neural network straight into GPU/CPU memory on boot. Has `ffmpeg` installed via Dockerfile to decode incoming WebM microphone blobs. Transcribes bytes cleanly and returns JSON strings.

### 4. Text-to-Speech (`sahayak_tts`)
* **Role**: The Kiosk voice. Runs Google TTS (`gTTS`). 
* **Behavior**: Receives UI string prompts and requested languages (`en`, `hi`, `ta`), generates `.mp3` payloads dynamically, and streams them out.

### 5. PostgreSQL Database (`sahayak_db`)
* **Role**: Persistent Storage. Using `postgres:15-alpine`.
* **Behavior**: Uses a Docker volume map (`postgres_data`) to prevent losing form submissions across container restarts.

## System Diagram

```mermaid
graph TD
    User([Kiosk User/MIC]) -->|Port 80 HTTP| Nginx[Frontend: Nginx + React]
    
    Nginx -->|/assets/*| React(Static Files)
    Nginx -->|/api/* (Reverse Proxy)| FastAPI_Core[Backend: FastAPI Core]
    
    FastAPI_Core -->|Reads/Writes Form JSON| Postgres[(PostgreSQL DB)]
    
    FastAPI_Core -->|Sends generic text/lang| TTS[Microservice: Google TTS]
    TTS -->|Streams MP3 audio| FastAPI_Core
    
    FastAPI_Core -->|Forwards WebM audio blob| STT[Microservice: Whisper STT]
    STT -->|Returns pure text strings| FastAPI_Core
```

## Technical Debt / Important Notes
* The STT container uses `whisper-base` which heavily benefits from actual GPU compute instances in production. CPU processing (current state) runs fine but takes 1.5 - 2s to transcribe 5s clips.
* For actual banking deployment, ensure `JWT_SECRET` inside `docker-compose.yml` is rotated properly.
