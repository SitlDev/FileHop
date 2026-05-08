from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.user import User as UserModel, UserRole
from app.models.facility import Facility
from app.models.star_rating import StarRating
from app.models.health_inspection import HealthInspection
from app.models.notification import Notification, NotificationType
from app.schemas.notification import Notification as NotificationSchema, NotificationUpdate
from app.schemas.user import UserPermissions
from app.utils.rbac import require_admin, require_facility_manager, get_user_permissions
from app.api.v1.auth import get_current_user
from app.services.report_generator import ReportGenerator
from app.services.websocket_manager import manager
from fastapi.responses import FileResponse, StreamingResponse
import json
from datetime import datetime, timezone
import uuid

router = APIRouter()

# ==================== REPORTS ENDPOINTS ====================

@router.get("/reports/facility/{facility_id}")
async def download_facility_report(
    facility_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download comprehensive facility report as PDF"""
    # Verify user has permission
    permissions = get_user_permissions(current_user)
    if not permissions.get("download_reports"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to download reports"
        )
    
    # Get facility
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found"
        )
    
    # Get latest ratings
    ratings = db.query(StarRating).filter(
        StarRating.facility_id == facility_id
    ).order_by(StarRating.effective_date.desc()).limit(12).all()
    
    # Get recent inspections
    inspections = db.query(HealthInspection).filter(
        HealthInspection.facility_id == facility_id
    ).order_by(HealthInspection.survey_date.desc()).limit(10).all()
    
    # Generate PDF
    generator = ReportGenerator("Facility Report")
    pdf_buffer = generator.generate_facility_report(
        facility_name=facility.name,
        facility_data={
            'cms_provider_id': facility.cms_provider_id,
            'bed_count': facility.bed_count,
            'address': facility.address or {},
            'ownership': facility.ownership or '',
            'is_active': facility.is_active
        },
        ratings_data=[
            {
                'overall_rating': r.overall_rating,
                'health_inspection_rating': r.health_inspection_rating,
                'staffing_rating': r.staffing_rating,
                'qm_rating': r.qm_rating,
                'effective_date': r.effective_date.isoformat() if r.effective_date else 'N/A'
            } for r in ratings
        ],
        inspections_data=[
            {
                'inspection_date': i.survey_date.isoformat() if i.survey_date else 'N/A',
                'inspection_type': i.survey_type or 'Unknown',
                'status': 'Completed',
                'deficiencies': []
            } for i in inspections
        ]
    )
    
    # Return as streaming response for BytesIO
    return StreamingResponse(
        iter([pdf_buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={facility.name.replace(' ', '_')}_Report_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )

@router.get("/reports/ratings-trend/{facility_id}")
async def download_ratings_trend_report(
    facility_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download ratings trend analysis report"""
    permissions = get_user_permissions(current_user)
    if not permissions.get("download_reports"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to download reports"
        )
    
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facility not found"
        )
    
    ratings = db.query(StarRating).filter(
        StarRating.facility_id == facility_id
    ).order_by(StarRating.effective_date.desc()).limit(24).all()
    
    generator = ReportGenerator("Ratings Trend Report")
    pdf_buffer = generator.generate_ratings_trend_report(
        facility_name=facility.name,
        ratings_history=[
            {
                'overall_rating': r.overall_rating,
                'health_inspection_rating': r.health_inspection_rating,
                'staffing_rating': r.staffing_rating,
                'qm_rating': r.qm_rating,
                'effective_date': r.effective_date.isoformat() if r.effective_date else 'N/A',
                'trend': 'stable'
            } for r in ratings
        ]
    )
    
    return StreamingResponse(
        iter([pdf_buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={facility.name.replace(' ', '_')}_Ratings_Trend_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )

# ==================== NOTIFICATIONS ENDPOINTS ====================

@router.get("/notifications", response_model=list[NotificationSchema])
def get_notifications(
    current_user: UserModel = Depends(get_current_user),
    skip: int = Query(0),
    limit: int = Query(50),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get user's notifications"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.get("/notifications/unread-count")
def get_unread_count(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.patch("/notifications/{notification_id}", response_model=NotificationSchema)
def mark_notification_read(
    notification_id: str,
    update: NotificationUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read/unread"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if update.is_read is not None:
        notification.is_read = update.is_read
    
    db.commit()
    db.refresh(notification)
    return notification

@router.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}

@router.post("/notifications/mark-all-read")
def mark_all_read(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

# ==================== WEBSOCKET ENDPOINT ====================

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(user_id: str, websocket: WebSocket):
    """WebSocket endpoint for real-time notifications"""
    import uuid as uuid_module
    import logging
    from app.database import get_db
    logger = logging.getLogger(__name__)
    
    logger.info(f"WebSocket connection attempt for user_id: {user_id}")
    
    # Verify user exists - do this outside the main connection loop
    try:
        # Convert string user_id to UUID for comparison
        try:
            user_uuid = uuid_module.UUID(user_id)
        except (ValueError, TypeError):
            logger.warning(f"Invalid UUID format: {user_id}")
            await websocket.close(code=4004, reason="Invalid user ID format")
            return
        
        # Create a temporary session just for verification
        db = SessionLocal()
        try:
            user = db.query(UserModel).filter(UserModel.id == user_uuid).first()
            if not user:
                logger.warning(f"User not found for UUID: {user_uuid}")
                await websocket.close(code=4004, reason="User not found")
                return
            user_email = user.email
            logger.info(f"WebSocket authenticated for user: {user_email}")
        finally:
            db.close()  # Release database connection immediately after verification
        
    except Exception as e:
        logger.error(f"WebSocket auth error: {str(e)}", exc_info=True)
        await websocket.close(code=4004, reason="Authentication failed")
        return
    
    # Now accept the connection and manage it without holding a database session
    await manager.connect(user_id, websocket)
    logger.info(f"WebSocket manager connected for user_id: {user_id}")
    try:
        while True:
            # Keep connection alive and listen for any client messages
            data = await websocket.receive_text()
            logger.debug(f"WebSocket message from {user_id}: {data}")
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user: {user_id}")
        manager.disconnect(user_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}", exc_info=True)
        manager.disconnect(user_id, websocket)

# ==================== PERMISSIONS ENDPOINT ====================

@router.get("/users/me/permissions", response_model=UserPermissions)
def get_current_user_permissions(
    current_user: UserModel = Depends(get_current_user)
):
    """Get current user's permissions"""
    permissions = get_user_permissions(current_user)
    return permissions

# ==================== USER ROLE MANAGEMENT (ADMIN ONLY) ====================

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    new_role: UserRole,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user's role (admin only)"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = new_role
    db.commit()
    db.refresh(user)
    
    # Notify user of role change
    notification = Notification(
        id=uuid.uuid4(),
        user_id=user.id,
        type=NotificationType.SYSTEM_MESSAGE,
        title="Role Updated",
        message=f"Your role has been changed to {new_role.value}",
        is_read=False
    )
    db.add(notification)
    db.commit()
    
    # Send WebSocket notification
    await manager.send_personal_message(str(user.id), {
        "type": "system_message",
        "title": "Role Updated",
        "message": f"Your role has been changed to {new_role.value}"
    })
    
    return {"message": f"User role updated to {new_role.value}"}

@router.get("/users")
def list_users(
    current_user: UserModel = Depends(require_admin),
    skip: int = Query(0),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    """List all users (admin only)"""
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value if u.role else "facility_manager",
            "is_active": u.is_active,
            "created_at": u.created_at,
        } for u in users
    ]
