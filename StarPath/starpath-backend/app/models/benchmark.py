from sqlalchemy import Column, String, Float, Date, DateTime
from datetime import datetime
from app.database import Base


class Benchmark(Base):
    """
    Benchmark Data Model
    Stores state and national benchmark data for comparison
    """
    __tablename__ = "benchmarks"

    id = Column(String, primary_key=True, index=True)
    
    # Geographic Scope
    state = Column(String, nullable=True, index=True)  # Null for national, State name for state-level
    report_date = Column(Date, index=True)
    report_period = Column(String)  # e.g., "2026-Q1"
    
    # Overall Rating Benchmarks (median, percentiles)
    overall_rating_median = Column(Float, nullable=True)
    overall_rating_25th_percentile = Column(Float, nullable=True)
    overall_rating_75th_percentile = Column(Float, nullable=True)
    
    # Four-Domain Rating Benchmarks (medians)
    health_inspection_median = Column(Float, nullable=True)
    health_inspection_25th_percentile = Column(Float, nullable=True)
    health_inspection_75th_percentile = Column(Float, nullable=True)
    
    staffing_median = Column(Float, nullable=True)
    staffing_25th_percentile = Column(Float, nullable=True)
    staffing_75th_percentile = Column(Float, nullable=True)
    
    quality_measures_median = Column(Float, nullable=True)
    quality_measures_25th_percentile = Column(Float, nullable=True)
    quality_measures_75th_percentile = Column(Float, nullable=True)
    
    resident_satisfaction_median = Column(Float, nullable=True)
    resident_satisfaction_25th_percentile = Column(Float, nullable=True)
    resident_satisfaction_75th_percentile = Column(Float, nullable=True)
    
    # Staffing Benchmarks (hours per 100 bed days)
    rn_hours_per_100_bed_days_median = Column(Float, nullable=True)
    rn_hours_per_100_bed_days_25th_percentile = Column(Float, nullable=True)
    rn_hours_per_100_bed_days_75th_percentile = Column(Float, nullable=True)
    
    total_hours_per_100_bed_days_median = Column(Float, nullable=True)
    total_hours_per_100_bed_days_25th_percentile = Column(Float, nullable=True)
    total_hours_per_100_bed_days_75th_percentile = Column(Float, nullable=True)
    
    # Quality Measure Benchmarks (percentages or rates)
    pressure_ulcer_median = Column(Float, nullable=True)
    readmission_rate_median = Column(Float, nullable=True)
    hospital_transfer_rate_median = Column(Float, nullable=True)
    antipsychotic_median = Column(Float, nullable=True)
    
    # Number of facilities in benchmark
    facility_count = Column(String, nullable=True)  # E.g., "4,250 facilities"
    
    # Data Source Info
    data_source = Column(String)  # CMS|Industry
    source_url = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        scope = self.state or "National"
        return f"<Benchmark {scope} {self.report_period}>"
