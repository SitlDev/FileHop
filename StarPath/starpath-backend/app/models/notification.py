from sqlalchemy import Column, String, DateTime, Boolean, Enum, ForeignKey
import uuid
from datetime import datetime
from app.database import Base, GUID
import enum

class NotificationType(str, enum.Enum):
    NEW_INSPECTION = "new_inspection"
    RATING_CHANGE = "rating_change"
    LOW_RATING_ALERT = "low_rating_alert"
    SYSTEM_MESSAGE = "system_message"
    REPORT_READY = "report_ready"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    data = Column(String(2000), nullable=True)  # JSON string for additional context
    is_read = Column(Boolean, default=False)
    facility_id = Column(GUID, nullable=True)  # Optional link to facility
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
