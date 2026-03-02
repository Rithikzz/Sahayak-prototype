# Complete API Reference

All endpoints are served by `sahayak_backend` on port 5000.
Swagger UI: http://localhost:5000/docs
ReDoc: http://localhost:5000/redoc

---

## Health

| Method | Path      | Auth | Description              |
|--------|-----------|------|--------------------------|
| GET    | `/health` | None | Returns `{ status: "OK" }` |

---

## Kiosk Auth  `/api/auth/...`

| Method | Path                   | Auth        | Body / Params            | Response                        |
|--------|------------------------|-------------|--------------------------|----------------------------------|
| POST   | `/api/auth/staff-login`| None        | `{ pin: "1234" }`        | `{ access_token, staff_name }`   |

If no staff exists, seeds a default with PIN `1234` automatically.

---

## Forms  `/api/forms/...`

| Method | Path                     | Auth         | Body                                                               | Response                        |
|--------|--------------------------|--------------|--------------------------------------------------------------------|---------------------------------|
| GET    | `/api/forms/templates`   | None         | —                                                                  | Keyed object of 9 categories   |
| POST   | `/api/forms/submit`      | Staff Bearer | `{ service_type, form_data, staff_pin, account_number }`          | `{ id, message, status }`       |

`/api/forms/templates` response structure:
```json
{
  "accountOpeningForms": {
    "fields": [
      { "id": "fullName", "label": "Full Name", "type": "text", "required": true }
    ]
  },
  "transactionForms": { "fields": [...] },
  ...9 categories total
}
```

`/api/forms/submit` validates the `staff_pin` against the database. Returns 401
if pin doesn't match any staff user.

---

## Voice  `/api/voice/...`

| Method | Path                    | Auth         | Body                                     | Response              |
|--------|-------------------------|--------------|------------------------------------------|-----------------------|
| POST   | `/api/voice/synthesize` | Staff Bearer | Form-data: `text`, `lang` (en/hi/ta)     | MP3 audio bytes       |
| POST   | `/api/voice/transcribe` | Staff Bearer | Form-data: `audio` (WebM file)            | `{ text, language }` |

Voice endpoints proxy to STT (port 8001) and TTS (port 8002) internally.

---

## Kiosk Device  `/api/kiosk/...`

| Method | Path                                           | Auth | Body / Params                                             | Response                          |
|--------|------------------------------------------------|------|------------------------------------------------------------|-----------------------------------|
| GET    | `/api/kiosk/pending-update?device_id=<id>`    | None | `device_id` query param                                   | `{ has_update, version, ... }`    |
| POST   | `/api/kiosk/heartbeat`                         | None | `{ device_id, installed_version, forms_today, ip_address }`| `{ message, device_id }`          |

Heartbeat returns 404 if `device_id` is not registered in the `kiosks` table.
Register kiosks first via the admin portal.

---

## Admin Auth  `/api/admin/auth/...`

| Method | Path                      | Auth         | Body                          | Response                        |
|--------|---------------------------|--------------|-------------------------------|---------------------------------|
| POST   | `/api/admin/auth/login`   | None         | `{ email, password }`         | `{ access_token, admin }`       |
| GET    | `/api/admin/auth/me`      | Admin Bearer | —                             | Current admin user object       |
| POST   | `/api/admin/auth/logout`  | Admin Bearer | —                             | `{ message: "Logged out" }`     |

---

## Admin Users  `/api/admin/users/...`

| Method | Path                    | Auth         | Body                                | Response        |
|--------|-------------------------|--------------|-------------------------------------|-----------------|
| GET    | `/api/admin/users`      | Admin Bearer | —                                   | Array of users  |
| POST   | `/api/admin/users`      | Admin Bearer | `{ name, email, password, role, region }` | Created user |
| PUT    | `/api/admin/users/{id}` | Admin Bearer | Partial update fields               | Updated user    |
| DELETE | `/api/admin/users/{id}` | Admin Bearer | —                                   | `{ message }`   |

---

## Admin Kiosks  `/api/admin/kiosks/...`

| Method | Path                      | Auth         | Body                          | Response           |
|--------|---------------------------|--------------|-------------------------------|--------------------|
| GET    | `/api/admin/kiosks`       | Admin Bearer | —                             | Array of kiosks    |
| POST   | `/api/admin/kiosks`       | Admin Bearer | `{ device_id, branch_name, branch_code, region }` | Created kiosk |
| GET    | `/api/admin/kiosks/{id}`  | Admin Bearer | —                             | Single kiosk       |
| PUT    | `/api/admin/kiosks/{id}`  | Admin Bearer | Partial update fields         | Updated kiosk      |
| DELETE | `/api/admin/kiosks/{id}`  | Admin Bearer | —                             | `{ message }`      |

