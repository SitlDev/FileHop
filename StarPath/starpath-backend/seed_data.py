"""
Sample data seeding script for StarPath backend.
Run with: python seed_data.py
"""

import json
from datetime import datetime, timedelta
import random
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
from app.database import SessionLocal, engine
from app.models.facility import Facility
from app.models.health_inspection import HealthInspection, SurveyType
from app.models.star_rating import StarRating
from app.models.deficiency import Deficiency
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationType
from app.models.staffing_data import StaffingData
from app.models.quality_measure import QualityMeasure
from app.models.benchmark import Benchmark
from app.utils.security import get_password_hash
from app.database import Base

# Sample data
FACILITY_NAMES = [
    "Sunny Valley Skilled Nursing",
    "Meadowbrook Care Center",
    "Hope Springs Senior Living",
    "Sunrise Rehabilitation Hospital",
    "Peaceful Pines Nursing Facility",
    "Golden Years Care Home",
    "Riverside Health & Wellness",
    "Heritage Senior Care",
    "Comfort Care Facility",
    "New Horizon Nursing Center",
]

DEFICIENCY_DESCRIPTIONS = [
    "Staff did not follow proper infection control procedures",
    "Resident pain management protocols not documented",
    "Medication administration errors observed",
    "Environmental safety concerns in patient rooms",
    "Inadequate nutrition and hydration monitoring",
    "Communication gaps in care team",
    "Falls prevention measures insufficient",
    "Skin care and wound management deficient",
    "Activity and social engagement programs limited",
    "Physician orders not implemented in timely manner",
]

# Sample F-tags (federal tags) for deficiencies
F_TAGS = [
    "F600", "F601", "F602", "F603", "F604", "F605", "F606", "F607", "F608", "F609",
    "F700", "F701", "F702", "F703", "F704", "F705", "F706", "F707", "F708", "F709",
]


