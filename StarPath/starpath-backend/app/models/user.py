from sqlalchemy import Column, String, Boolean, DateTime, Enum
import uuid
from datetime import datetime
from app.database import Base, GUID
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    FACILITY_MANAGER = "facility_manager"
    AUDITOR = "auditor"

class User(Base):
    __tablename__ = "users"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.FACILITY_MANAGER)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    password_reset_token = Column(String(500), nullable=True)
    password_reset_token_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
