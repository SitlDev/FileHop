from pydantic_settings import BaseSettings
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    PROJECT_NAME: str = "StarPath SNF"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database URL from environment (Railway sets this for MySQL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    
    # AWS Settings (Optional for local dev)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_UPLOADS: str = "starpath-uploads"
    
    # CMS Integration Settings
    CMS_ENABLED: bool = True
    CMS_API_BASE_URL: str = "https://api.cms.gov/five-star/v1"  # Will be configured per environment
    CMS_API_KEY: Optional[str] = None  # Set in production
    CMS_API_SECRET: Optional[str] = None  # Set in production
    CMS_TIMEOUT_SECONDS: int = 30
    CMS_MAX_RETRIES: int = 3
    CMS_RETRY_DELAY_SECONDS: int = 300  # 5 minutes between retries
    CMS_MOCK_MODE: bool = True  # Use mock responses for development/testing
    
    # Export Settings
    CMS_EXPORT_DIR: str = "/tmp/cms_exports"  # Directory to store exported files
    CMS_KEEP_EXPORTS: bool = True  # Keep export files for audit trail
    
    # Rate Limiting
    RATE_LIMIT_CMS_EXPORTS: int = 100  # Per hour
    RATE_LIMIT_CMS_SUBMISSIONS: int = 50  # Per hour
    
    class Config:
        case_sensitive = True
        env_file = ".env"
    
    def __init__(self, **data):
        super().__init__(**data)
        logger.info(f"Settings loaded: DATABASE_URL={self.DATABASE_URL[:50] if self.DATABASE_URL else 'NOT SET'}...")
        logger.info(f"Settings loaded: SECRET_KEY={'SET' if self.SECRET_KEY and self.SECRET_KEY != 'dev-secret-key-change-in-production' else 'DEFAULT'}")

settings = Settings()
    
    # AWS Settings (Optional for local dev)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_UPLOADS: str = "starpath-uploads"
    
    # CMS Integration Settings
    CMS_ENABLED: bool = True
    CMS_API_BASE_URL: str = "https://api.cms.gov/five-star/v1"  # Will be configured per environment
    CMS_API_KEY: Optional[str] = None  # Set in production
    CMS_API_SECRET: Optional[str] = None  # Set in production
    CMS_TIMEOUT_SECONDS: int = 30
    CMS_MAX_RETRIES: int = 3
    CMS_RETRY_DELAY_SECONDS: int = 300  # 5 minutes between retries
    CMS_MOCK_MODE: bool = True  # Use mock responses for development/testing
    
    # Export Settings
    CMS_EXPORT_DIR: str = "/tmp/cms_exports"  # Directory to store exported files
    CMS_KEEP_EXPORTS: bool = True  # Keep export files for audit trail
    
    # Rate Limiting
    RATE_LIMIT_CMS_EXPORTS: int = 100  # Per hour
    RATE_LIMIT_CMS_SUBMISSIONS: int = 50  # Per hour
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
