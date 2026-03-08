from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from api.database import get_db
from api.models import StaffUser, Customer, FormSubmission

router = APIRouter()

class FormSubmissionRequest(BaseModel):
    service_type: str
    form_data: Dict[str, Any]
    staff_pin: str  # For final human verification step
    account_number: str = None
    phone_number: str = None
    form_template_id: Optional[int] = None  # which DB template was used

# Hardcoded form templates migrated from mockData.js for the GET endpoint
FORM_TEMPLATES = {
  "accountOpeningForms": {
    "fields": [
      { "id": 'accountType', "label": 'Account Type', "type": 'text', "required": True },
      { "id": 'fullName', "label": 'Full Name', "type": 'text', "required": True },
      { "id": 'fatherName', "label": 'Father/Spouse Name', "type": 'text', "required": True },
      { "id": 'dateOfBirth', "label": 'Date of Birth', "type": 'text', "required": True },
      { "id": 'aadharNumber', "label": 'Aadhar Number', "type": 'text', "required": True },
      { "id": 'panNumber', "label": 'PAN Number', "type": 'text', "required": True },
      { "id": 'address', "label": 'Residential Address', "type": 'text', "required": True },
      { "id": 'phoneNumber', "label": 'Mobile Number', "type": 'tel', "required": True },
      { "id": 'email', "label": 'Email Address', "type": 'email', "required": False },
      { "id": 'initialDeposit', "label": 'Initial Deposit Amount', "type": 'number', "required": True }
    ]
  },
  "transactionForms": {
    "fields": [
      { "id": 'transactionType', "label": 'Transaction Type (Deposit or Withdrawal)', "type": 'text', "required": True },
      { "id": 'date', "label": 'Date (DD-MM-YYYY)', "type": 'text', "required": True },
      { "id": 'branchName', "label": 'Branch Name', "type": 'text', "required": True },
      { "id": 'accountNumber', "label": 'Account Number', "type": 'text', "required": True },
      { "id": 'fullName', "label": 'Account Holder Name', "type": 'text', "required": True },
      { "id": 'amount', "label": 'Amount (in Rs)', "type": 'number', "required": True },
      { "id": 'panNumber', "label": 'PAN Number (If amount > 50,000)', "type": 'text', "required": False },
      { "id": 'phoneNumber', "label": 'Mobile Number', "type": 'tel', "required": True }
    ]
  },
  "loanApplicationForms": {
    "fields": [
      { "id": 'loanType', "label": 'Loan Type', "type": 'text', "required": True },
      { "id": 'loanAmount', "label": 'Loan Amount Required', "type": 'number', "required": True },
      { "id": 'fullName', "label": 'Full Name', "type": 'text', "required": True },
      { "id": 'monthlyIncome', "label": 'Monthly Income', "type": 'number', "required": True },
      { "id": 'employmentType', "label": 'Employment Type', "type": 'text', "required": True },
      { "id": 'panNumber', "label": 'PAN Number', "type": 'text', "required": True },
      { "id": 'aadharNumber', "label": 'Aadhar Number', "type": 'text', "required": True },
      { "id": 'phoneNumber', "label": 'Contact Number', "type": 'tel', "required": True }
    ]
  },
   "kycForms": {
    "fields": [
      { "id": 'accountNumber', "label": 'Account Number', "type": 'text', "required": True },
      { "id": 'fullName', "label": 'Full Name', "type": 'text', "required": True },
      { "id": 'aadharNumber', "label": 'Aadhar Number', "type": 'text', "required": True },
      { "id": 'panNumber', "label": 'PAN Number', "type": 'text', "required": True },
      { "id": 'currentAddress', "label": 'Current Address', "type": 'text', "required": True },
      { "id": 'phoneNumber', "label": 'Mobile Number', "type": 'tel', "required": True },
      { "id": 'email', "label": 'Email', "type": 'email', "required": False }
    ]
  },
  "serviceRequestForms": {
    "fields": [
      { "id": 'accountNumber', "label": 'Account Number', "type": 'text', "required": True },
      { "id": 'serviceType', "label": 'Service Requested', "type": 'text', "required": True },
      { "id": 'fullName', "label": 'Account Holder Name', "type": 'text', "required": True },
      { "id": 'phoneNumber', "label": 'Mobile Number', "type": 'tel', "required": True },
      { "id": 'additionalDetails', "label": 'Additional Details', "type": 'text', "required": False }
    ]
  },
  "transferRemittanceForms": {
    "fields": [
      { "id": 'transferType', "label": 'Transfer Type', "type": 'text', "required": True },
      { "id": 'fromAccount', "label": 'From Account Number', "type": 'text', "required": True },
      { "id": 'beneficiaryName', "label": 'Beneficiary Name', "type": 'text', "required": True },
      { "id": 'beneficiaryAccount', "label": 'Beneficiary Account', "type": 'text', "required": True },
      { "id": 'ifscCode', "label": 'IFSC Code', "type": 'text', "required": True },
      { "id": 'amount', "label": 'Transfer Amount', "type": 'number', "required": True },
      { "id": 'purpose', "label": 'Purpose', "type": 'text', "required": False }
    ]
  },
  "investmentWealthForms": {
    "fields": [
      { "id": 'investmentType', "label": 'Investment Type', "type": 'text', "required": True },
      { "id": 'accountNumber', "label": 'Account Number', "type": 'text', "required": True },
      { "id": 'fullName', "label": 'Full Name', "type": 'text', "required": True },
      { "id": 'panNumber', "label": 'PAN Number', "type": 'text', "required": True },
      { "id": 'investmentAmount', "label": 'Investment Amount', "type": 'number', "required": True },
      { "id": 'phoneNumber', "label": 'Contact Number', "type": 'tel', "required": True }
    ]
  },
  "enquiryDisputeForms": {
    "fields": [
      { "id": 'accountNumber', "label": 'Account Number', "type": 'text', "required": True },
      { "id": 'enquiryType', "label": 'Enquiry/Dispute Type', "type": 'text', "required": True },
      { "id": 'fullName', "label": 'Full Name', "type": 'text', "required": True },
      { "id": 'description', "label": 'Description', "type": 'text', "required": True },
      { "id": 'phoneNumber', "label": 'Contact Number', "type": 'tel', "required": True }
    ]
  },
  "closureNominationForms": {
    "fields": [
      { "id": 'requestType', "label": 'Request Type', "type": 'text', "required": True },
      { "id": 'accountNumber', "label": 'Account Number', "type": 'text', "required": True },
      { "id": 'accountHolderName', "label": 'Account Holder Name', "type": 'text', "required": True },
      { "id": 'nomineeDetails', "label": 'Nominee/Reason Details', "type": 'text', "required": True },
      { "id": 'phoneNumber', "label": 'Contact Number', "type": 'tel', "required": True }
    ]
  }
}

