# PDF Overlay Pipeline — Full Analysis & Improvement Plan

> Generated after a complete read of all pipeline files:  
> `backend/api/routes/admin_forms.py`, `pdf.py`, `forms.py`, `models.py`  
> `backend/app/pdf/storage.py`  
> `microservices/ocr/main.py`  
> `kiosk/src/components/FormPreviewScreen.jsx`, `HumanVerificationScreen.jsx`, `SuccessScreen.jsx`  
> `Sahayak_admin/src/components/PdfFieldEditor.jsx`

---

## 1 — How the Pipeline Works Today (End-to-End)

```
Admin Portal                   Backend                    OCR Microservice
───────────                    ───────                    ────────────────
Upload PDF  ──POST /ocr─────►  admin_forms.py             main.py
                               saves temp PDF     ──────► call_pixtral()
                               to DATA_DIR/pdfs/           (Bedrock Pixtral)
                               returns pdf_filename ◄──────  fractional bboxes
                                                            pixtral_bbox_to_pdf_coords()
                                                            coordinates in pt
Admin edits PdfFieldEditor                                 
(drag-to-adjust overlays)                                  
Save Template ──PUT /admin/forms/:id──► renames temp → {id}_{ts}.pdf
                                        saves field_definitions + field_coordinates in DB
Publish Template

                               Kiosk
                               ─────
Load templates ─GET /forms/templates──►  forms.py
                                         returns field_definitions (no coordinates)
User fills fields  (voice / keyboard)
                                         
Preview ──POST /forms/generate-pdf─────► pdf.py
                                          load_pdf(pdf_filename)
                                          PyMuPDF: white-out rect + insert_textbox
                                          returns binary PDF bytes
                        ◄──────────────
iframe preview in browser

Voice verification screen
Staff PIN ──POST /forms/submit──────────► forms.py
                                           verifies staff PIN
                                           saves FormSubmission (NO template_id!)
                        ◄──────────────
navigate /success

Print button ──POST /forms/generate-pdf──► same as above, opens new tab
Kiosk resets after 30 s
```

---

## 2 — Critical Bugs

### Bug 1 — `input_y` coordinate placed BELOW the input field (Pixtral path) 🔴

**Where:** `microservices/ocr/main.py` → `pixtral_bbox_to_pdf_coords()`

Pixtral's `bbox` is the bounding box of the **input area itself** (the blank line /  
empty box the customer writes in). OCR then computes:

```python
"input_y": round(y_pt + h_pt + 4, 2)   # ← 4 pts BELOW the bottom of the input box
```

Then `pdf.py` constructs the fill rect as:

```python
rect = fitz.Rect(x, input_y - FONT_SIZE - 2, x + box_w, input_y + box_h)
# top  = (y_pt + h_pt + 4) - 9 - 2  = y_pt + h_pt - 7   ← inside the detected field, near bottom
# bot  = (y_pt + h_pt + 4) + h_pt   = y_pt + 2*h_pt + 4  ← below the field entirely
```

**Result:** Text is placed spanning from near the bottom of the input box down into  
blank space below it — not filling the actual input area.

**Fix (OCR side):**
```python
# pixtral_bbox_to_pdf_coords — Pixtral bbox IS the input field, so input_y = y_pt
"input_y": y_pt,          # top of the input box
"box_width":  w_pt,
"box_height": h_pt if h_pt > 4 else 16.0,
```

**Fix (pdf.py side) — make rect match intent:**
```python
# Replace the existing rect line with:
rect = fitz.Rect(x, input_y, x + box_w, input_y + box_h)
page.draw_rect(rect, fill=(1, 1, 1), color=None)   # white-out
page.insert_textbox(
    rect, text_str,
    fontsize=FONT_SIZE, color=(0, 0, 0), align=0, warn_empty=False
)
```

> For pdfplumber / Tesseract paths, `input_y` is already the bottom of the label line  
> (`y_bottom + 4`), so it correctly sits just below the label — which is fine  
> with the rect change above.

---

### Bug 2 — `FormSubmission` has no `form_template_id` foreign key 🔴

**Where:** `backend/api/models.py`, `backend/api/routes/forms.py`, `kiosk/src/components/HumanVerificationScreen.jsx`

