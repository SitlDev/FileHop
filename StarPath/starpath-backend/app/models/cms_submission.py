"""
CMS Submission Tracking Model
Tracks all submissions to CMS for compliance and audit purposes
"""
from sqlalchemy import Column, String, DateTime, Text, Enum, Boolean, Integer
from sqlalchemy.dialects.sqlite import JSON
from datetime import datetime, timezone
import enum
from app.database import Base
import uuid

class SubmissionStatus(str, enum.Enum):
    """CMS submission status"""
    PENDING = "pending"
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    FAILED = "failed"
    VALIDATION_ERROR = "validation_error"

class CMSSubmission(Base):
    """Track CMS data submissions"""
    __tablename__ = "cms_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    facility_id = Column(String(36), nullable=False, index=True)
    facility_name = Column(String(255), nullable=False)
    cms_provider_id = Column(String(10), nullable=False, index=True)
    
    # Submission details
    submission_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    submission_type = Column(String(50))  # "facility_data", "ratings", "inspections", "batch"
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING, index=True)
    
    # Data submitted
    data_format = Column(String(20))  # "json" or "xml"
    data_version = Column(String(50))  # CMS format version
    submission_data = Column(JSON)  # The actual data submitted
    
    # Validation
    validation_errors = Column(JSON)  # Any validation errors
    validation_passed = Column(Boolean, default=False)
    
    # Response from CMS
    cms_response = Column(JSON)  # Response from CMS API (if implemented)
    cms_confirmation_id = Column(String(100), nullable=True)  # Confirmation number from CMS
    cms_response_date = Column(DateTime, nullable=True)
    
    # Audit trail
    submitted_by = Column(String(36), nullable=True)  # User ID who submitted
    notes = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    last_retry_date = Column(DateTime, nullable=True)
    
    # Metadata
    record_count = Column(Integer, default=0)  # Number of records in submission
    submission_batch_id = Column(String(36), nullable=True)  # For batch submissions
    
    def __repr__(self):
        return f"<CMSSubmission(facility={self.facility_name}, status={self.status}, date={self.submission_date})>"
