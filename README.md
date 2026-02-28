# SAHAYAK Bank Kiosk - Complete Self-Service System

A bank-grade self-service kiosk authentication and service UI built for the SAHAYAK system used inside bank branches in India. Now newly upgraded with an End-to-End Generative AI Microservice Backend Architecture!

## 🎯 Purpose

This kiosk interface provides a complete self-service banking experience with:
- **Staff authentication** - Bank staff must login before customer use (Secured via Bcrypt & JWT)
- **Multi-language support** - English, Hindi, Tamil
- **9 comprehensive banking form categories** - Account opening, transactions, loans, KYC, service requests, transfers, investments, enquiries, closures. Forms logic is dynamically loaded from the database!
- **Voice + IVR mode** - Powered by real Python AI Microservices (Whisper STT & Google TTS) for a fully continuous Auto-Advance voice flow.
- **Touch mode** - Traditional on-screen keypad and text input.
- **Human verification** - Staff approval required before form submission into the PostgreSQL Database.
- **Containerized** - A highly resilient 5-container architecture mapped with Docker Compose.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18, Vite, Context API, CSS (Reverse Proxied via Nginx)
- **Core API Backend**: Python (FastAPI), SQLAlchemy, PyJWT, Bcrypt
- **Database**: PostgreSQL 15 (JSONB for dynamic form storage)
- **AI Microservices**: 
  - Speech-to-Text: Python, FastAPI, `openai-whisper` (Base model)
  - Text-to-Speech: Python, FastAPI, `gTTS`
- **Orchestration**: Docker & Docker Compose

### Complete Microservice Data Flow
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

## 📚 Comprehensive Documentation

For engineers maintaining this system, please explore the `docs/` folder:
1. `docs/01_architecture.md`: System sequence overview and microservice interactions.
2. `docs/02_running_app.md`: How to cold-boot the Docker Compose stack natively and testing.
3. `docs/03_debugging_and_fixes.md`: A catalog of complex architectural bugs resolved (e.g. streaming proxy fixes, React Auto-Advance lifecycle).
4. `docs/04_future_development.md`: Upgrade pipelines for STT/TTS offline modes.

## 📋 Banking Form Categories

The kiosk dynamically queries PostgreSQL to build these **9 comprehensive banking form templates**:
1. **📋 Account Opening Forms** - New savings, current, or FD accounts 
2. **💰 Transaction Forms** - Deposit/Withdraw slips (Used heavily to test Voice e2e)
3. **🏦 Loan Application Forms** - Personal, home, vehicle, business loans 
4. **🆔 KYC Forms** - Identity & address verification 
5. **📞 Service Request Forms** - Cheque books, ATM cards, contact updates 
6. **↔️ Transfer & Remittance Forms** - RTGS/NEFT/inward remittance 
7. **📈 Investment & Wealth Forms** - Mutual funds, insurance, investments 
8. **❓ Enquiry & Dispute Forms** - Complaints, statement requests 
9. **🔒 Closure & Nomination Forms** - Account closure, nominee updates 

## 🎨 Design & Voice Principles

### Voice-First Automated IVR
- **Voice-first UI**: Minimal text, large icons.
- **Auto-Advance AI flow**:
  1. Kiosk speaks the next input field via TTS.
  2. Kiosk automatically records user microphone for 5 seconds.
  3. Audio is zipped automatically to Whisper STT Python node.
  4. Response is validated. Silence (`[No Speech Detected]`) or valid text is captured.
  5. UI automatically clicks "Next Field" without the user ever touching the screen!
- **Feedback**: Captured text shown in a massive green success box instantly.

### Touch-First Design
- Very large touch targets (80px+ height)
- Professional High-Contrast UI for Accessibility (WCAG AAA)
- Custom responsive Numeric Keypad.

## 🚀 Setup & Installation

### Prerequisites
- Docker Engine
- Docker Compose

### Installation (One-Click)

From the root repository containing `docker-compose.yml`:
```bash
# Build and background run the entire 5 container stack
docker compose up -d --build
```
*Wait ~10-15 seconds for the Whisper ML model to download into memory if this is your first time!*

Then, simply open your web browser to:
`http://localhost` (or `http://localhost:80`)

### Developer Hot-Reloading

If you make edits to a specific subsystem, you do not need to reboot the entire stack:
```bash
# To rebuild frontend React UI only
docker compose up -d --build frontend

# To rebuild Python core API only
docker compose up -d --build backend
```

## 🧪 Testing Flow

### Complete Flow Test (E2E Voice Mode + Transaction Forms)
1. **Language Selection**: Select English, Hindi, or Tamil
2. **Staff Authentication**: Enter default Admin PIN `1234`
3. **Mode Selection**: Choose "Voice + IVR" (Recommended)
4. **Service Selection**: Choose "Transaction Forms (Deposit/Withdrawal)"
5. **Auto-Voice Sequence**: 
   - Wait for the TTS to speak. 
   - The microphone activates automatically. Speak into it!
   - Wait 5 seconds. The text maps dynamically.
   - The flow automatically proceeds to the next form field.
6. **Field Confirmation**: Review all fields.
7. **Human Verification**: Staff enters standard `1234` PIN to greenlight.
8. **Success**: Form is committed as a permanent JSON row into the PostgreSQL database!

### Automated Python Tests
Run the internal test suite across the container fabric to verify STT proxy latencies:
```bash
docker exec -it sahayak_backend python /app/test_integration.py
```

## 📄 License
Proprietary - SAHAYAK Bank System

## 👥 Support
For bank branch support:
- Contact IT helpdesk
- Reference: SAHAYAK Kiosk Authentication System v2.0 (Microservices Build)

---

**Built with care for Indian banking customers** 🇮🇳
