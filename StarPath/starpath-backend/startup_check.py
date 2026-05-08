#!/usr/bin/env python3
"""
Railway startup verification script
Checks all required environment variables and connectivity
Run with: python3 startup_check.py
"""
import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_startup():
    """Verify all startup requirements"""
    
    print("\n" + "="*70)
    print("🚀 RAILWAY STARTUP VERIFICATION")
    print("="*70)
    
    issues = []
    warnings = []
    
    # Check environment variables
    print("\n📋 Environment Variables:")
    
    database_url = os.getenv("DATABASE_URL")
    secret_key = os.getenv("SECRET_KEY")
    allowed_origins = os.getenv("ALLOWED_ORIGINS")
    port = os.getenv("PORT")
    
    # DATABASE_URL
    if database_url:
        is_mysql = "mysql" in database_url.lower()
        masked = database_url.split("@")[0].split("://")[1] if "@" in database_url else "***"
        masked = database_url.replace(masked, "***:***") if "@" in database_url else database_url
        print(f"  ✅ DATABASE_URL: Set ({masked})")
        if not is_mysql:
            warnings.append("DATABASE_URL is not MySQL (local SQLite detected)")
    else:
        print(f"  ❌ DATABASE_URL: NOT SET")
        issues.append("DATABASE_URL must be set (Railway MySQL plugin should set this)")
    
    # SECRET_KEY
    if secret_key and secret_key != "dev-secret-key-change-in-production":
        print(f"  ✅ SECRET_KEY: Set (***{secret_key[-8:]})")
    else:
        print(f"  ❌ SECRET_KEY: NOT SET or using default")
        issues.append("SECRET_KEY must be set to a secure random value")
    
    # ALLOWED_ORIGINS
    if allowed_origins:
        print(f"  ✅ ALLOWED_ORIGINS: {allowed_origins}")
    else:
        print(f"  ⚠️  ALLOWED_ORIGINS: NOT SET (using default: http://localhost:3000)")
        warnings.append("ALLOWED_ORIGINS should match your frontend domain")
    
    # PORT
    if port:
        print(f"  ✅ PORT: {port}")
    else:
        print(f"  ⚠️  PORT: NOT SET (will use 8000)")
        warnings.append("Railway usually sets PORT automatically")
    
    # Test imports
    print("\n🔧 Testing Dependencies:")
    deps = {
        "fastapi": "FastAPI framework",
        "sqlalchemy": "Database ORM",
        "mysql.connector": "MySQL driver",
    }
    
    for module, description in deps.items():
        try:
            __import__(module)
            print(f"  ✅ {module}: {description}")
        except ImportError:
            print(f"  ❌ {module}: {description} - MISSING")
            issues.append(f"Missing dependency: {module}")
    
    # Test database connectivity
    if database_url:
        print("\n🔌 Testing Database Connectivity:")
        try:
            from app.database import engine
            with engine.connect() as conn:
                result = conn.execute(__import__("sqlalchemy", fromlist=["text"]).text("SELECT 1"))
                print(f"  ✅ Database connection successful")
        except Exception as e:
            print(f"  ❌ Database connection failed: {str(e)}")
            issues.append(f"Cannot connect to database: {str(e)}")
    
    # Summary
    print("\n" + "="*70)
    if issues:
        print(f"❌ STARTUP BLOCKED - {len(issues)} critical issue(s):\n")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
        print("\n" + "="*70 + "\n")
        return False
    else:
        if warnings:
            print(f"⚠️  Startup OK - {len(warnings)} warning(s):\n")
            for i, warn in enumerate(warnings, 1):
                print(f"  {i}. {warn}")
        else:
            print(f"✅ ALL CHECKS PASSED - Ready for startup!\n")
        print("="*70 + "\n")
        return True

if __name__ == "__main__":
    success = check_startup()
    sys.exit(0 if success else 1)
