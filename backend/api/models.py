from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submissions = relationship("FormSubmission", back_populates="customer")

class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    service_type = Column(String(100), nullable=False)
    form_data = Column(JSON, nullable=False)
    verified_by_staff_id = Column(Integer, ForeignKey("staff_users.id"))
    status = Column(String(50), default="approved")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="submissions")
    verifier = relationship("StaffUser")
