# SAHAYAK — AI-Powered Bank Kiosk & Admin System

[![Kiosk](https://img.shields.io/badge/Kiosk-Live-blue?style=for-the-badge)](https://acute-tue-samba-trust.trycloudflare.com)
[![Admin](https://img.shields.io/badge/Admin-Live-green?style=for-the-badge)](https://near-interview-surface-same.trycloudflare.com)

> A fully containerised, multilingual, AI-assisted self-service banking kiosk for Indian bank branches. Customers fill out banking forms using **voice or touch**, guided in English, Hindi, or Tamil. A separate admin portal gives bank managers full visibility and control over kiosks, staff, form templates, OTA updates, and submissions.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Environment Variables](#environment-variables)
- [Kiosk User Flow](#kiosk-user-flow)
- [Admin Portal](#admin-portal)
- [Banking Form Categories](#banking-form-categories)
- [API Reference](#api-reference)
- [AI / LLM Integration (AWS Bedrock)](#ai--llm-integration-aws-bedrock)
- [Rebuilding Services](#rebuilding-services)
- [EC2 Deployment](#ec2-deployment)
- [Testing](#testing)
- [Database Schema](#database-schema)
- [Documentation](#documentation)

---

## Quick Start

**Prerequisites:** Docker Engine ≥ 20.10, Docker Compose ≥ 2.0

```bash
git clone <repo-url>
cd Sahayak--kiosk
docker compose up -d --build
```

> First run downloads the Whisper base model — allow ~3 minutes.

| URL | What |
|-----|------|
| http://localhost | Kiosk frontend |
| http://localhost:8080 | Admin portal |
| http://localhost:5000/docs | Backend Swagger UI |
| http://localhost:5000/health | Backend health check |

**Default credentials**

| Role | Credential |
|------|-----------|
| Admin login | `admin@sahayak.com` / `admin123` |
| Kiosk staff PIN | `1234` |

---

## Architecture

```
  Kiosk browser :80      ──▶  sahayak_frontend  (Nginx + React)  ─┐
  Admin browser :8080    ──▶  sahayak_admin     (Nginx + React)  ─┤
                                                                    ▼
                                              sahayak_backend  (FastAPI :5000)
                                               │          │          │
                                          sahayak_db  stt:8001    tts:8002
                                          (Postgres)  Whisper      gTTS
                                                                      │
                                                                  ocr:8003
                                                                      │
                                                                  llm:8004
                                                                (AWS Bedrock)
```

### 8-Container Reference

| Container | Port | Role |
|---|---|---|
| `sahayak_db` | 5432 (host 5433) | PostgreSQL 15 — persistent store |
| `sahayak_backend` | 5000 | FastAPI — all business logic + JWT auth |
| `sahayak_frontend` | 80 | Kiosk React UI served by Nginx |
| `sahayak_admin` | 8080 | Admin portal React UI served by Nginx |
| `sahayak_stt` | 8001 | Speech-to-Text (OpenAI Whisper base) |
| `sahayak_tts` | 8002 | Text-to-Speech (gTTS, en/hi/ta) |
| `sahayak_ocr` | 8003 | OCR — scans physical document images |
| `sahayak_llm` | 8004 | LLM field extractor via AWS Bedrock |

Both Nginx containers forward all `/api/*` requests to `backend:5000` internally — the browser never needs to know the backend port.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Kiosk Frontend | React 18.2, React Router 6, CSS custom variables |
| Admin Frontend | React 18.2, TailwindCSS 3, Vite 4, Chart.js |
| Backend API | Python 3.11, FastAPI, SQLAlchemy 2, Uvicorn |
| Database | PostgreSQL 15-Alpine, psycopg2 |
| Auth | python-jose (JWT HS256), bcrypt — dual flows (staff 12 h / admin 24 h) |
| STT | OpenAI Whisper base model + ffmpeg |
| TTS | gTTS (Google Text-to-Speech), multilingual en / hi / ta |
| LLM | AWS Bedrock Converse API (`openai.gpt-oss-20b-1:0`) via httpx bearer token |
| OCR | FastAPI + image processing |
| Reverse Proxy | Nginx Alpine — static serve + `/api/*` proxy |
| Orchestration | Docker Engine + Docker Compose |
| Testing | Playwright (Node.js) + Chromium |

---

## Repository Structure

```
Sahayak--kiosk/
├── kiosk/                    Kiosk React frontend
│   └── src/
│       ├── App.jsx            Root router + OTA banner
│       ├── components/        All screen components (12 screens)
│       ├── context/
│       │   └── AppStateContext.jsx  Global state, API calls, heartbeat
│       └── data/
│           └── mockData.js    Translation strings (en / hi / ta)
├── Sahayak_admin/            Admin portal React frontend
│   └── src/
│       ├── App.jsx            Admin router (protected routes)
│       ├── pages/             Dashboard, Kiosks, Staff, Reports,
│       │                      Updates, FormsTemplates, Submissions,
│       │                      Users, Settings, Login
│       ├── components/        Layout, Sidebar, Header, Modal, Table…
│       ├── hooks/useAuth.jsx  Auth state hook
│       └── utils/apiClient.js Axios wrapper with auto JWT injection
├── backend/                  FastAPI Python backend
│   ├── main.py                App init, router registration, startup seed
│   ├── requirements.txt       Python dependencies
│   ├── Dockerfile             Python 3.11-slim + uvicorn
│   └── api/
│       ├── database.py        SQLAlchemy engine + session factory
│       ├── models.py          ORM models (10 tables)
│       └── routes/            12 route modules (auth, forms, voice,
│                              admin_auth, admin_users, admin_kiosks,
│                              admin_staff, admin_forms, admin_updates,
│                              admin_reports, admin_settings, pdf)
├── microservices/
│   ├── stt/                  Whisper STT — POST /transcribe
│   ├── tts/                  gTTS TTS   — POST /synthesize
│   ├── ocr/                  OCR        — POST /ocr
│   └── llm/                  Bedrock LLM — POST /extract
├── tests/e2e/                Playwright test suites (3 files)
├── docs/                     Project documentation (8 files)
├── doc/                      Legacy implementation notes
├── scripts/                  Setup and utility scripts
├── docker-compose.yml        Local development compose file
├── docker-compose.ec2.yml    Production EC2 compose file
├── package.json              Root — Playwright test runner only
└── playwright.config.js
```

---

## Environment Variables

All backend env vars are set in `docker-compose.yml`. Copy and override via `.env`:

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `supersecretkey_sahayak` | Staff JWT signing key |
| `ADMIN_JWT_SECRET` | `admin_supersecret_sahayak` | Admin JWT signing key |
| `ADMIN_EMAIL` | `admin@sahayak.com` | Seeded admin email |
| `ADMIN_PASSWORD` | `admin123` | Seeded admin password |
| `ENCRYPTION_KEY` | — | Optional data encryption key |
| `VITE_ENCRYPTION_KEY` | — | Build-time key for frontend encryption |
| `AWS_BEARER_TOKEN_BEDROCK` | — | **Required for LLM** — Bedrock long-term API key |
| `AWS_REGION` | `eu-north-1` | Bedrock AWS region |
| `BEDROCK_MODEL_ID` | `openai.gpt-oss-20b-1:0` | Bedrock model ID |
| `ALLOWED_ORIGINS` | `http://localhost,http://localhost:80,http://localhost:8080` | CORS origins |

---

## Kiosk User Flow

```
WelcomeScreen            PUBLIC  — language select (EN / HI / TA)
  └─▶ AuthenticationScreen  PUBLIC  — account number + 4-digit PIN
        └─▶ OTPVerificationScreen  PUBLIC  — 6-digit OTP (simulated)
              └─▶ AuthSuccessScreen  PUBLIC  — 3 s auto-advance
                    └─▶ ━━━━━━━━━━━━ PROTECTED (requires authPassed) ━━━━━━━━━━━━
                          ModeSelectionScreen  — Voice IVR / Touch / Assisted
                            └─▶ ServiceSelectionScreen  — 9 categories from DB
                                  └─▶ InputController  — one field at a time
                                        VOICE: TTS speaks → mic → Whisper → LLM extract
                                        TOUCH: on-screen keypad
                                        └─▶ FieldConfirmationScreen  — confirm/retry
                                              └─▶ FormPreviewScreen  — full form review
                                                    └─▶ HumanVerificationScreen
                                                          Staff PIN → POST /api/forms/submit
                                                          └─▶ SuccessScreen  — auto-reset
```

**Voice IVR auto-advance:** TTS speaks each field prompt → mic auto-activates (4 s window) → Whisper transcribes → LLM extracts clean value → next field. No screen touch required.

**Repeated-word deduplication:** A `_dedup_repeated()` regex collapses Whisper-repeated phrases (e.g. `"Deposit Deposit Deposit"` → `"Deposit"`) before the LLM call.

---

## Admin Portal

Full management interface at `http://localhost:8080` — login with `admin@sahayak.com` / `admin123`.

| Page | What it does |
|---|---|
| **Dashboard** | Live KPI cards (kiosks, forms today, error rate) + bar/line charts |
| **Kiosks** | Register devices, view heartbeat status (online = heartbeat < 2 min) |
| **Staff** | Create staff, set 4-digit PINs, assign roles, reset PINs |
| **Reports** | Usage by service, error trends, regional breakdown, submission history |
| **OTA Updates** | Create and push firmware/app update packages to kiosks |
| **Forms & Templates** | Visual field builder — add/edit/delete form templates live from DB |
| **Submissions** | Paginated list of all form submissions with filters |
| **Admin Users** | Manage admin accounts (email, role, region, permissions) |
| **Settings** | System-wide config toggles stored as JSON key-value in DB |

All admin API routes require a 24-hour Bearer JWT obtained from `POST /api/admin/auth/login`.

---

## Banking Form Categories

All 9 categories are seeded into PostgreSQL on first startup and served dynamically to kiosks:

| # | Category Key | Description |
|---|---|---|
| 1 | `accountOpeningForms` | Savings, current, FD account opening |
| 2 | `transactionForms` | Deposit / withdrawal slips |
| 3 | `loanApplicationForms` | Personal, home, vehicle, business loans |
| 4 | `kycForms` | Identity & address verification |
| 5 | `serviceRequestForms` | Cheque books, ATM cards, contact updates |
| 6 | `transferRemittanceForms` | RTGS / NEFT / inward remittance |
| 7 | `investmentWealthForms` | Mutual funds, insurance |
| 8 | `enquiryDisputeForms` | Complaints, statement requests |
| 9 | `closureNominationForms` | Account closure, nominee updates |

Templates are editable live in the admin portal under **Forms & Templates** with no redeploy required.

---

## API Reference

All routes served by `sahayak_backend` on port 5000. Full docs at `http://localhost:5000/docs`.

### Kiosk Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/staff-login` | None | `{ pin }` → `{ access_token, staff_name }` |

### Forms
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/forms/templates` | None | Returns keyed object of 9 form categories |
| POST | `/api/forms/submit` | Staff Bearer | Submit a completed form |

### Voice
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/voice/synthesize` | Staff Bearer | Form-data: `text`, `lang` → MP3 bytes |
| POST | `/api/voice/transcribe` | Staff Bearer | Form-data: `audio` (WebM) → `{ text, language }` |

### Kiosk Device
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/kiosk/pending-update` | None | `?device_id=` → update check |
| POST | `/api/kiosk/heartbeat` | None | Report device status, installed version |

### Admin Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/auth/login` | None | `{ email, password }` → `{ access_token, admin }` |
| GET | `/api/admin/auth/me` | Admin Bearer | Current admin user object |
| POST | `/api/admin/auth/logout` | Admin Bearer | Invalidate session |

### Admin Resources (all require Admin Bearer)
| Resource | Endpoints |
|---|---|
| Users | `GET/POST /api/admin/users`, `PUT/DELETE /api/admin/users/{id}` |
| Kiosks | `GET/POST /api/admin/kiosks`, `GET/PUT/DELETE /api/admin/kiosks/{id}` |
| Staff | `GET/POST /api/admin/staff`, `PUT/DELETE /api/admin/staff/{id}`, `POST /{id}/reset-pin` |
| Forms | `GET/POST /api/admin/forms`, `GET/PUT/DELETE /api/admin/forms/{id}`, `POST /forms/ocr` |
| Updates | `GET/POST /api/admin/updates`, `PUT/DELETE /{id}`, `POST /{id}/push` |
| Reports | `GET /api/admin/reports/kpi`, `/usage`, `/errors`, `/regions`, `/submissions` |
| Settings | `GET/PUT /api/admin/settings` |

### Internal Microservice Endpoints
| Service | Port | Endpoint | Description |
|---|---|---|---|
| STT | 8001 | `POST /transcribe` | WebM audio → `{ text, language }` |
| TTS | 8002 | `POST /synthesize` | `text + lang` → MP3 bytes |
| OCR | 8003 | `POST /ocr` | Image file → `{ text }` |
| LLM | 8004 | `POST /extract` | Raw STT text → cleaned field value |

---

## AI / LLM Integration (AWS Bedrock)

The LLM microservice (`sahayak_llm`, port 8004) uses **AWS Bedrock Converse API** to extract clean structured values from raw Whisper transcripts.

```
User speaks "ten thousand five hundred rupees"
        ↓  Whisper STT
"ten thousand five hundred rupees"
        ↓  POST /api/voice/transcribe  (backend deduplication applied)
        ↓  POST http://llm:8004/extract
           { field_label, field_type, raw_text, language }
        ↓  httpx → Bedrock  openai.gpt-oss-20b-1:0
        ↓
"10500"  →  kiosk field filled
```

- Timeout: 25 s — any failure falls back to raw STT text so the kiosk never blocks.
- LLM model: `openai.gpt-oss-20b-1:0` in `eu-north-1` (configurable via env vars).
- Authentication: long-term Bedrock bearer token (`AWS_BEARER_TOKEN_BEDROCK`).

To get a Bedrock bearer token: AWS Console → Amazon Bedrock → API keys → Generate long-term key.

---

## Rebuilding Services

```bash
# Rebuild a single service after code changes
docker compose up -d --build frontend
docker compose up -d --build admin
docker compose up -d --build backend
docker compose up -d --build stt
docker compose up -d --build llm

# Rebuild everything
docker compose up -d --build

# Stop all
docker compose down

# Stop and wipe database volume (WARNING: deletes all data)
docker compose down -v
```

---

## EC2 Deployment

A separate `docker-compose.ec2.yml` is provided for production deployment on AWS EC2:

```bash
docker compose -f docker-compose.ec2.yml up -d --build
```

Key differences from local:
- Ollama service removed; LLM routes entirely through AWS Bedrock.
- `AWS_BEARER_TOKEN_BEDROCK`, `AWS_REGION`, `BEDROCK_MODEL_ID` must be set in `.env`.
- Database port not exposed externally.
- `restart: unless-stopped` on all services.

---

## Testing

```bash
# Install dependencies (once)
npm install
npx playwright install chromium

# Run all test suites
npx playwright test --reporter=list
```

| Suite | File | Tests | Latest Result |
|---|---|---|---|
| Admin API + UI | `tests/e2e/admin.spec.js` | 66 | 61–66 / 66 |
| Admin UI walkthrough | `tests/e2e/walkthrough.spec.js` | 48 checks | **48 / 48** |
| Kiosk connectivity + UI | `tests/e2e/kiosk_walkthrough.spec.js` | 14 | **14 / 14** |

```bash
# Individual suites
npx playwright test tests/e2e/kiosk_walkthrough.spec.js --headed --project=chromium --reporter=list
npx playwright test tests/e2e/walkthrough.spec.js --headed --project=chromium --reporter=list
npx playwright test tests/e2e/admin.spec.js --reporter=list
```

The walkthrough tests verify the full admin portal (login → dashboard → all 9 pages → logout) and kiosk (language select → auth → OTP → mode → service → form input → submission).

---

## Database Schema

PostgreSQL 15 database `sahayak` — 10 tables:

| Table | Key Columns |
|---|---|
| `staff_users` | `id`, `pin_hash`, `name`, `role`, `created_at` |
| `customers` | `id`, `account_number` (UNIQUE), `phone` |
| `form_submissions` | `id`, `customer_id` (FK), `service_type`, `form_data` (JSON), `status` |
| `admin_users` | `id`, `email` (UNIQUE), `name`, `role`, `region`, `permissions` (JSON), `status` |
| `audit_logs` | `id`, `admin_user_id` (FK), `action`, `resource`, `detail` (JSON), `timestamp` |
| `kiosks` | `id`, `device_id` (UNIQUE), `branch_name`, `region`, `last_heartbeat`, `installed_version` |
| `form_template_metadata` | `id`, `name`, `category`, `version`, `status`, `field_definitions` (JSON) |
| `ota_updates` | `id`, `version`, `update_name`, `status`, `target` (JSON) |
| `system_settings` | `id`, `key` (UNIQUE), `value` (JSON) |

All tables are auto-created by SQLAlchemy on startup. Seed data (admin user, staff, form templates, default settings) is inserted on first boot.

---

## Documentation

| File | Contents |
|---|---|
| [docs/01_architecture.md](docs/01_architecture.md) | Full system diagram, DB schema, auth flows, container reference |
| [docs/02_running_app.md](docs/02_running_app.md) | Docker commands, directory structure, env vars, debug tips |
| [docs/03_debugging_and_fixes.md](docs/03_debugging_and_fixes.md) | All resolved bugs — symptoms, root cause, fix |
| [docs/04_future_development.md](docs/04_future_development.md) | Adding forms/languages, Whisper upgrade, production hardening |
| [docs/05_admin_portal.md](docs/05_admin_portal.md) | All 9 admin pages, API calls, roles, audit logging |
| [docs/06_api_reference.md](docs/06_api_reference.md) | Complete endpoint reference for all routes |
| [docs/07_testing.md](docs/07_testing.md) | Test suites, results, selectors, debug guide |
| [docs/08_bedrock_integration.md](docs/08_bedrock_integration.md) | AWS Bedrock LLM migration, deduplication fix, OCR changes |

---

## License

Proprietary — SAHAYAK Bank System

---

*Built for Indian banking customers 🇮🇳*
