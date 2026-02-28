# Local Development & Deployment Guide

This guide details how to build, run, and modify the SAHAYAK Python Monorepo locally using Docker.

## Prerequisites
- Docker Engine & Docker Compose installed natively.
- No Python/Nodal package management needed outside of Docker!

## Setup Instructions

1. **Clone and run the application**:
   Open a terminal in the root of the repository where the `docker-compose.yml` file is located and run:
   ```bash
   docker compose up -d --build
   ```

2. **Wait for Healthchecks**:
   The Whisper STT container takes approximately ~8-15 seconds to download the Neural Network Base Model into memory. The database needs a few seconds to boot up.
   You can monitor logs:
   ```bash
   docker logs -f sahayak_backend
   docker logs -f sahayak_stt
   ```

3. **Verify running UI**:
   Open `http://localhost` (or `http://localhost:80`) in any modern browser.

### Interactive Debugging the UI
The Nginx server container uses statically built Vite files for optimum performance. Hot-module reloading (HMR) is NOT enabled in the Dockerized layout to ensure production parity.

**How to test frontend code changes**:
If you alter React code inside `/src/`:
```bash
docker compose up -d --build frontend
```

**How to test Backend API code changes**:
If you alter Python scripts inside `/backend/api/` or `auth.py`:
```bash
docker compose up -d --build backend
```

## Running the End-to-End Tests
The architecture ships with an automated Python integration-testing script, `test_integration.py`. This script behaves like the React UI but bypasses the browser entirely to stress-test the PostgreSQL latency, TTS streaming, STT AI accuracy, and Auth endpoints in milliseconds.

To run it cleanly against the working API:
1. Shell directly into the Core Backend container:
    ```bash
    docker exec -it sahayak_backend /bin/bash
    ```
2. Run the proxy script inside the VM where local networking is active:
    ```bash
    python /app/test_integration.py
    ```

You should receive consecutive 200 HTTP codes if the network volume loops correctly.
