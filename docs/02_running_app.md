# Running, Building & Developing SAHAYAK

## Prerequisites

- Docker Engine ≥ 20.10
- Docker Compose ≥ 2.0
- Node.js ≥ 18 (only for running Playwright tests locally)
- No Python needed on your host — everything runs inside containers

---

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd Sahayak--kiosk

# Build and start all 7 containers (first run takes ~3 min for Whisper download)
docker compose up -d --build

# Check all containers are healthy
docker compose ps

# Follow logs from backend
docker logs -f sahayak_backend

# Follow logs from all containers
docker compose logs -f
```

Once running:

| URL                        | What it is                  |
|----------------------------|-----------------------------|
| http://localhost           | Kiosk frontend (port 80)    |
| http://localhost:8080      | Admin portal (port 8080)    |
| http://localhost:5000/docs | FastAPI Swagger UI           |
| http://localhost:5000/health | Backend health check       |

Default admin credentials: `admin@sahayak.com` / `admin123`  
Default kiosk staff PIN: `1234`

---

## Container Build Commands

Rebuild only what you changed:

```bash
# Rebuild just the kiosk frontend (after changes in /src/)
docker compose up -d --build frontend

# Rebuild just the admin panel (after changes in /Sahayak_admin/src/)
docker compose up -d --build admin

# Rebuild just the backend (after changes in /backend/)
docker compose up -d --build backend

# Rebuild everything from scratch
docker compose up -d --build

# Stop all containers
docker compose down

# Stop and destroy volumes (WARNING: deletes all DB data)
docker compose down -v
```

---

## Project Directory Structure

```
Sahayak--kiosk/
│
├── src/                            Kiosk React frontend source
│   ├── App.jsx                     Root router + OTA banner
│   ├── main.jsx                    React DOM entry point
│   ├── App.css / styles.css        Global kiosk CSS (CSS variables)
│   ├── components/
│   │   ├── WelcomeScreen.jsx       Language selection (PUBLIC)
│   │   ├── AuthenticationScreen.jsx Account + PIN entry (PUBLIC)
│   │   ├── OTPVerificationScreen.jsx 6-digit OTP entry (PUBLIC)
│   │   ├── AuthSuccessScreen.jsx   Post-OTP success (PUBLIC)
│   │   ├── ModeSelectionScreen.jsx Voice/Touch/Assisted (PROTECTED)
│   │   ├── ServiceSelectionScreen.jsx 9 service categories (PROTECTED)
│   │   ├── InputController.jsx     Field input + voice/touch (PROTECTED)
│   │   ├── FieldConfirmationScreen.jsx Per-field confirm (PROTECTED)
│   │   ├── FormPreviewScreen.jsx   Full form review (PROTECTED)
│   │   ├── HumanVerificationScreen.jsx Staff PIN approval (PROTECTED)
│   │   ├── VoiceVerificationScreen.jsx Voice approval path (PROTECTED)
│   │   ├── SuccessScreen.jsx       Session complete (PROTECTED)
│   │   └── ProtectedRoute.jsx      Auth guard (checks authPassed)
│   ├── context/
│   │   └── AppStateContext.jsx     Global state + API calls + heartbeat
│   └── data/
│       └── mockData.js             Translation strings (en/hi/ta)
│
├── Sahayak_admin/                  Admin portal React frontend
│   └── src/
│       ├── App.jsx                 Admin router (protected routes)
│       ├── pages/
│       │   ├── Login.jsx           Admin login page
│       │   ├── Dashboard.jsx       KPI cards + charts
│       │   ├── Kiosks.jsx          Device status + management
│       │   ├── Staff.jsx           Staff CRUD + PIN reset
│       │   ├── Reports.jsx         Usage/error/region charts
│       │   ├── Updates.jsx         OTA update management
│       │   ├── FormsTemplates.jsx  Form builder with field editor
│       │   ├── Submissions.jsx     Submissions browser + filter
│       │   ├── Users.jsx           Admin user management
│       │   └── Settings.jsx        System settings config
│       ├── components/
│       │   ├── Layout.jsx          Sidebar + Header container
│       │   ├── Sidebar.jsx         Navigation menu
│       │   ├── Header.jsx          Top bar + user info
│       │   ├── Modal.jsx           Reusable dialog component
│       │   ├── Button.jsx          Styled button component
│       │   ├── Badge.jsx           Status badge component
│       │   ├── KPICard.jsx         Dashboard metric card
│       │   └── Table.jsx           Reusable sortable table
│       ├── hooks/
│       │   └── useAuth.jsx         Auth state hook
│       └── utils/
│           └── apiClient.js        Axios wrapper with JWT injection
│
├── backend/                        FastAPI Python backend
│   ├── main.py                     App init, routers, startup seed
│   ├── requirements.txt            Python dependencies
│   ├── Dockerfile                  Python 3.11-slim + uvicorn
│   └── api/
│       ├── database.py             SQLAlchemy engine + session
│       ├── models.py               All ORM models
│       └── routes/
│           ├── auth.py             POST /api/auth/staff-login
│           ├── forms.py            GET /api/forms/templates, POST /api/forms/submit
│           ├── voice.py            POST /api/voice/synthesize, /transcribe
│           ├── admin_auth.py       Admin login + JWT helpers
│           ├── admin_users.py      Admin user CRUD
│           ├── admin_kiosks.py     Kiosk management + heartbeat
│           ├── admin_staff.py      Staff CRUD + PIN management
│           ├── admin_forms.py      Form template CRUD + OCR integration
│           ├── admin_updates.py    OTA update management
│           ├── admin_reports.py    KPI, usage, error, region reports
│           └── admin_settings.py  System settings CRUD
│
├── microservices/
│   ├── stt/                        Speech-to-Text (Whisper base)
│   │   ├── main.py                 FastAPI POST /transcribe
│   │   ├── requirements.txt        openai-whisper, ffmpeg-python
│   │   └── Dockerfile
│   ├── tts/                        Text-to-Speech (gTTS)
│   │   ├── main.py                 FastAPI POST /synthesize
│   │   ├── requirements.txt        gTTS
│   │   └── Dockerfile
│   └── ocr/                        OCR (image text extraction)
│       ├── main.py                 FastAPI POST /ocr
│       ├── requirements.txt
│       └── Dockerfile
│
├── tests/
│   └── e2e/
│       ├── admin.spec.js           66 admin API + UI tests
│       ├── walkthrough.spec.js     Admin UI walkthrough (48 checks)
│       └── kiosk_walkthrough.spec.js  Kiosk connectivity (14 tests)
│
├── docker-compose.yml              7-service orchestration config
├── Dockerfile                      Kiosk frontend Docker build
├── vite.config.js                  Vite config (dev proxy → localhost:5000)
├── package.json                    Node dependencies + Playwright
└── playwright.config.js            Test runner configuration
```

---

## Running the Tests

All tests use Playwright with Chromium. Node.js must be installed on the host.

```bash
# Install Node dependencies (first time only)
cd /home/lebi/projects/allen/Sahayak--kiosk
npm install
npx playwright install chromium