@router.get("/templates")
def get_form_templates(db: Session = Depends(get_db)):
    """Return published form templates from DB, grouped by category.
    Each category maps to an **array** of template objects so multiple
    templates per category are supported (e.g. different deposit slip variants).
    Falls back to hardcoded templates during first boot.
    """
    from api.models import FormTemplateMetadata
    templates = db.query(FormTemplateMetadata).filter(FormTemplateMetadata.status == "Published").all()
    if templates:
        result: dict = {}
        for t in templates:
            entry = {
                "id": t.id,
                "name": t.name,
                "fields": t.field_definitions,
                # Use pdf_filename as the canonical PDF indicator (original_pdf is deprecated)
                "has_pdf": bool(t.pdf_filename or t.original_pdf),
            }
            result.setdefault(t.category, []).append(entry)
        return result
    # Fallback to hardcoded during first boot (wrap each in a list for consistency)
    return {k: [v] for k, v in FORM_TEMPLATES.items()}

@router.post("/submit")
def submit_form(request: FormSubmissionRequest, db: Session = Depends(get_db)):
    """Receives completion of a kiosk form flow including staff final verification."""

    # 0. Validate required fields if a known template is referenced
    template = None
    if request.form_template_id:
        from api.models import FormTemplateMetadata
        template = db.query(FormTemplateMetadata).filter(
            FormTemplateMetadata.id == request.form_template_id
        ).first()
        if template and template.field_definitions:
            missing = [
                f.get("label", f["id"])
                for f in template.field_definitions
                if f.get("required") and not request.form_data.get(f["id"])
            ]
            if missing:
                raise HTTPException(
                    status_code=422,
                    detail=f"Missing required fields: {', '.join(missing)}"
                )

    # 1. Verify staff PIN again (Human Verification Step)
    from api.routes.auth import verify_password
    staff_users = db.query(StaffUser).all()
    verified_staff_id = None

    for staff in staff_users:
        if verify_password(request.staff_pin, staff.pin_hash):
            verified_staff_id = staff.id
            break

    if not verified_staff_id:
        raise HTTPException(status_code=401, detail="Invalid Staff PIN for verification")

    # 2. Get or create customer record if applicable
    customer_id = None
    if request.account_number or request.phone_number:
        if request.account_number:
            customer = db.query(Customer).filter(Customer.account_number == request.account_number).first()
        else:
            customer = db.query(Customer).filter(Customer.phone_number == request.phone_number).first()

        if not customer:
            customer = Customer(
                account_number=request.account_number,
                phone_number=request.phone_number
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        customer_id = customer.id

    # 3. Create Submission Record
    submission = FormSubmission(
        customer_id=customer_id,
        service_type=request.service_type,
        form_template_id=request.form_template_id,
        form_data=request.form_data,
        verified_by_staff_id=verified_staff_id,
        status="approved"
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    # 4. Persist the filled PDF so admin can reprint later (non-fatal)
    if template and template.pdf_filename:
        try:
            from app.pdf.overlay import generate_filled_pdf_bytes
            from app.pdf.storage import save_pdf
            filled_bytes = generate_filled_pdf_bytes(template, request.form_data)
            fname = save_pdf(f"sub{submission.id}", filled_bytes)
            submission.filled_pdf_filename = fname
            db.commit()
        except Exception as e:
            print(f"[submit] Could not save filled PDF for submission {submission.id}: {e}")

    return {
        "success": True,
        "message": "Form submitted and verified successfully",
        "submission_id": submission.id
    }
