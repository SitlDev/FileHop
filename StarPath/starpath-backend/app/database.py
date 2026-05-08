from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Use DATABASE_URL from settings (reads from environment)
try:
    db_url = settings.DATABASE_URL
    logger.info(f"Initializing database with URL: {db_url[:50]}...")
    
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False} if "sqlite" in db_url else {},
        pool_pre_ping=True,  # Verify connection is alive before using
        echo=False,  # Set to True for SQL debugging
    )
    logger.info("✅ Database engine created successfully")
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
