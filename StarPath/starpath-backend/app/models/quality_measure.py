from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class QualityMeasure(Base):
    """
    Quality Measures Domain Data Model
    Stores long-stay and short-stay quality indicators
    """
    __tablename__ = "quality_measures"

    id = Column(String, primary_key=True, index=True)
    facility_id = Column(String, ForeignKey("facilities.id"), index=True)
    
    # Report Period Info
    report_date = Column(Date, index=True)
    report_period = Column(String)  # e.g., "2026-Q1"
    
    # Long-Stay Resident Measures (percentage or rate)
    pressure_ulcer_percentage = Column(Float, nullable=True)           # High-risk residents with pressure ulcers
    uti_percentage = Column(Float, nullable=True)                      # Urinary tract infections
    delirium_percentage = Column(Float, nullable=True)                 # Residents with delirium
    depression_percentage = Column(Float, nullable=True)               # Residents with depression symptoms
    antipsychotic_percentage = Column(Float, nullable=True)            # Receiving antipsychotic meds
    postop_pain_percentage = Column(Float, nullable=True)              # Post-operative pain not well managed
    physical_restraints_percentage = Column(Float, nullable=True)      # Physical restraints
    
    # Short-Stay Resident Measures (rate per 100 admissions)
    readmission_rate = Column(Float, nullable=True)                    # 30-day unplanned readmission
    hospital_transfer_rate = Column(Float, nullable=True)              # Hospital transfer rate
    ed_visit_rate = Column(Float, nullable=True)                       # Emergency department visits
    antipsychotic_short_stay_percentage = Column(Float, nullable=True) # Short-stay antipsychotic use
    
    # Resident and Family Satisfaction (1-5 scale or percentage)
    overall_satisfaction_score = Column(Float, nullable=True)          # Overall satisfaction rating
    care_quality_score = Column(Float, nullable=True)                  # Quality of care
    cleanliness_score = Column(Float, nullable=True)                   # Facility cleanliness/safety
    staff_responsiveness_score = Column(Float, nullable=True)          # Staff responsiveness
    
    # Data Metadata
    data_source = Column(String)  # CMS|Calculated|Reported
    data_source_date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    facility = relationship("Facility", back_populates="quality_measures")
    
    def __repr__(self):
        return f"<QualityMeasure facility={self.facility_id} period={self.report_period}>"
