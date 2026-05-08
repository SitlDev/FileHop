from sqlalchemy import create_engine, text, String, TypeDecorator
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
import logging
import os
import uuid

logger = logging.getLogger(__name__)

# MySQL-compatible UUID type
class GUID(TypeDecorator):
    """Platform-independent GUID type that uses CHAR(36) in MySQL and UUID in PostgreSQL"""
    impl = String(36)
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return str(value)
        return value
    
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(value)

# Use DATABASE_URL from settings (reads from environment)
try:
    db_url = settings.DATABASE_URL
    logger.info(f"Initializing database with URL: {db_url[:50]}...")
    
    # Determine if MySQL or SQLite
    is_mysql = "mysql" in db_url.lower()
    
    # Build engine with appropriate settings
    if is_mysql:
        # MySQL-specific configuration
        engine = create_engine(
            db_url,
            pool_size=10,  # Connection pool size
            max_overflow=20,  # Additional connections beyond pool_size
            pool_pre_ping=True,  # Verify connection is alive before using
            pool_recycle=3600,  # Recycle connections after 1 hour (RDS timeout)
            echo=False,  # Set to True for SQL debugging
            connect_args={
                "connect_timeout": 10,
                "charset": "utf8mb4",
            }
        )
        logger.info("✅ MySQL database engine created successfully")
    else:
        # SQLite configuration for local development
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
            echo=False,
        )
        logger.info("✅ SQLite database engine created successfully")
        
except Exception as e:
    logger.error(f"❌ Failed to create database engine: {str(e)}")
    logger.error(f"DATABASE_URL was: {settings.DATABASE_URL[:50]}...")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
