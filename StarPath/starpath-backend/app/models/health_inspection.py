from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.database import Base, GUID

class SurveyType(str, enum.Enum):
    STANDARD = "standard"
    COMPLAINT = "complaint"
    INFECTION_CONTROL = "infection_control"
    REVISIT = "revisit"

class HealthInspection(Base):
    __tablename__ = "health_inspections"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    facility_id = Column(GUID, ForeignKey("facilities.id"), nullable=False, index=True)
    survey_date = Column(Date, nullable=False)
    survey_type = Column(Enum(SurveyType), nullable=False)
    cycle = Column(Integer)  # 1 = most recent, 2 = second most recent
    revisit_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    facility = relationship("Facility", back_populates="health_inspections")
    deficiencies = relationship("Deficiency", back_populates="health_inspection", cascade="all, delete-orphan")