def seed_staffing_data(db: Session, facilities: list):
    """Seed staffing data for each facility."""
    print("Creating sample staffing data...")
    staffing_records = []
    
    for facility in facilities:
        # Create 4 quarters of staffing data
        for i in range(4):
            date = datetime.now() - timedelta(days=90*i)
            staffing = StaffingData(
                id=str(uuid.uuid4()),
                facility_id=facility.id,
                report_date=date.date(),
                report_period=f"Q{4-i} 2025",
                total_rn=random.randint(8, 25),
                total_lpn=random.randint(5, 15),
                total_cna=random.randint(15, 35),
                total_other=random.randint(3, 10),
                rn_hours_per_100_bed_days=round(random.uniform(8.5, 12.5), 2),
                lpn_hours_per_100_bed_days=round(random.uniform(4.5, 7.5), 2),
                cna_hours_per_100_bed_days=round(random.uniform(12.0, 18.0), 2),
                total_hours_per_100_bed_days=round(random.uniform(25.0, 38.0), 2),
                rn_turnover_rate=round(random.uniform(5, 25), 1),
                lpn_turnover_rate=round(random.uniform(10, 30), 1),
                cna_turnover_rate=round(random.uniform(20, 45), 1),
                total_staff_turnover_rate=round(random.uniform(15, 35), 1),
                rn_adequate=random.choice([True, True, False]),
                lpn_adequate=random.choice([True, True, False]),
                cna_adequate=random.choice([True, True, False]),
                data_source="CMS",
                data_source_date=date.date(),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            staffing_records.append(staffing)
    
    db.add_all(staffing_records)
    db.commit()
    print(f"  • {len(staffing_records)} staffing records created")


def seed_quality_measures(db: Session, facilities: list):
    """Seed quality measures data for each facility."""
    print("Creating sample quality measures data...")
    qm_records = []
    
    for facility in facilities:
        # Create 4 quarters of quality measure data
        for i in range(4):
            date = datetime.now() - timedelta(days=90*i)
            qm = QualityMeasure(
                id=str(uuid.uuid4()),
                facility_id=facility.id,
                report_date=date.date(),
                report_period=f"Q{4-i} 2025",
                pressure_ulcer_percentage=round(random.uniform(0.5, 5.0), 2),
                uti_percentage=round(random.uniform(1.0, 6.0), 2),
                delirium_percentage=round(random.uniform(0.1, 4.0), 2),
                depression_percentage=round(random.uniform(1.0, 8.0), 2),
                antipsychotic_percentage=round(random.uniform(2.0, 10.0), 2),
                postop_pain_percentage=round(random.uniform(1.0, 5.0), 2),
                physical_restraints_percentage=round(random.uniform(0.1, 3.0), 2),
                readmission_rate=round(random.uniform(15.0, 35.0), 2),
                hospital_transfer_rate=round(random.uniform(10.0, 25.0), 2),
                ed_visit_rate=round(random.uniform(5.0, 15.0), 2),
                antipsychotic_short_stay_percentage=round(random.uniform(1.0, 6.0), 2),
                overall_satisfaction_score=round(random.uniform(3.5, 4.9), 1),
                care_quality_score=round(random.uniform(3.5, 4.9), 1),
                cleanliness_score=round(random.uniform(3.5, 4.9), 1),
                staff_responsiveness_score=round(random.uniform(3.5, 4.9), 1),
                data_source="CMS",
                data_source_date=date.date(),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            qm_records.append(qm)
    
    db.add_all(qm_records)
    db.commit()
    print(f"  • {len(qm_records)} quality measure records created")


def seed_benchmarks(db: Session):
    """Seed state and national benchmark data."""
    print("Creating sample benchmark data...")
    benchmark_records = []
    
    states = ["CA", "TX", "FL", "NY", "PA", None]  # None for national
    
    for state in states:
        bench = Benchmark(
            id=str(uuid.uuid4()),
            state=state,
            report_date=datetime.now().date(),
            report_period="Q4 2025",
            overall_rating_median=3.5 if state else 3.0,
            overall_rating_25th_percentile=2.5 if state else 2.0,
            overall_rating_75th_percentile=4.5 if state else 4.0,
            health_inspection_median=3.5 if state else 3.0,
            health_inspection_25th_percentile=2.5 if state else 2.0,
            health_inspection_75th_percentile=4.5 if state else 4.0,
            staffing_median=3.0 if state else 2.5,
            staffing_25th_percentile=2.0 if state else 1.5,
            staffing_75th_percentile=4.0 if state else 3.5,
            quality_measures_median=3.5 if state else 3.0,
            quality_measures_25th_percentile=2.5 if state else 2.0,
            quality_measures_75th_percentile=4.5 if state else 4.0,
            resident_satisfaction_median=4.0 if state else 3.8,
            resident_satisfaction_25th_percentile=3.0 if state else 2.8,
            resident_satisfaction_75th_percentile=4.8 if state else 4.6,
            rn_hours_per_100_bed_days_median=10.5 if state else 10.0,
            rn_hours_per_100_bed_days_25th_percentile=8.5 if state else 8.0,
            rn_hours_per_100_bed_days_75th_percentile=12.5 if state else 12.0,
            total_hours_per_100_bed_days_median=30.0 if state else 29.0,
            total_hours_per_100_bed_days_25th_percentile=25.0 if state else 24.0,
            total_hours_per_100_bed_days_75th_percentile=35.0 if state else 34.0,
            pressure_ulcer_median=2.5 if state else 2.0,
            readmission_rate_median=25.0 if state else 24.0,
            hospital_transfer_rate_median=18.0 if state else 17.0,
            antipsychotic_median=5.5 if state else 5.0,
            facility_count="1200" if state else "15000",
            data_source="CMS",
            source_url="https://www.medicare.gov/care-compare",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        benchmark_records.append(bench)
    
    db.add_all(benchmark_records)
    db.commit()
    print(f"  • {len(benchmark_records)} benchmark records created")


def seed_database():
    """Seed the database with sample data."""
    Base.metadata.create_all(bind=engine)
    
    # Apply schema migrations for deficiencies table
    try:
        db_url = os.getenv("DATABASE_URL", "sqlite:///test.db")
        if "mysql" in db_url.lower():
            with engine.begin() as connection:
                # Check and add missing columns to deficiencies
                inspector_result = connection.execute(text(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'deficiencies' AND TABLE_SCHEMA = DATABASE()"
                ))
                existing_columns = [row[0] for row in inspector_result]
                print(f"Existing deficiencies columns: {existing_columns}")
                
                columns_to_add = [
                    ("severity_level", "VARCHAR(100)"),
                    ("regulatory_citation", "VARCHAR(255)"),
                    ("remediation_date", "DATE"),
                    ("remediation_verified", "BOOLEAN"),
                    ("remediation_notes", "TEXT"),
                    ("updated_at", "DATETIME"),
                ]
                
                for col_name, col_type in columns_to_add:
                    if col_name not in existing_columns:
                        print(f"Adding column {col_name} to deficiencies table...")
                        try:
                            connection.execute(text(f"ALTER TABLE deficiencies ADD COLUMN {col_name} {col_type}"))
                            print(f"✓ Added {col_name}")
                        except Exception as e:
                            print(f"Note: Column {col_name} may already exist or error: {e}")
                    else:
                        print(f"✓ Column {col_name} already exists")
                
                print("✅ Deficiencies table schema verified")
    except Exception as e:
        print(f"⚠️  Could not verify deficiencies schema: {e}")
    
    db = SessionLocal()

    try:
        # Clear existing data
        db.query(Notification).delete()
        db.query(StarRating).delete()
        db.query(Deficiency).delete()
        db.query(HealthInspection).delete()
        db.query(StaffingData).delete()
        db.query(QualityMeasure).delete()
        db.query(Benchmark).delete()
        db.query(Facility).delete()
        db.query(User).delete()
        db.commit()

        print("Creating sample users...")
        # Create multiple test users with different roles
        admin_user = User(
            email="admin@starpath.com",
            full_name="Admin User",
            hashed_password=get_password_hash("AdminPassword123!"),
            is_active=True,
            role=UserRole.ADMIN,
        )
        
        manager_user = User(
            email="manager@starpath.com",
            full_name="Facility Manager",
            hashed_password=get_password_hash("ManagerPass123!"),
            is_active=True,
            role=UserRole.FACILITY_MANAGER,
        )
        
        demo_user = User(
            email="demo@starpath.com",
            full_name="Demo User",
            hashed_password=get_password_hash("DemoPassword123!"),
            is_active=True,
            role=UserRole.AUDITOR,
        )
        
        test_user = User(
            email="anacius@gmail.com",
            full_name="Test User",
            hashed_password=get_password_hash("TestPassword123!"),
            is_active=True,
            role=UserRole.AUDITOR,
        )
        
        db.add_all([admin_user, manager_user, demo_user, test_user])
        db.commit()
        users = [admin_user, manager_user, demo_user, test_user]
        print(f"✓ Created {len(users)} test users")
        print(f"  - admin@starpath.com (Admin)")
        print(f"  - manager@starpath.com (Facility Manager)")
        print(f"  - demo@starpath.com (Auditor)")
        print(f"  - anacius@gmail.com (Auditor)")

        print("\nCreating sample facilities...")
        facilities = []
        for i, name in enumerate(FACILITY_NAMES, 1):
            facility = Facility(
                cms_provider_id=str(100000 + i),
                name=name,
                address={
                    "street": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Elm', 'Maple', 'Pine'])} Street",
                    "city": random.choice(["Springfield", "Shelbyville", "Capital City", "Riverside", "Westville"]),
                    "state": "IL",
                    "zip": f"{random.randint(60000, 60999)}",
                },
                ownership=random.choice(["For-Profit", "Non-Profit", "Government"]),
                bed_count=random.randint(80, 250),
                is_active=True,
            )
            db.add(facility)
            facilities.append(facility)

        db.commit()
        print(f"✓ Created {len(facilities)} facilities with realistic data")

        print("\nCreating health inspections, deficiencies, and ratings...")
        notifications_to_create = []
        
        for facility in facilities:
            # Create 3 inspection cycles for each facility
            base_date = datetime.utcnow().date() - timedelta(days=365)

            for cycle in range(1, 4):
                # Survey date for this cycle
                survey_date = base_date + timedelta(days=cycle * 120)

                # Create health inspection
                inspection = HealthInspection(
                    facility_id=facility.id,
                    survey_date=survey_date,
                    survey_type=SurveyType.STANDARD if cycle <= 2 else SurveyType.REVISIT,
                    cycle=cycle,
                    revisit_count=random.randint(0, 2) if cycle == 3 else 0,
                )
                db.add(inspection)
                db.flush()

                # Create deficiencies for this inspection
                num_deficiencies = random.randint(0, 8)
                for _ in range(num_deficiencies):
                    deficiency = Deficiency(
                        health_inspection_id=inspection.id,
                        f_tag=random.choice(F_TAGS),
                        description=random.choice(DEFICIENCY_DESCRIPTIONS),
                        severity=random.choice(["1", "2", "3", "4"]),  # Severity codes
                        scope=random.choice(["D", "E", "F", "G", "H"]),  # Scope codes
                    )
                    db.add(deficiency)

                db.flush()

                # Create star rating for this inspection
                # Ratings tend to improve with recent cycles (lower deficiency count = higher rating)
                health_score = max(40, 100 - (num_deficiencies * 8) + random.randint(-5, 5))
                staffing_score = random.randint(65, 95)
                qm_score = random.randint(60, 90)

                def score_to_rating(score):
                    if score >= 90:
                        return 5
                    elif score >= 80:
                        return 4
                    elif score >= 70:
                        return 3
                    elif score >= 60:
                        return 2
                    else:
                        return 1

                overall_rating = max(
                    1,
                    min(
                        5,
                        int(
                            (
                                score_to_rating(health_score)
                                + score_to_rating(staffing_score)
                                + score_to_rating(qm_score)
                            )
                            / 3
                        ),
                    ),
                )

                rating = StarRating(
                    facility_id=facility.id,
                    effective_date=survey_date,
                    health_inspection_rating=score_to_rating(health_score),
                    staffing_rating=score_to_rating(staffing_score),
                    qm_rating=score_to_rating(qm_score),
                    overall_rating=overall_rating,
                    health_inspection_score=health_score,
                    staffing_score=staffing_score,
                    qm_score=qm_score,
                    calculation_details={
                        "deficiency_count": num_deficiencies,
                        "inspection_cycle": cycle,
                    },
                )
                db.add(rating)
                
                # Create notifications for significant rating changes
                if cycle > 1 and random.random() > 0.5:
                    notification = Notification(
                        user_id=demo_user.id,
                        facility_id=facility.id,
                        type=NotificationType.RATING_CHANGE,
                        title=f"Rating Update: {facility.name}",
                        message=f"Your facility's overall rating has changed to {overall_rating} stars.",
                        data=json.dumps({
                            "facility_id": str(facility.id),
                            "new_rating": overall_rating,
                            "previous_rating": overall_rating + random.randint(-1, 1),
                        }),
                    )
                    notifications_to_create.append(notification)

            db.commit()
            print(f"✓ Created inspections and ratings for {facility.name}")

        # Add all notifications
        if notifications_to_create:
            db.add_all(notifications_to_create)
            db.commit()
            print(f"✓ Created {len(notifications_to_create)} notifications")

        # Seed new data types for expanded reports
        seed_staffing_data(db, facilities)
        seed_quality_measures(db, facilities)
        seed_benchmarks(db)

        print("\n" + "=" * 60)
        print("✅ Sample data seeding completed successfully!")
        print("=" * 60)
        print("\nTest Credentials:")
        print("  Admin:              admin@starpath.com / AdminPassword123!")
        print("  Manager:            manager@starpath.com / ManagerPass123!")
        print("  Demo User:          demo@starpath.com / DemoPassword123!")
        print("  Test User:          anacius@gmail.com / TestPassword123!")
        print(f"\nDatabase Summary:")
        print(f"  • {len(users)} test users created")
        print(f"  • {len(facilities)} facilities with realistic data")
        print(f"  • 3 inspection cycles per facility")
        print(f"  • Health inspection deficiencies per cycle")
        print(f"  • Star ratings for each inspection")
        print(f"  • {len(notifications_to_create)} sample notifications")
        print("\nYou can now:")
        print("  1. Start backend:  cd starpath-backend && railway shell")
        print("  2. Login with test credentials above")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
