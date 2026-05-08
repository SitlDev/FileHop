from sqlalchemy import Column, String, Integer, Date, JSON, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base, GUID

class StarRating(Base):
    __tablename__ = "star_ratings"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    facility_id = Column(GUID, ForeignKey("facilities.id"), nullable=False, index=True)
    effective_date = Column(Date, nullable=False, index=True)
    
    # Individual domain ratings
    health_inspection_rating = Column(Integer)  # 1-5
    staffing_rating = Column(Integer)  # 1-5
    qm_rating = Column(Integer)  # 1-5
    overall_rating = Column(Integer)  # 1-5
    
    # Detailed scores
    health_inspection_score = Column(Numeric(10, 2))
    staffing_score = Column(Integer)
    qm_score = Column(Integer)
    
    # Calculation audit trail
    calculation_details = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    facility = relationship("Facility", back_populates="star_ratings")
