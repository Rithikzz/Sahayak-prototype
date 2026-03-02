# SAHAYAK — Bank Kiosk & Admin System

A fully containerised, AI-powered self-service banking kiosk system for Indian bank branches. Customers fill out banking forms using voice or touch, guided by a multilingual assistant. A separate admin portal lets bank managers oversee kiosks, staff, submissions, and OTA updates.

---

## Quick Start

**Prerequisites:** Docker Engine, Docker Compose

```bash
docker compose up -d --build
```

| URL | What |
|-----|------|
| http://localhost | Kiosk frontend |
| http://localhost:8080 | Admin portal |
| http://localhost:5000/docs | Backend Swagger UI |

**Default credentials**
- Admin login: `admin@sahayak.com` / `admin123`
- Kiosk staff PIN: `1234`

---

## Architecture — 7 Containers

```
  Kiosk browser :80      ──▶  sahayak_frontend  (Nginx + React)  ─┐
  Admin browser :8080    ──▶  sahayak_admin     (Nginx + React)  ─┤
                                                                    ▼
                                              sahayak_backend  (FastAPI :5000)
                                                    │        │        │
                                              sahayak_db   stt:8001  tts:8002
                                              (Postgres)   Whisper   gTTS
                                                                      │
                                                                  ocr:8003
```

| Container | Port | Role |
|---|---|---|
| `sahayak_db` | 5432 | PostgreSQL 15 — persistent store |
| `sahayak_backend` | 5000 | FastAPI — all business logic + JWT auth |
| `sahayak_frontend` | 80 | Kiosk React UI (Nginx reverse proxy) |
| `sahayak_admin` | 8080 | Admin portal React UI (Nginx reverse proxy) |
| `sahayak_stt` | 8001 | Speech-to-Text (Whisper base) |
| `sahayak_tts` | 8002 | Text-to-Speech (gTTS, en/hi/ta) |
| `sahayak_ocr` | 8003 | OCR — physical document scanning |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Kiosk Frontend | React 18.2, React Router 6, CSS custom variables |
| Admin Frontend | React 18.2, TailwindCSS 3, Vite 4 |
| Backend API | Python 3.11, FastAPI, SQLAlchemy 2, Uvicorn |
| Database | PostgreSQL 15 (Alpine), psycopg2 |
| Auth | python-jose (JWT HS256), bcrypt — dual flows (staff 12h / admin 24h) |
| STT | OpenAI Whisper base model + ffmpeg |
| TTS | gTTS (Google Text-to-Speech), multilingual en/hi/ta |
| OCR | FastAPI + image processing |
| Orchestration | Docker Compose |
| Testing | Playwright + Chromium |

---

## Repository Structure

```
Sahayak--kiosk/
├── kiosk/               Kiosk React frontend (src/, index.html, vite.config.js, Dockerfile)
├── Sahayak_admin/       Admin portal React frontend
├── backend/             FastAPI Python backend (routes, models, DB)
├── microservices/
│   ├── stt/             Whisper STT microservice
│   ├── tts/             gTTS TTS microservice
│   └── ocr/             OCR microservice
├── tests/e2e/           Playwright test suites
├── docs/                Architecture, API reference, testing guide (7 files)
├── doc/                 Legacy markdown documents
├── scripts/             Setup and utility scripts
├── docker-compose.yml
├── package.json         Root — Playwright test runner only
└── playwright.config.js
```

---

## Kiosk User Flow

```
Welcome (language select)
  → Authentication (account number + PIN)
  → OTP Verification
  → Mode Selection  ─── PROTECTED (requires auth) ───
  → Service Selection (9 categories, loaded from DB)
  → Input (voice IVR or touch keypad, field by field)
  → Form Preview
  → Human Verification (staff PIN approval)
  → Success (submission saved to PostgreSQL)
```

**Voice IVR auto-advance:** TTS speaks each field → mic auto-activates → Whisper transcribes → next field, no screen touch needed.

---

## Admin Portal

Full management interface at `http://localhost:8080`:

- **Dashboard** — live KPI cards + charts (forms today, active kiosks, error rate)
- **Kiosks** — register and monitor kiosk devices by heartbeat status
- **Staff** — create staff, reset PINs, assign roles
- **Reports** — usage by service type, error trends, regional breakdown
- **OTA Updates** — push firmware/app updates to kiosks over the air
- **Forms & Templates** — visual field builder for all 9 form categories
- **Submissions** — browse and filter all form submissions
- **Admin Users** — manage admin accounts and roles
- **Settings** — system-wide configuration toggles

---

## Banking Form Categories

All 9 categories are stored in PostgreSQL and dynamically served to kiosks:

1. Account Opening Forms — savings, current, FD
2. Transaction Forms — deposit / withdrawal slips
3. Loan Application Forms — personal, home, vehicle, business
4. KYC Forms — identity & address verification
5. Service Request Forms — cheque books, ATM cards, contact updates
6. Transfer & Remittance Forms — RTGS / NEFT / inward remittance
7. Investment & Wealth Forms — mutual funds, insurance
8. Enquiry & Dispute Forms — complaints, statement requests
9. Closure & Nomination Forms — account closure, nominee updates

---

## Rebuilding Individual Services

```bash
# Rebuild kiosk frontend only
docker compose up -d --build frontend

# Rebuild admin panel only
docker compose up -d --build admin

# Rebuild backend only
docker compose up -d --build backend

# Rebuild everything
docker compose up -d --build
```

---

## Testing

```bash
npm install
npx playwright install chromium

# Kiosk connectivity + full UI walkthrough (14 tests)
npx playwright test tests/e2e/kiosk_walkthrough.spec.js --headed --project=chromium --reporter=list

# Admin UI walkthrough (48 checks)
npx playwright test tests/e2e/walkthrough.spec.js --headed --project=chromium --reporter=list

# Full admin API + UI test suite (66 tests)
npx playwright test tests/e2e/admin.spec.js --reporter=list
```

Latest results: **48 / 48** admin walkthrough, **14 / 14** kiosk connectivity — all passing.

---

## Documentation

Detailed docs are in the [`docs/`](docs/) folder:

| File | Contents |
|---|---|
| `docs/01_architecture.md` | ASCII system diagram, DB schema, auth flows, tech stack |
| `docs/02_running_app.md` | Docker commands, directory structure, env vars, debug tips |
| `docs/03_debugging_and_fixes.md` | All 12 bugs resolved — symptoms, root cause, fix |
| `docs/04_future_development.md` | Adding forms/languages, Whisper upgrade, production hardening |
| `docs/05_admin_portal.md` | All 9 admin pages, API calls, roles, audit logging |
| `docs/06_api_reference.md` | Complete endpoint reference for all routes |
| `docs/07_testing.md` | Test suites, results, selectors, debug guide |

---

## License

Proprietary — SAHAYAK Bank System

---

*Built with care for Indian banking customers 🇮🇳*
