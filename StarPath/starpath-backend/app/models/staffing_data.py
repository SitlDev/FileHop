from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class StaffingData(Base):
    """
    Staffing Domain Data Model
    Stores RN, LPN, CNA counts, ratios, and turnover metrics
    """
    __tablename__ = "staffing_data"

    id = Column(String, primary_key=True, index=True)
    facility_id = Column(String, ForeignKey("facilities.id"), index=True)
    
    # Report Period Info
    report_date = Column(Date, index=True)
    report_period = Column(String)  # e.g., "2026-Q1"
    
    # Staffing Counts
    total_rn = Column(Integer, default=0)           # Registered Nurses
    total_lpn = Column(Integer, default=0)          # Licensed Practical Nurses
    total_cna = Column(Integer, default=0)          # Certified Nursing Assistants
    total_other = Column(Integer, default=0)        # Other staff
    
    # Staffing Hours (per 100 resident days)
    rn_hours_per_100_bed_days = Column(Float, nullable=True)
    lpn_hours_per_100_bed_days = Column(Float, nullable=True)
    cna_hours_per_100_bed_days = Column(Float, nullable=True)
    total_hours_per_100_bed_days = Column(Float, nullable=True)
    
    # Turnover Rates (percentage)
    rn_turnover_rate = Column(Float, nullable=True)
    lpn_turnover_rate = Column(Float, nullable=True)
    cna_turnover_rate = Column(Float, nullable=True)
    total_staff_turnover_rate = Column(Float, nullable=True)
    
    # Adequacy Flags
    rn_adequate = Column(Boolean, default=True)
    lpn_adequate = Column(Boolean, default=True)
    cna_adequate = Column(Boolean, default=True)
    
    # Data Metadata
    data_source = Column(String)  # CMS|Self-Reported|Calculated
    data_source_date = Column(Date, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    facility = relationship("Facility", back_populates="staffing_data")
    
    def __repr__(self):
        return f"<StaffingData facility={self.facility_id} period={self.report_period}>"