# ── Admin API tests (headless, fast)
npx playwright test tests/e2e/admin.spec.js --reporter=list

# ── Admin UI walkthrough (headed — opens browser window)
npx playwright test tests/e2e/walkthrough.spec.js --headed --project=chromium --reporter=list

# ── Kiosk connectivity + UI walkthrough (headed)
npx playwright test tests/e2e/kiosk_walkthrough.spec.js --headed --project=chromium --reporter=list

# ── Run all tests
npx playwright test --reporter=list

# ── Run with HTML report
npx playwright test --reporter=html
npx playwright show-report
```

Expected results:
- `admin.spec.js` — 61–66 passing
- `walkthrough.spec.js` — 48 / 48 passing
- `kiosk_walkthrough.spec.js` — 14 / 14 passing

---

## Environment Variables (docker-compose.yml)

| Variable          | Default                       | Description                   |
|-------------------|-------------------------------|-------------------------------|
| `DB_USER`         | `postgres`                    | PostgreSQL user               |
| `DB_PASSWORD`     | `postgres`                    | PostgreSQL password           |
| `DB_HOST`         | `db`                          | PostgreSQL hostname (Docker)  |
| `DB_PORT`         | `5432`                        | PostgreSQL port               |
| `DB_NAME`         | `sahayak`                     | Database name                 |
| `JWT_SECRET`      | `supersecretkey_sahayak`      | Staff JWT signing key         |
| `ADMIN_JWT_SECRET`| `admin_supersecret_sahayak`   | Admin JWT signing key         |
| `ADMIN_EMAIL`     | `admin@sahayak.com`           | Seeded super admin email      |
| `ADMIN_PASSWORD`  | `admin123`                    | Seeded super admin password   |
| `STT_SERVICE_URL` | `http://stt:8001`             | STT microservice URL          |
| `TTS_SERVICE_URL` | `http://tts:8002`             | TTS microservice URL          |
| `OCR_SERVICE_URL` | `http://ocr:8003`             | OCR microservice URL          |

---

## Startup Data Seeding

On every backend startup, `main.py` runs these seed functions (skip if already seeded):

1. **`_seed_admin_user`** — Creates `admin@sahayak.com` super admin
2. **`_seed_form_templates`** — Loads all 9 form category templates into `form_template_metadata` table from the `FORM_TEMPLATES` dict in `forms.py`
3. **`_seed_default_settings`** — Seeds default system settings:
   - `offlineMode: true`
   - `hybridMode: false`
   - `voiceVerification: true`
   - `autoSync: true`
   - `syncIntervalMinutes: 30`
   - `dataRetentionDays: 90`

---

## Healthchecks

Docker Compose waits for health before starting dependent containers:

```yaml
backend healthcheck:
  test: curl -f http://localhost:5000/health
  interval: 10s, timeout: 5s, retries: 5, start_period: 15s

db healthcheck:
  test: pg_isready -U postgres
  interval: 5s, timeout: 5s, retries: 5
```

Both `frontend` and `admin` containers wait for `backend: condition: service_healthy`.

---

## Useful Debug Commands

```bash
# See all container statuses
docker compose ps

# Backend logs (startup seed + route hits)
docker logs sahayak_backend --tail=50

# Database shell
docker exec -it sahayak_db psql -U postgres -d sahayak

# List all tables
\dt

# Check form submissions count
SELECT COUNT(*) FROM form_submissions;

# Backend API shell alive test
curl http://localhost:5000/health

# STT health
curl http://localhost:8001/health

# TTS health
curl http://localhost:8002/health

# OCR health
curl http://localhost:8003/health
```
