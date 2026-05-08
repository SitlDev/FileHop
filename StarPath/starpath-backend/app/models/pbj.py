from sqlalchemy import Column, String, Integer, Date, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base, GUID

class PBJSubmission(Base):
    __tablename__ = "pbj_submissions"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    facility_id = Column(GUID, ForeignKey("facilities.id"), nullable=False, index=True)
    quarter = Column(String(6), nullable=False)  # e.g., "2026Q1"
    submission_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    facility = relationship("Facility", back_populates="pbj_submissions")
    daily_staffing = relationship("PBJDailyStaffing", back_populates="pbj_submission", cascade="all, delete-orphan")

class PBJDailyStaffing(Base):
    __tablename__ = "pbj_daily_staffing"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    pbj_submission_id = Column(GUID, ForeignKey("pbj_submissions.id"), nullable=False, index=True)
    work_date = Column(Date, nullable=False, index=True)
    employee_id = Column(String(50))
    job_code = Column(Integer, nullable=False)  # 1-12 per CMS spec
    hours = Column(Numeric(5, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    pbj_submission = relationship("PBJSubmission", back_populates="daily_staffing")