---

## Admin Staff  `/api/admin/staff/...`

| Method | Path                              | Auth         | Body                        | Response          |
|--------|-----------------------------------|--------------|-----------------------------|-------------------|
| GET    | `/api/admin/staff`                | Admin Bearer | —                           | Array of staff    |
| POST   | `/api/admin/staff`                | Admin Bearer | `{ name, pin, role }`       | Created staff     |
| PUT    | `/api/admin/staff/{id}`           | Admin Bearer | `{ name, role }`            | Updated staff     |
| DELETE | `/api/admin/staff/{id}`           | Admin Bearer | —                           | `{ message }`     |
| POST   | `/api/admin/staff/{id}/reset-pin` | Admin Bearer | `{ pin: "5678" }`           | `{ message }`     |

---

## Admin Forms  `/api/admin/forms/...`

| Method | Path                    | Auth         | Body                         | Response           |
|--------|-------------------------|--------------|------------------------------|--------------------|
| GET    | `/api/admin/forms`      | Admin Bearer | —                            | Array of templates |
| POST   | `/api/admin/forms`      | Admin Bearer | `{ name, category, field_definitions, ... }` | Created template |
| GET    | `/api/admin/forms/{id}` | Admin Bearer | —                            | Single template    |
| PUT    | `/api/admin/forms/{id}` | Admin Bearer | Partial update               | Updated template   |
| DELETE | `/api/admin/forms/{id}` | Admin Bearer | —                            | `{ message }`      |
| POST   | `/api/admin/forms/ocr`  | Admin Bearer | Form-data: `file` (image)    | `{ text }`         |

---

## Admin Updates  `/api/admin/updates/...`

| Method | Path                           | Auth         | Body                              | Response           |
|--------|--------------------------------|--------------|-----------------------------------|--------------------|
| GET    | `/api/admin/updates`           | Admin Bearer | —                                 | Array of updates   |
| POST   | `/api/admin/updates`           | Admin Bearer | `{ version, update_name, notes, target }` | Created update |
| PUT    | `/api/admin/updates/{id}`      | Admin Bearer | Partial update                    | Updated update     |
| DELETE | `/api/admin/updates/{id}`      | Admin Bearer | —                                 | `{ message }`      |
| POST   | `/api/admin/updates/{id}/push` | Admin Bearer | `{ device_ids: ["all"] }`         | `{ message }`      |

---

## Admin Reports  `/api/admin/reports/...`

| Method | Path                                | Auth         | Params            | Response                     |
|--------|-------------------------------------|--------------|-------------------|------------------------------|
| GET    | `/api/admin/reports/kpi`            | Admin Bearer | —                 | KPI summary object           |
| GET    | `/api/admin/reports/usage`          | Admin Bearer | `?period=30d`     | `{ period, total, by_service }` |
| GET    | `/api/admin/reports/errors`         | Admin Bearer | `?period=7d`      | `{ period, data }`           |
| GET    | `/api/admin/reports/regions`        | Admin Bearer | —                 | `{ regions }`                |
| GET    | `/api/admin/reports/submissions`    | Admin Bearer | `?page&limit&...` | `{ submissions, total, pages }` |

KPI response:
```json
{
  "total_kiosks": 5,
  "active_kiosks": 3,
  "forms_processed_today": 47,
  "error_rate": 2.1,
  "total_staff": 12
}
```

---

## Admin Settings  `/api/admin/settings`

| Method | Path                   | Auth         | Body                        | Response            |
|--------|------------------------|--------------|-----------------------------|--------------------|
| GET    | `/api/admin/settings`  | Admin Bearer | —                           | `{ key: value, ... }` |
| PUT    | `/api/admin/settings`  | Admin Bearer | `{ settings: { key: value } }` | `{ message, settings }` |

---

## Microservice Endpoints (internal, not proxied to browser)

| Service | Method | Path          | Body                    | Response            |
|---------|--------|---------------|-------------------------|---------------------|
| STT:8001| GET    | `/health`     | —                       | `{ status: "ok" }` |
| STT:8001| POST   | `/transcribe` | Form-data: `file` (WebM)| `{ text, language }`|
| TTS:8002| GET    | `/health`     | —                       | `{ status: "ok" }` |
| TTS:8002| POST   | `/synthesize` | Form-data: `text`, `lang`| MP3 bytes          |
| OCR:8003| GET    | `/health`     | —                       | `{ status: "ok" }` |
| OCR:8003| POST   | `/ocr`        | Form-data: `file` (image)| `{ text }`         |