The `FormSubmission` row produced by `/forms/submit` stores only a `service_type`  
(freeform string, e.g. `"deposits"`). There is no reference to which  
`FormTemplateMetadata` record was used.

**Consequences:**
- Admin portal `/Submissions` page cannot regenerate or display the filled PDF.
- If multiple templates exist for the same category (which is now supported), it is  
  impossible to reconstruct which template was used.
- Audit trail is incomplete.

**Fix — 3 files:**

`models.py` — add FK column:
```python
form_template_id = Column(Integer, ForeignKey("form_template_metadata.id"), nullable=True)
```

`forms.py` — save it:
```python
submission = FormSubmission(
    ...
    form_template_id=body.form_template_id,   # add to SubmitFormRequest schema too
)
```

`HumanVerificationScreen.jsx` — pass it:
```js
const payload = {
    service_type: serviceType,
    form_data: formData,
    staff_pin: pin,
    account_number: accountNumber || formData.accountNumber,
    form_template_id: selectedFormTemplateId,   // ← add this
};
```

---

### Bug 3 — Filled PDF is never persisted at submission time 🔴

**Where:** `backend/api/routes/forms.py` `/submit` endpoint

The kiosk calls `generate-pdf` twice (preview + print), but neither result is saved.  
If the kiosk resets, the browser tab closes, or the user forgets to print, the  
filled PDF is permanently lost. The admin portal shows the submission but has no PDF.

**Fix:** Call `generate-pdf` logic (or a shared helper) inside `/submit` after PIN  
verification succeeds, store the result as `{submission_id}_filled.pdf`:

```python
# In /forms/submit, after db.commit():
try:
    filled_bytes = _generate_pdf_bytes(body.form_template_id, body.form_data, db)
    fname = save_pdf(f"sub{submission.id}", filled_bytes)
    submission.filled_pdf_filename = fname
    db.commit()
except Exception as e:
    logger.warning(f"[submit] Could not save filled PDF: {e}")  # non-fatal
```

New `FormSubmission` column needed:
```python
filled_pdf_filename = Column(String, nullable=True)
```

New admin endpoint:
```
GET /api/admin/forms/submissions/{sub_id}/pdf → stream filled_pdf_filename
```

---

## 3 — Significant Issues

### Issue 4 — Fixed 9pt font — too small for kiosk / accessibility 🟠

```python
FONT_SIZE = 9   # backend/api/routes/pdf.py
```

9pt at 72 DPI ≈ 9 screen pixels — extremely small, especially for Hindi / Tamil  
characters. `insert_textbox` will auto-shrink further if text overflows the rect.

**Fix:**
```python
FONT_SIZE = 11        # minimum readable size for printed forms
MAX_FONT_SIZE = 13    # shrink down from this for long values
# Use insert_textbox's built-in shrink: fontsize is the maximum
```

---

### Issue 5 — No required-field validation before `generate-pdf` or `submit` 🟠

`pdf.py` silently skips fields whose `form_data` value is empty string or missing —  
it simply does not draw text for that field. No error is raised.

`forms.py` `/submit` does not check that required fields are filled.

**Fix — backend `/submit`:**
```python
required_ids = {f["id"] for f in template.field_definitions if f.get("required")}
missing = required_ids - set(body.form_data.keys())
if missing:
    raise HTTPException(422, detail=f"Missing required fields: {', '.join(missing)}")
```

**Fix — kiosk frontend:**  
Disable the "Proceed to Preview" button unless all `required` fields in  
`FormTemplatePicker` / `InputController` are non-empty.

---

### Issue 6 — Temp PDF files accumulate if template is never saved 🟠

**Where:** `backend/api/routes/admin_forms.py` → `ocr_upload()`

Every OCR call saves a `temp_{ts}.pdf`. If the admin uploads but never saves a  
template (abandons the flow), the file sits in `DATA_DIR/pdfs/` forever.

**Fix:** Add a cleanup job (cron or startup hook) that deletes `temp_*.pdf` files  
older than 24 hours:

