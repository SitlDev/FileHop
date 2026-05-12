from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("Starting StarPath backend application...")

from app.api.v1 import auth, facilities, ratings, uploads, health_inspections, admin, cms
# Import models to register them with SQLAlchemy
from app.models import user, facility, health_inspection, deficiency, star_rating, notification, cms_submission, staffing_data, quality_measure, benchmark
from app.database import Base, engine

app = FastAPI(
    title="StarPath SNF API",
    description="SaaS platform for skilled nursing facilities to optimize their CMS Five-Star Quality Rating.",
    version="1.0.0"
)

# Set up CORS - use environment variable for production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all tables on startup
@app.on_event("startup")
async def create_tables():
    """Create all database tables on application startup"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {str(e)}")
        raise

@app.get("/")
async def root():
    return {"message": "Welcome to StarPath SNF API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/debug/config")
async def debug_config():
    """Debug endpoint to see what env vars are actually set"""
    import json
    all_vars = {k: v for k, v in os.environ.items()}
    
    # Filter out sensitive ones but show database-related vars
    safe_vars = {}
    for k, v in all_vars.items():
        if any(x in k.upper() for x in ['DATABASE', 'DB', 'MYSQL', 'SQL', 'URL']):
            safe_vars[k] = v
        elif k in ['ALGORITHM', 'NODE_ENV', 'ENVIRONMENT']:
            safe_vars[k] = v
    
    return {
        "status": "debug",
        "database_like_vars": safe_vars,
        "all_var_keys": sorted(all_vars.keys()),
        "config": {
            "SECRET_KEY": "***HIDDEN***" if os.getenv("SECRET_KEY") else "NOT SET",
            "DATABASE_URL": os.getenv("DATABASE_URL", "NOT SET"),
            "ALLOWED_ORIGINS": os.getenv("ALLOWED_ORIGINS", "NOT SET"),
            "ALGORITHM": os.getenv("ALGORITHM", "NOT SET"),
        }
    }

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(facilities.router, prefix="/api/v1/facilities", tags=["Facilities"])
app.include_router(ratings.router, prefix="/api/v1/ratings", tags=["Ratings"])
app.include_router(health_inspections.router, prefix="/api/v1/inspections", tags=["Health Inspections"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["Uploads"])
app.include_router(admin.router, prefix="/api/v1", tags=["Reports, Notifications, Admin"])
app.include_router(cms.router, prefix="/api/v1/cms", tags=["CMS Integration"])
