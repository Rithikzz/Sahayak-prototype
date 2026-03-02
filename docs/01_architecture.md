# SAHAYAK Kiosk System — Architecture

## Overview

SAHAYAK is a fully containerised banking kiosk system built for Indian bank branches.
It allows customers with low digital literacy to fill out banking forms using voice or
touch input, guided by an AI‑powered multilingual assistant.  A separate admin portal
lets bank managers manage kiosks, staff, form templates, OTA updates, and submissions.

---

## 7-Container Docker Architecture

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           SAHAYAK SYSTEM                                    ║
║                        docker compose up -d                                  ║
║                                                                              ║
║  ┌─────────────────┐  Port 80    ┌──────────────────────────────────────┐   ║
║  │  Kiosk Browser  │────────────▶│  sahayak_frontend  (Nginx + React)   │   ║
║  │  http://        │             │  /assets/* → React static files      │   ║
║  │  localhost      │             │  /api/*    → proxy → backend:5000    │   ║
║  └─────────────────┘             └─────────────────┬────────────────────┘   ║
║                                                    │                        ║
║  ┌─────────────────┐  Port 8080  ┌────────────────────────────────────────┐ ║
║  │  Admin Browser  │────────────▶│  sahayak_admin  (Nginx + React)        │ ║
║  │  http://        │             │  /assets/* → React static files        │ ║
║  │  localhost:8080 │             │  /api/*    → proxy → backend:5000      │ ║
║  └─────────────────┘             └─────────────────┬──────────────────────┘ ║
║                                                    │                        ║
║                              ┌─────────────────────▼──────────────────────┐ ║
║                              │  sahayak_backend  (FastAPI / Uvicorn)       │ ║
║                              │  Port 5000                                  │ ║
║                              │  • JWT auth  (staff 12h + admin 24h)        │ ║
║                              │  • SQLAlchemy ORM                           │ ║
║                              │  • Kiosk routes + Admin routes              │ ║
║                              │  • Startup seed (admin, templates, settings)│ ║
║                              └────────┬──────────┬───────────┬─────────────┘ ║
║                                       │          │           │               ║
║                  ┌────────────────────▼──┐  ┌───▼───┐  ┌───▼──────────┐    ║
║                  │  sahayak_db           │  │  stt  │  │  tts  + ocr  │    ║
║                  │  PostgreSQL 15-alpine  │  │ :8001 │  │ :8002  :8003 │    ║
║                  │  Port 5432             │  │Whisper│  │gTTS + OCR    │    ║
║                  │  Volume: postgres_data │  │ base  │  │              │    ║
║                  └───────────────────────┘  └───────┘  └──────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Container Reference

| Container           | Build Source          | Port | Role                                    |
|---------------------|-----------------------|------|-----------------------------------------|
| `sahayak_db`        | `postgres:15-alpine`  | 5432 | Persistent relational store             |
| `sahayak_backend`   | `./backend`           | 5000 | FastAPI — all business logic + auth     |
| `sahayak_frontend`  | `.` (root Dockerfile) | 80   | Kiosk React UI served by Nginx          |
| `sahayak_admin`     | `./Sahayak_admin`     | 8080 | Admin portal React UI served by Nginx   |
| `sahayak_stt`       | `./microservices/stt` | 8001 | Speech-to-Text (Whisper base)           |
| `sahayak_tts`       | `./microservices/tts` | 8002 | Text-to-Speech (gTTS, en/hi/ta)         |
| `sahayak_ocr`       | `./microservices/ocr` | 8003 | OCR — scans physical document images    |

---

## Kiosk User Flow (ASCII)

```
  CUSTOMER AT KIOSK  http://localhost
  ════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────┐
  │  WelcomeScreen  (PUBLIC)            │
  │  Select Language: EN / HI / TA      │
  │  "Touch to Start"                   │
  └──────────────────┬──────────────────┘
                     │
  ┌──────────────────▼──────────────────┐
  │  AuthenticationScreen  (PUBLIC)     │
  │  Enter Account Number (≥10 digits)  │
  │  Enter 4-digit PIN                  │
  │  → POST /api/auth/staff-login       │
  └──────────────────┬──────────────────┘
                     │
  ┌──────────────────▼──────────────────┐
  │  OTPVerificationScreen  (PUBLIC)    │
  │  6-digit OTP (simulated verify)     │
  │  setAuthPassed(true)  ← gate opens  │
  └──────────────────┬──────────────────┘
                     │ 3s auto-advance
  ┌──────────────────▼──────────────────┐
  │  AuthSuccessScreen  (PUBLIC)        │
  │  "Authentication Successful!"       │
  └──────────────────┬──────────────────┘
                     │ 3s auto-advance
  ╔══════════════════▼═══════════════════╗  ← ProtectedRoute gate
  ║  ModeSelectionScreen  (PROTECTED)   ║
  ║  Voice + IVR  /  Touch  /  Assisted ║
  ╚══════════════════╦═══════════════════╝
                     ║
  ╔══════════════════▼═══════════════════╗
  ║  ServiceSelectionScreen (PROTECTED) ║
  ║  9 service categories               ║
  ║  → GET /api/forms/templates         ║
  ╚══════════════════╦═══════════════════╝
                     ║
  ╔══════════════════▼═══════════════════╗
  ║  InputController  (PROTECTED)       ║
  ║  One field at a time                ║
  ║  VOICE: TTS → open mic → STT        ║
  ║    POST /api/voice/synthesize       ║
  ║    POST /api/voice/transcribe       ║
  ║  TOUCH: on-screen keypad            ║
  ╚══════════════════╦═══════════════════╝
                     ║
  ╔══════════════════▼═══════════════════╗
  ║  FieldConfirmationScreen (PROTECTED)║
  ║  Review single field, confirm/retry ║
  ╚══════════════════╦═══════════════════╝
                     ║
  ╔══════════════════▼═══════════════════╗
  ║  FormPreviewScreen  (PROTECTED)     ║
  ║  Full form summary before submit    ║
  ╚══════════════════╦═══════════════════╝
                     ║
  ╔══════════════════▼═══════════════════╗
  ║  HumanVerificationScreen (PROTECTED)║
  ║  Staff enters 4-digit PIN           ║
  ║  → POST /api/forms/submit           ║
  ║    { service_type, form_data,       ║
  ║      staff_pin, account_number }    ║
  ║  Authorization: Bearer <staff JWT>  ║
  ╚══════════════════╦═══════════════════╝
                     ║
  ╔══════════════════▼═══════════════════╗
  ║  SuccessScreen  (PROTECTED)         ║
  ║  Auto-reset state after session     ║
  ╚══════════════════════════════════════╝
```

---

## Admin Portal Flow (ASCII)

```
  BANK MANAGER  http://localhost:8080
  ════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────┐
  │  Login Page  (PUBLIC)               │
  │  Email + Password                   │
  │  → POST /api/admin/auth/login       │
  │  ← 24hr Admin JWT                   │
  └──────────────────┬──────────────────┘
                     │
  ╔══════════════════▼═══════════════════╗  ← ProtectedRoute (admin JWT)
  ║  Layout (Sidebar + Header)          ║
  ║                                     ║
  ║  ┌─────────┐  Sidebar navigation:   ║
  ║  │ Sahayak │  • Dashboard           ║
  ║  │ (brand) │  • Kiosks              ║
  ║  │         │  • Staff               ║
  ║  │         │  • Reports             ║
  ║  │         │  • OTA Updates         ║
  ║  │         │  • Forms & Templates   ║
  ║  │         │  • Submissions         ║
  ║  │         │  • Admin Users         ║
  ║  └─────────┘  • Settings            ║
  ╚══════════════════════════════════════╝
            │
            ├─▶ Dashboard    → GET /reports/kpi, /reports/usage, /reports/errors
            ├─▶ Kiosks       → GET /admin/kiosks   (live status via heartbeat)
            ├─▶ Staff        → GET /admin/staff     CRUD staff + PIN reset
            ├─▶ Reports      → GET /reports/usage, /errors, /regions, /submissions
            ├─▶ OTA Updates  → GET/POST /admin/updates  push firmware/app updates
            ├─▶ Forms        → GET/POST/PUT /admin/forms  visual field builder
            ├─▶ Submissions  → GET /admin/reports/submissions  filter + search
            ├─▶ Admin Users  → GET/POST /admin/users  manage admin accounts
            └─▶ Settings     → GET/PUT /admin/settings  system configuration
```

---

## API Request Flow

```
  BROWSER (kiosk port 80 or admin port 8080)
       │
       │  fetch('/api/forms/templates')
       │  All requests use relative paths — no hardcoded backend URLs
       │
       ▼
  NGINX (inside Docker container)
       │
       │  location /api/ {
       │      proxy_pass http://backend:5000/api/;
       │      proxy_set_header Host $host;
       │  }
       │
       ▼
  FASTAPI BACKEND  (backend:5000, internal)
       │
       ├──── SQLAlchemy ORM ──────────▶ PostgreSQL (db:5432)
       │     models.py: StaffUser, Customer, FormSubmission,
       │     AdminUser, Kiosk, FormTemplateMetadata,
       │     OTAUpdate, SystemSetting, AuditLog
       │
       ├──── httpx async ─────────────▶ STT (stt:8001)
       │     POST /transcribe
       │     body: WebM audio blob
       │     response: { text, language }
       │
       ├──── httpx async ─────────────▶ TTS (tts:8002)
       │     POST /synthesize
       │     body: { text, lang }
       │     response: MP3 audio bytes
       │
       └──── httpx async ─────────────▶ OCR (ocr:8003)
             POST /ocr
             body: image file
             response: extracted text
```

---

## Database Schema

```
  DATABASE: sahayak  (PostgreSQL 15)
  ══════════════════════════════════════════════════════════════

  staff_users
  ┌──────┬──────────┬──────────┬──────────┬────────────┐
  │ id   │pin_hash  │ name     │ role     │ created_at │
  │ PK   │VARCHAR   │ VARCHAR  │ VARCHAR  │ TIMESTAMP  │
  └──────┴──────────┴──────────┴──────────┴────────────┘

  customers ──── 1:N ───▶ form_submissions
  ┌──────┬────────────────┬──────────┐     ┌──────┬─────────────┬────────────┬──────────┬────────┐
  │ id   │account_number  │ phone    │     │ id   │ customer_id │service_type│form_data │ status │
  │ PK   │UNIQUE VARCHAR  │ VARCHAR  │     │ PK   │ FK→customers│ VARCHAR    │ JSON     │VARCHAR │
  └──────┴────────────────┴──────────┘     └──────┴─────────────┴────────────┴──────────┴────────┘

  admin_users
  ┌──────┬─────────────┬──────────┬──────────────┬──────────┬────────────┬────────┐
  │ id   │ email       │ name     │ role         │ region   │permissions │ status │
  │ PK   │ UNIQUE      │ VARCHAR  │ VARCHAR(50)  │ VARCHAR  │ JSON array │VARCHAR │
  └──────┴─────────────┴──────────┴──────────────┴──────────┴────────────┴────────┘
         │ 1:N
         ▼
  audit_logs
  ┌──────┬──────────────┬────────────┬───────────┬──────────┬────────────┐
  │ id   │admin_user_id │ action     │ resource  │ detail   │ timestamp  │
  │ PK   │ FK→admin     │ VARCHAR    │ VARCHAR   │ JSON     │ TIMESTAMP  │
  └──────┴──────────────┴────────────┴───────────┴──────────┴────────────┘

  kiosks
  ┌──────┬───────────┬─────────────┬─────────┬────────────────┬────────────────┐
  │ id   │ device_id │ branch_name │ region  │ last_heartbeat │installed_version│
  │ PK   │ UNIQUE    │ VARCHAR     │ VARCHAR │ TIMESTAMP      │ VARCHAR         │
  └──────┴───────────┴─────────────┴─────────┴────────────────┴─────────────────┘

  form_template_metadata
  ┌──────┬──────┬──────────┬─────────┬──────────┬──────────────────────┐
  │ id   │ name │ category │ version │ status   │ field_definitions    │
  │ PK   │ STR  │ VARCHAR  │ INT     │ VARCHAR  │ JSON array of fields │
  └──────┴──────┴──────────┴─────────┴──────────┴──────────────────────┘

  ota_updates
  ┌──────┬─────────┬─────────────┬──────────┬──────────┐
  │ id   │ version │ update_name │ status   │ target   │
  │ PK   │ VARCHAR │ VARCHAR     │ VARCHAR  │ JSON     │
  └──────┴─────────┴─────────────┴──────────┴──────────┘

  system_settings
  ┌──────┬──────────────┬─────────────────┐
  │ id   │ key          │ value           │
  │ PK   │ VARCHAR UNIQ │ JSON            │
  └──────┴──────────────┴─────────────────┘
```

---

## Authentication Flows

```
  ┌─────────────────────────────────────────────────────────────────┐
  │  FLOW 1 — Kiosk Staff Auth  (12-hour JWT)                       │
  │                                                                 │
  │  Kiosk UI                Backend                  DB            │
  │     │                       │                     │            │
  │     │ POST /api/auth/        │                     │            │
  │     │   staff-login          │                     │            │
  │     │  { pin: "1234" }       │                     │            │
  │     │──────────────────────▶│                     │            │
  │     │                       │ SELECT * FROM        │            │
  │     │                       │ staff_users ────────▶│            │
  │     │                       │ bcrypt.checkpw()     │            │
  │     │                       │◀────────────────────│            │
  │     │◀──────────────────────│                     │            │
  │     │ { access_token,        │                     │            │
  │     │   staff_name }         │                     │            │
  │     │                       │                     │            │
  │     │ Store in localStorage  │                     │            │
  │     │ Use as Bearer token    │                     │            │
  │     │ on /api/forms/submit   │                     │            │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │  FLOW 2 — Admin Portal Auth  (24-hour JWT)                      │
  │                                                                 │
  │  Admin UI               Backend                    DB           │
  │     │                      │                       │           │
  │     │ POST /api/admin/      │                       │           │
  │     │   auth/login          │                       │           │
  │     │  { email, password }  │                       │           │
  │     │─────────────────────▶│                       │           │
  │     │                      │ SELECT FROM admin_users│           │
  │     │                      │ bcrypt.checkpw() ─────▶│           │
  │     │                      │◀──────────────────────│           │
  │     │◀─────────────────────│                       │           │
  │     │ { access_token, admin }                       │           │
  │     │                      │                       │           │
  │     │ Store in localStorage │                       │           │
  │     │ apiClient auto-injects│                       │           │
  │     │ Bearer on all /admin/ │                       │           │
  │     │ requests              │                       │           │
  └─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer           | Technology                                    |
|-----------------|-----------------------------------------------|
| Kiosk Frontend  | React 18.2, React Router 6, CSS custom vars   |
| Admin Frontend  | React 18.2, TailwindCSS 3, Vite 4, Chart.js   |
| Backend API     | Python 3.11, FastAPI, SQLAlchemy 2, Uvicorn   |
| Database        | PostgreSQL 15 (Alpine), psycopg2              |
| Auth            | python-jose (JWT HS256), bcrypt               |
| STT             | OpenAI Whisper (base model), ffmpeg           |
| TTS             | gTTS (Google Text-to-Speech, en/hi/ta)        |
| OCR             | FastAPI + image processing (ocr:8003)         |
| Container Orch  | Docker Engine + Docker Compose                |
| Reverse Proxy   | Nginx (Alpine) — static serve + /api proxy    |
| Testing         | Playwright (Node.js), Chromium                |