```python
# backend/app/pdf/storage.py
import glob, time
def cleanup_temp_pdfs(max_age_s: int = 86400):
    for path in glob.glob(os.path.join(PDF_DIR, "temp_*.pdf")):
        if time.time() - os.path.getmtime(path) > max_age_s:
            os.remove(path)
```

Call in a FastAPI `startup` event or a scheduled task.

---

### Issue 7 — No round-trip validation between `field_definitions` IDs and `field_coordinates` keys 🟠

`field_definitions` is a list like `[{id: "accountNumber", label: "Account No.", ...}]`.  
`field_coordinates` is a dict keyed by those same IDs.

Pixtral generates its own `camelCaseId` strings. The admin may rename fields in  
`PdfFieldEditor` without realising the coordinate keys remain old.  
`generate-pdf` silently skips any field whose ID is not in `field_coordinates`.

**Fix — backend `/submit` or `/generate-pdf`:**
```python
def_ids  = {f["id"] for f in template.field_definitions}
coord_ids = set(template.field_coordinates.keys())
unmatched = def_ids - coord_ids
if unmatched:
    logger.warning(f"[generate-pdf] Fields with no coordinates: {unmatched}")
    # Don't block — just skip, but log
```

**Fix — admin portal `PdfFieldEditor`:** Show a red badge on fields that have  
a `field_definition` entry but no matching `field_coordinates` key.

---

### Issue 8 — `SuccessScreen` regenerates PDF on every print click, but template may have changed 🟡

If an admin publishes a new version of the template between preview and print  
(unlikely but possible), the printed form could differ from what the customer reviewed.

**Fix:** After Bug 3 is fixed (persist filled PDF on submit), the print button should  
stream the already-saved `{submission_id}_filled.pdf` instead of regenerating.

---

### Issue 9 — No per-page scaling factor in `pixtral_bbox_to_pdf_coords` 🟡

OCR always uses `DPI = 200`. `pdf2image` converts at 200 DPI. The math is:

```
x_pt = bbox.x * img_w * (72 / 200)
```

This is correct **only if** the PDF page is exactly the size pdf2image renders it.  
For non-standard page sizes (A3, legal, half-letter) and for PDFs that have been  
digitally created (not scanned), `img_w` at 200 DPI may not equal the PDF page  
width in points × 200/72.

**Fix:** After converting to PDF points, verify against the actual PyMuPDF page rect:

```python
# In pdf.py, after loading the PDF:
page = doc[page_num]
pdf_w = page.rect.width
pdf_h = page.rect.height
# Scale stored coordinates if they look wrong:
# (This is a defensive normalisation, not always needed)
```

Or emit the PDF page dimensions from the OCR service alongside the coordinates so  
the admin and backend can detect mismatches.

---

## 4 — What Is Not Yet Done (Feature Gaps)

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| F1 | **Admin view/download of filled submission PDFs** | ❌ Not built | High |
| F2 | **Submission reprint from admin portal** | ❌ Not built | High |
| F3 | **Required-field validation gate before preview** | ❌ Not built | High |
| F4 | **Temp PDF cleanup job** | ❌ Not built | Medium |
| F5 | **Multi-page Pixtral: fields spread across several pages** | ⚠️ Partial (page=N stored, should work) | Low |
| F6 | **Font size per-field override** (e.g. signature vs. text) | ❌ Not built | Low |
| F7 | **RTL text support** (Urdu, Arabic — align=1 in insert_textbox) | ❌ Not built | Low |
| F8 | **Confidence score display in PdfFieldEditor** | ❌ Not built | Low |
| F9 | **"Re-run OCR" button after manual field edits** | ❌ Not built | Medium |
| F10 | **Submission page shows filled PDF inline** | ❌ Not built | High |
| F11 | **Version pinning: submission stores template version** | ❌ Not built | Medium |

---

## 5 — Ordered Implementation Plan

Work can be done in three phases, each independently deployable.

### Phase A — Bug Fixes (1-2 days)

**A1 — Fix `input_y` for Pixtral path** *(~30 min)*
- File: `microservices/ocr/main.py` → `pixtral_bbox_to_pdf_coords()`
- Change `"input_y": round(y_pt + h_pt + 4, 2)` → `"input_y": y_pt`

