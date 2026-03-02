# Future Development Guide

This document describes how to extend SAHAYAK for new features, scale for
production banking deployment, and improve AI model quality.

---

## Adding New Banking Form Categories

Form templates are stored in the PostgreSQL database and managed via the admin portal.
To add a new form category:

### Option A — Admin Portal (recommended)
1. Open http://localhost:8080 → **Forms & Templates**
2. Click **+ New Template**
3. Fill in template name and category key
4. Use the **Visual Field Builder** to add fields (type, label, required flag)
5. Click **Save Template** — immediately available to all kiosks

### Option B — Backend Code
1. Open `backend/api/routes/forms.py`
2. Add a new key to `FORM_TEMPLATES`:
   ```python
   "myNewCategory": {
       "fields": [
           {"id": "accountNumber", "label": "Account Number", "type": "tel", "required": True},
           {"id": "purpose", "label": "Purpose", "type": "text", "required": True},
       ]
   }
   ```
3. Add the display name in `main.py` → `_seed_form_templates()` → `display_names` dict
4. Add the translation key to `src/data/mockData.js` for all 3 languages
5. Rebuild backend: `docker compose up -d --build backend`

---

## Adding a New Language

1. Add all translation strings to `src/data/mockData.js`:
   ```javascript
   export const translations = {
     en: { welcome: '...', ... },
     hi: { welcome: '...', ... },
     ta: { welcome: '...', ... },
     mr: { welcome: 'SAHAYAK बँक किओस्कवर आपले स्वागत', ... },  // NEW
   };
   ```
2. Add the language option tile in `src/components/WelcomeScreen.jsx`
3. Add the shortcode to the TTS microservice if gTTS supports it:
   ```python
   # microservices/tts/main.py
   LANG_MAP = {"en": "en", "hi": "hi", "ta": "ta", "mr": "mr"}
   ```
4. Rebuild frontend and TTS: `docker compose up -d --build frontend tts`

---

## Improving Speech-to-Text Accuracy

**Current model:** `whisper-base` (74M parameters)  
**CPU transcription time:** ~1.5–2 seconds for 5-second clips

To upgrade the model:
```python
# microservices/stt/main.py
model = whisper.load_model("base")    # current
model = whisper.load_model("small")   # better accuracy, ~2x RAM
model = whisper.load_model("medium")  # much better for Indian English, ~5x RAM
```

For GPU inference, add to `docker-compose.yml`:
```yaml
stt:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

---

## Replacing TTS with Offline Engine

Current gTTS requires internet access. For offline/air-gapped deployment:

```python
# microservices/tts/main.py — replace gTTS with pyttsx3 or Coqui TTS
from TTS.api import TTS

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

@app.post("/synthesize")
async def synthesize(text: str, lang: str = "en"):
    # Coqui supports Hindi and Tamil natively
    audio = tts.tts(text=text, language=lang)
    # ... return audio bytes
```

Rebuild: `docker compose up -d --build tts`

---

## Hardening for Production Banking Deployment

### 1. Rotate All Secrets
```yaml
# docker-compose.yml (production)
environment:
  - JWT_SECRET=<256-bit-random-string>
  - ADMIN_JWT_SECRET=<256-bit-random-string>
  - DB_PASSWORD=<strong-password>
```

### 2. Link to Enterprise LDAP / Active Directory
Replace `bcrypt.checkpw` in `backend/api/routes/admin_auth.py` with an LDAP bind:
```python
from ldap3 import Server, Connection, ALL

def verify_admin_ldap(email: str, password: str) -> bool:
    server = Server('ldap://your-bank-ldap.local', get_info=ALL)
    conn = Connection(server, user=email, password=password, auto_bind=True)
    return conn.bind()
```

### 3. Enable Biometric Kiosk Auth
Replace PIN validation in `auth.py` with fingerprint/RFID hardware SDK calls.

### 4. Add HTTPS / TLS Termination
Add an Nginx TLS reverse proxy in front of the stack:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/bank.crt;
    ssl_certificate_key /etc/ssl/private/bank.key;
    location / { proxy_pass http://sahayak_frontend:80; }
}
```

### 5. Add Rate Limiting
```python
# backend/main.py
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.post("/staff-login")
@limiter.limit("5/minute")
def staff_login(...):
    ...
```

---

## Scaling for Multiple Bank Branches

### Kiosk Registration Flow
Currently kiosks are created manually via the admin portal. To auto-register:
1. Each kiosk calls `POST /api/kiosk/heartbeat` with `device_id`
2. If device is not in `kiosks` table, either auto-create or queue for admin approval
3. Admin approves via **Kiosks** page → device becomes active

### Multi-Region Deployment
Admin roles support regions already — extend to filter reports/kiosks by region:
```python
# Already available: AdminUser.region field
# Reports can be filtered: ?region=North
```

---

## OTA (Over-the-Air) Update Workflow

OTA updates push new versions to kiosks without physical access:

1. Admin creates an update via **OTA Updates** page
2. Backend stores version + notes in `ota_updates` table, targeting specific device IDs
3. Kiosk `AppStateContext.jsx` calls `GET /api/kiosk/pending-update?device_id=<id>` on startup
4. If `has_update=true`, OTA banner appears at top of kiosk screen
5. On next restart, kiosk fetches and applies the update payload

---

## Monitoring & Observability (Future)

Add Prometheus metrics to the FastAPI backend:
```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

Add a Grafana + Prometheus stack to `docker-compose.yml` for dashboards showing:
- Form submission rate per service type
- STT transcription latency
- Kiosk heartbeat uptime per branch
- Error rates by region
