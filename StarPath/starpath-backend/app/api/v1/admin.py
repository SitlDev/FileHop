from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.user import User as UserModel, UserRole
from app.models.facility import Facility
from app.models.star_rating import StarRating
from app.models.health_inspection import HealthInspection
from app.models.staffing_data import StaffingData
from app.models.quality_measure import QualityMeasure
from app.models.benchmark import Benchmark
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
                'inspection_type': i.survey_type.value.upper() if i.survey_type else 'Unknown',
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

# ==================== NEW REPORT ENDPOINTS ====================

@router.get("/reports/staffing/{facility_id}")
async def download_staffing_report(
    facility_id: str,
    time_range: str = Query("quarterly"),
    include_comparative: bool = Query(False),
    format: str = Query("pdf"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download staffing domain report"""
    permissions = get_user_permissions(current_user)
    if not permissions.get("download_reports"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    
    # Get staffing data
    staffing_records = db.query(StaffingData).filter(
        StaffingData.facility_id == facility_id
    ).order_by(StaffingData.report_date.desc()).limit(12).all()
    
    # Get benchmark data
    benchmarks = db.query(Benchmark).filter(
        Benchmark.state.isnot(None)  # State benchmarks
    ).order_by(Benchmark.report_date.desc()).limit(2).all()
    
    national_benchmark = db.query(Benchmark).filter(
        Benchmark.state.is_(None)  # National benchmark
    ).order_by(Benchmark.report_date.desc()).first()
    
    generator = ReportGenerator("Staffing Domain Report")
    
    staffing_data_list = [
        {
            'report_date': s.report_date.isoformat() if s.report_date else 'N/A',
            'report_period': s.report_period,
            'rn_count': s.total_rn,
            'lpn_count': s.total_lpn,
            'cna_count': s.total_cna,
            'rn_hours_per_100_bed_days': s.rn_hours_per_100_bed_days,
            'lpn_hours_per_100_bed_days': s.lpn_hours_per_100_bed_days,
            'cna_hours_per_100_bed_days': s.cna_hours_per_100_bed_days,
            'total_hours_per_100_bed_days': s.total_hours_per_100_bed_days,
            'rn_turnover_rate': s.rn_turnover_rate,
            'lpn_turnover_rate': s.lpn_turnover_rate,
            'cna_turnover_rate': s.cna_turnover_rate,
            'data_source': s.data_source
        } for s in staffing_records
    ]
    
    benchmarks = {
        'state': [
            {
                'state': b.state,
                'rn_hours_median': b.rn_hours_per_100_bed_days_median,
                'total_hours_median': b.total_hours_per_100_bed_days_median
            } for b in benchmarks
        ] if benchmarks else [],
        'national': {
            'rn_hours_median': national_benchmark.rn_hours_per_100_bed_days_median,
            'total_hours_median': national_benchmark.total_hours_per_100_bed_days_median
        } if national_benchmark else {}
    }
    
    # Determine output format
    if format.lower() == "csv":
        export_buffer = generator.export_staffing_data_to_csv(staffing_data_list)
        media_type = "text/csv"
        file_ext = "csv"
    elif format.lower() == "excel":
        export_buffer = generator.export_staffing_data_to_excel(staffing_data_list)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        file_ext = "xlsx"
    else:
        # Default to PDF
        export_buffer = generator.generate_staffing_report(
            facility_name=facility.name,
            staffing_data=staffing_data_list,
            benchmarks=benchmarks,
            include_comparative=include_comparative
        )
        media_type = "application/pdf"
        file_ext = "pdf"
    
    return StreamingResponse(
        iter([export_buffer.getvalue()]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={facility.name.replace(' ', '_')}_Staffing_Report_{datetime.now().strftime('%Y%m%d')}.{file_ext}"}
    )

@router.get("/reports/quality-measures/{facility_id}")
async def download_quality_measures_report(
    facility_id: str,
    time_range: str = Query("quarterly"),
    include_comparative: bool = Query(False),
    format: str = Query("pdf"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download quality measures domain report"""
    permissions = get_user_permissions(current_user)
    if not permissions.get("download_reports"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    
    # Get quality measures data
    qm_records = db.query(QualityMeasure).filter(
        QualityMeasure.facility_id == facility_id
    ).order_by(QualityMeasure.report_date.desc()).limit(12).all()
    
    # Get benchmark data
    benchmarks = db.query(Benchmark).filter(
        Benchmark.state.isnot(None)
    ).order_by(Benchmark.report_date.desc()).limit(2).all()
    
    national_benchmark = db.query(Benchmark).filter(
        Benchmark.state.is_(None)
    ).order_by(Benchmark.report_date.desc()).first()
    
    generator = ReportGenerator("Quality Measures Report")
    
    quality_data_list = [
        {
            'report_date': q.report_date.isoformat() if q.report_date else 'N/A',
            'report_period': q.report_period,
            'pressure_ulcer_percentage': q.pressure_ulcer_percentage,
            'uti_percentage': q.uti_percentage,
            'delirium_percentage': q.delirium_percentage,
            'depression_percentage': q.depression_percentage,
            'antipsychotic_percentage': q.antipsychotic_percentage,
            'readmission_rate': q.readmission_rate,
            'hospital_transfer_rate': q.hospital_transfer_rate,
            'ed_visit_rate': q.ed_visit_rate,
            'data_source': q.data_source
        } for q in qm_records
    ]
    
    benchmarks = {
        'state': [
            {
                'state': b.state,
                'pressure_ulcer_median': b.pressure_ulcer_median,
                'readmission_median': b.readmission_rate_median
            } for b in benchmarks
        ] if benchmarks else [],
        'national': {
            'pressure_ulcer_median': national_benchmark.pressure_ulcer_median,
            'readmission_median': national_benchmark.readmission_rate_median
        } if national_benchmark else {}
    }
    
    # Determine output format
    if format.lower() == "csv":
        export_buffer = generator.export_quality_data_to_csv(quality_data_list)
        media_type = "text/csv"
        file_ext = "csv"
    elif format.lower() == "excel":
        export_buffer = generator.export_quality_data_to_excel(quality_data_list)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        file_ext = "xlsx"
    else:
        # Default to PDF
        export_buffer = generator.generate_quality_measures_report(
            facility_name=facility.name,
            quality_data=quality_data_list,
            benchmarks=benchmarks,
            include_comparative=include_comparative
        )
        media_type = "application/pdf"
        file_ext = "pdf"
    
    return StreamingResponse(
        iter([export_buffer.getvalue()]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={facility.name.replace(' ', '_')}_Quality_Measures_{datetime.now().strftime('%Y%m%d')}.{file_ext}"}
    )

@router.get("/reports/comparative/{facility_id}")
async def download_comparative_report(
    facility_id: str,
    time_range: str = Query("quarterly"),
    format: str = Query("pdf"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download comparative analysis report (facility vs benchmarks)"""
    permissions = get_user_permissions(current_user)
    if not permissions.get("download_reports"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    
    # Get latest facility ratings
    latest_rating = db.query(StarRating).filter(
        StarRating.facility_id == facility_id
    ).order_by(StarRating.effective_date.desc()).first()
    
    # Get state benchmarks (first state found)
    state_benchmark = db.query(Benchmark).filter(
        Benchmark.state.isnot(None)
    ).order_by(Benchmark.report_date.desc()).first()
    
    # Get national benchmark
    national_benchmark = db.query(Benchmark).filter(
        Benchmark.state.is_(None)
    ).order_by(Benchmark.report_date.desc()).first()
    
    generator = ReportGenerator("Comparative Analysis Report")
    
    facility_ratings = {
        'overall_rating': latest_rating.overall_rating if latest_rating else 0,
        'health_inspection_rating': latest_rating.health_inspection_rating if latest_rating else 0,
        'staffing_rating': latest_rating.staffing_rating if latest_rating else 0,
        'qm_rating': latest_rating.qm_rating if latest_rating else 0,
    }
    state_bench = {
        'overall_median': state_benchmark.overall_rating_median if state_benchmark else None,
        'health_inspection_median': state_benchmark.health_inspection_median if state_benchmark else None,
        'staffing_median': state_benchmark.staffing_median if state_benchmark else None,
        'qm_median': state_benchmark.quality_measures_median if state_benchmark else None,
    }
    national_bench = {
        'overall_median': national_benchmark.overall_rating_median if national_benchmark else None,
        'health_inspection_median': national_benchmark.health_inspection_median if national_benchmark else None,
        'staffing_median': national_benchmark.staffing_median if national_benchmark else None,
        'qm_median': national_benchmark.quality_measures_median if national_benchmark else None,
    }
    
    # Determine output format
    if format.lower() == "csv":
        # For CSV, export as comparison table
        comp_data = [{
            'Domain': 'Overall Rating',
            'Your Facility': facility_ratings.get('overall_rating', 'N/A'),
            'State Median': state_bench.get('overall_median', 'N/A'),
            'National Median': national_bench.get('overall_median', 'N/A')
        }, {
            'Domain': 'Health Inspections',
            'Your Facility': facility_ratings.get('health_inspection_rating', 'N/A'),
            'State Median': state_bench.get('health_inspection_median', 'N/A'),
            'National Median': national_bench.get('health_inspection_median', 'N/A')
        }, {
            'Domain': 'Staffing',
            'Your Facility': facility_ratings.get('staffing_rating', 'N/A'),
            'State Median': state_bench.get('staffing_median', 'N/A'),
            'National Median': national_bench.get('staffing_median', 'N/A')
        }, {
            'Domain': 'Quality Measures',
            'Your Facility': facility_ratings.get('qm_rating', 'N/A'),
            'State Median': state_bench.get('qm_median', 'N/A'),
            'National Median': national_bench.get('qm_median', 'N/A')
        }]
        export_buffer = generator.export_comparative_data_to_csv(comp_data)
        media_type = "text/csv"
        file_ext = "csv"
    elif format.lower() == "excel":
        # For Excel, export as comparison table
        comp_data = [{
            'Domain': 'Overall Rating',
            'Your Facility': facility_ratings.get('overall_rating', 'N/A'),
            'State Median': state_bench.get('overall_median', 'N/A'),
            'National Median': national_bench.get('overall_median', 'N/A')
        }, {
            'Domain': 'Health Inspections',
            'Your Facility': facility_ratings.get('health_inspection_rating', 'N/A'),
            'State Median': state_bench.get('health_inspection_median', 'N/A'),
            'National Median': national_bench.get('health_inspection_median', 'N/A')
        }, {
            'Domain': 'Staffing',
            'Your Facility': facility_ratings.get('staffing_rating', 'N/A'),
            'State Median': state_bench.get('staffing_median', 'N/A'),
            'National Median': national_bench.get('staffing_median', 'N/A')
        }, {
            'Domain': 'Quality Measures',
            'Your Facility': facility_ratings.get('qm_rating', 'N/A'),
            'State Median': state_bench.get('qm_median', 'N/A'),
            'National Median': national_bench.get('qm_median', 'N/A')
        }]
        export_buffer = generator.export_comparative_data_to_excel(comp_data)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        file_ext = "xlsx"
    else:
        # Default to PDF
        export_buffer = generator.generate_comparative_report(
            facility_name=facility.name,
            facility_ratings=facility_ratings,
            state_benchmark=state_bench,
            national_benchmark=national_bench
        )
        media_type = "application/pdf"
        file_ext = "pdf"
    
    return StreamingResponse(
        iter([export_buffer.getvalue()]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={facility.name.replace(' ', '_')}_Comparative_Analysis_{datetime.now().strftime('%Y%m%d')}.{file_ext}"}
    )

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