**A2 — Fix `pdf.py` rect construction** *(~15 min)*
- File: `backend/api/routes/pdf.py`
- Change `fitz.Rect(x, input_y - FONT_SIZE - 2, ...)` → `fitz.Rect(x, input_y, ...)`
- Increase `FONT_SIZE = 9` → `FONT_SIZE = 11`

**A3 — Add `form_template_id` to `FormSubmission`** *(~1 hr)*
- File: `backend/api/models.py` — add FK column + Alembic migration
- File: `backend/api/routes/forms.py` — add to `SubmitFormRequest` + save
- File: `kiosk/src/components/HumanVerificationScreen.jsx` — pass `selectedFormTemplateId`

### Phase B — Persistence & Admin (1 day)

**B1 — Save filled PDF on submission** *(~2 hr)*
- Extract `generate_pdf_bytes(template_id, form_data, db)` as a reusable helper
- Call it in `/forms/submit` after PIN verified
- Add `filled_pdf_filename` column to `FormSubmission`
- Add Alembic migration

**B2 — Admin endpoint to stream filled submission PDF** *(~30 min)*
- `GET /api/admin/forms/submissions/{id}/pdf` → stream `filled_pdf_filename`

**B3 — Admin `Submissions.jsx` — show filled PDF** *(~1 hr)*
- Add "View PDF" button per row → open new tab to the B2 endpoint

### Phase C — Quality & Completeness (1-2 days)

**C1 — Required-field validation** *(~1 hr)*
- Backend: add check in `/submit` (and optionally in `/generate-pdf`)
- Kiosk: disable "Proceed to Preview" if required fields are empty (uses `field_definitions.required`)

**C2 — Temp PDF cleanup job** *(~30 min)*
- `backend/app/pdf/storage.py` — add `cleanup_temp_pdfs()`
- Call at FastAPI startup

**C3 — Coordinate / field ID mismatch warning** *(~45 min)*
- Backend: log warning in `generate-pdf` for unmatched IDs
- Admin `PdfFieldEditor`: badge fields with no coordinates

**C4 — Filled PDF streaming on Success/Print** *(~30 min)*
- After B1 is done: rewrite `SuccessScreen.handlePrint()` to call the submission PDF  
  endpoint instead of regenerating

---

## 6 — Do We Need Any New AI in the Loop?

The current AI roles are:
- **Pixtral (Bedrock vision):** PDF→field detection with bboxes ✅ working
- **GPT/Bedrock LLM:** Voice transcript understanding / LLM form filling ✅ working

**Optional AI enhancement worth adding:**
- **Field confidence scoring**: Ask Pixtral to return a `confidence` (0–1) in its JSON  
  schema so the admin `PdfFieldEditor` can highlight low-confidence field placements  
  in red. This requires a small PIXTRAL_PROMPT change — no new model needed.
- **Post-fill validation LLM**: After the user fills a form, call a lightweight  
  Bedrock model to check semantic correctness  
  (e.g. "Does this IFSC code look valid? Is the amount consistent with account type?").  
  This is optional but would catch data-entry errors before staff review.

If you want either of these, just confirm and I'll implement them along with the fixes.

---

## 7 — Quick Fix Priority Summary

| Priority | Fix | File(s) |
|----------|-----|---------|
| 🔴 Critical | `input_y` coord bug (Pixtral path) | `ocr/main.py`, `api/routes/pdf.py` |
| 🔴 Critical | `FormSubmission` missing `form_template_id` | `models.py`, `forms.py`, `HumanVerificationScreen.jsx` |
| 🔴 Critical | Filled PDF not saved on submission | `forms.py`, `models.py`, `Submissions.jsx` |
| 🟠 High | Required-field validation before submit | `forms.py`, kiosk `InputController` |
| 🟠 High | Increase font from 9pt → 11pt | `api/routes/pdf.py` |
| 🟠 Medium | Temp PDF cleanup | `app/pdf/storage.py` |
| 🟠 Medium | ID mismatch warning in admin editor | `PdfFieldEditor.jsx`, `pdf.py` |
| 🟡 Low | Confidence scores in field editor | `ocr/main.py` (prompt change) |
| 🟡 Low | RTL / Urdu text alignment | `api/routes/pdf.py` |
