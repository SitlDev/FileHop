from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base, GUID

class Deficiency(Base):
    __tablename__ = "deficiencies"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    health_inspection_id = Column(GUID, ForeignKey("health_inspections.id"), nullable=False, index=True)
    f_tag = Column(String(10), nullable=False)  # e.g., "F600", "F323"
    scope = Column(String(1), nullable=False)  # D, E, F, G, H, I, J, K, L
    severity = Column(String(1), nullable=False)  # 1, 2, 3, 4
    description = Column(Text)
    is_substandard_qoc = Column(Boolean, default=False)
    is_immediate_jeopardy = Column(Boolean, default=False)
    is_past_non_compliance = Column(Boolean, default=False)
    points = Column(Integer)  # Calculated from Table 1
    
    # Additional CMS-Compliant Fields
    severity_level = Column(String(50), nullable=True)  # "Immediate Jeopardy", "Serious Concern", "Non-Compliance"
    regulatory_citation = Column(String(50), nullable=True)  # e.g., "42 CFR §483.12"
    remediation_date = Column(Date, nullable=True)  # When corrected
    remediation_verified = Column(Boolean, default=False)
    remediation_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    health_inspection = relationship("HealthInspection", back_populates="deficiencies")
