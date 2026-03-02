from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os

from api.database import get_db
from api.models import StaffUser

router = APIRouter()

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey_sahayak")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12 # 12 hours

class StaffLoginRequest(BaseModel):
    pin: str

class Token(BaseModel):
    access_token: str
    token_type: str
    staff_name: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_staff(request: Request, db: Session = Depends(get_db)) -> StaffUser:
    """Decode the staff JWT from the Authorization header and return the StaffUser."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate staff credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise credentials_exception
    token = auth_header[len("Bearer "):]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        staff_id: str = payload.get("sub")
        if staff_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    staff = db.query(StaffUser).filter(StaffUser.id == int(staff_id)).first()
    if staff is None:
        raise credentials_exception
    return staff

@router.post("/staff-login", response_model=Token)
def staff_login(request: StaffLoginRequest, db: Session = Depends(get_db)):
    # Since we are using PINs, we will find the first staff or match by role if multiple exist.
    # For kiosk purposes, there's often a universal branch PIN or specific staff PINs.
    
    # We will check all staff users to see if any pin matches
    staff_users = db.query(StaffUser).all()
    
    # If no staff exists, seed one here temporarily for safety
    if not staff_users:
        default_hash = get_password_hash("1234")
        new_staff = StaffUser(pin_hash=default_hash, name="Default Admin")
        db.add(new_staff)
        db.commit()
        db.refresh(new_staff)
        staff_users = [new_staff]

    for staff in staff_users:
        if verify_password(request.pin, staff.pin_hash):
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": str(staff.id)}, expires_delta=access_token_expires
            )
            return {"access_token": access_token, "token_type": "bearer", "staff_name": staff.name or "Staff"}
            
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect PIN",
        headers={"WWW-Authenticate": "Bearer"},
    )
