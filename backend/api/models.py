from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class StaffUser(Base):
    __tablename__ = "staff_users"

    id = Column(Integer, primary_key=True, index=True)
    pin_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    role = Column(String(50), default="staff")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String(50), unique=True, index=True)
    phone_number = Column(String(20))
    # Customer profile fields
    name = Column(String(150), nullable=True)
    email = Column(String(255), nullable=True)
    date_of_birth = Column(String(20), nullable=True)   # stored as DD/MM/YYYY string
    pan_number = Column(String(20), nullable=True)
    aadhaar_number = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    pin_hash = Column(String(255), nullable=True)        # bcrypt-hashed 4-digit PIN
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submissions = relationship("FormSubmission", back_populates="customer")

class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    service_type = Column(String(100), nullable=False)
    form_template_id = Column(Integer, ForeignKey("form_template_metadata.id"), nullable=True)
    form_data = Column(JSON, nullable=False)
    verified_by_staff_id = Column(Integer, ForeignKey("staff_users.id"))
    status = Column(String(50), default="approved")
    filled_pdf_filename = Column(String(255), nullable=True)   # path to final filled PDF on disk
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="submissions")
    verifier = relationship("StaffUser")
    form_template = relationship("FormTemplateMetadata")


# ─────────────────────────────────────────────
#  Admin Portal Models
# ─────────────────────────────────────────────

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), default="Regional Admin")  # Super Admin | Regional Admin | Read-Only
    region = Column(String(100), default="All Regions")
    permissions = Column(JSON, default=list)
    status = Column(String(20), default="Active")  # Active | Inactive
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    audit_logs = relationship("AuditLog", back_populates="admin_user")


class Kiosk(Base):
    __tablename__ = "kiosks"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, index=True, nullable=False)
    branch_name = Column(String(100), nullable=False)
    branch_code = Column(String(50), unique=True, nullable=False)
    region = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=True)
    status = Column(String(30), default="offline")  # online | offline | maintenance
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    installed_version = Column(String(50), default="1.0.0")
    last_sync = Column(DateTime(timezone=True), nullable=True)
    forms_today = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FormTemplateMetadata(Base):
    __tablename__ = "form_template_metadata"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False, index=True)  # matches service_type key; multiple templates allowed per category
    version = Column(Integer, default=1)
    status = Column(String(20), default="Draft")  # Draft | Published | Archived
    description = Column(Text, nullable=True)
    languages = Column(JSON, default=lambda: ["English", "Hindi", "Tamil"])
    field_definitions = Column(JSON, nullable=False)  # list of field objects
    original_pdf = Column(Text, nullable=True)          # DEPRECATED: base64-encoded original PDF (for backward compat)
    pdf_filename = Column(String(255), nullable=True)   # filename of PDF on disk (e.g., "17_1772866202.pdf")
    field_coordinates = Column(JSON, nullable=True)     # { field_id: {page, x, y, width, height, input_y} }
    has_pdf = Column(Boolean, default=False, nullable=False)  # whether this template has a PDF
    created_by = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    creator = relationship("AdminUser")


class OTAUpdate(Base):
    __tablename__ = "ota_updates"

    id = Column(Integer, primary_key=True, index=True)
    update_name = Column(String(200), nullable=False)
    update_type = Column(String(50), default="firmware")  # firmware | forms | config
    version = Column(String(50), nullable=False)
    target_region = Column(String(100), nullable=True)  # null means all regions
    target_kiosks = Column(JSON, default=list)  # list of kiosk device_ids; empty = all
    status = Column(String(30), default="Pending")  # Pending | In Progress | Completed | Cancelled
    progress = Column(Integer, default=0)  # 0-100
    successful_kiosks = Column(Integer, default=0)
    failed_kiosks = Column(Integer, default=0)
    deployed_date = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("AdminUser")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    action = Column(String(200), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    status = Column(String(20), default="Success")  # Success | Failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    admin_user = relationship("AdminUser", back_populates="audit_logs")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    updated_by = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    updater = relationship("AdminUser")
