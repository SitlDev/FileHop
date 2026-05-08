# StarPath Backend - Configuration Fixes & Implementation Guide

## Overview
This document provides specific code fixes for the critical issues identified in the backend audit.

---

## FIX #1: CORS Configuration

### Status
🔴 **CRITICAL** - Login/registration fails in browser

### Current Code
**File:** [app/main.py](app/main.py#L14-L20)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Fixed Code
Replace with:

```python
import os

# Parse CORS origins from environment
CORS_ORIGINS_STR = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:3000"  # Default for local development
)
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_STR.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### Environment Variables to Set

**Local Development:**
```bash
export CORS_ORIGINS="http://localhost:3000"
```

**Railway Production:**
```bash
railway variables set CORS_ORIGINS="https://starpath-frontend-xxxx.up.railway.app"
```

### Testing
```bash
# Test CORS headers are present
curl -i http://localhost:8000/api/v1/health

# Should see:
# access-control-allow-origin: http://localhost:3000
# access-control-allow-credentials: true
```

---

## FIX #2: Security Configuration

### Status
🔴 **CRITICAL** - Hardcoded secret key exposes all JWT tokens

### Current Code
**File:** [app/utils/security.py](app/utils/security.py#L1-L10)

```python
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))
```

### Fixed Code
Replace with:

```python
import os
from typing import Optional

# Security configuration with validation
SECRET_KEY: Optional[str] = os.getenv("SECRET_KEY")
if not SECRET_KEY or "change-in-production" in SECRET_KEY:
    raise ValueError(
        "SECRET_KEY environment variable must be set to a secure value. "
        "Generate one with: python3 -c \"import secrets; print(secrets.token_urlsafe(32))\""
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))  # Reduced from 480
```

### Also Update Token Expiry in config.py

**File:** [app/config.py](app/config.py#L8)

Before:
```python
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
```

After:
```python
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))  # 1 hour
```

### Generate Secure Secret Key
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Output: AbCdEf-1234567890_GhIjKlMnOpQrStUvWxYz

# Set on Railway
railway variables set SECRET_KEY="AbCdEf-1234567890_GhIjKlMnOpQrStUvWxYz"

# Set locally
export SECRET_KEY="AbCdEf-1234567890_GhIjKlMnOpQrStUvWxYz"
```

### Testing
```bash
# This should now raise an error if SECRET_KEY not set
python3 -c "from app.utils.security import SECRET_KEY; print('OK')"
# Expected error if SECRET_KEY not set:
# ValueError: SECRET_KEY environment variable must be set...
```

---

## FIX #3: Database Configuration

### Status
🔴 **CRITICAL** - Hardcoded credentials, SQLite fallback doesn't work in production

### Current Code
**File:** [app/database.py](app/database.py)

```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
```

Also in **[app/config.py](app/config.py#L11):**
```python
DATABASE_URL: str = "postgresql://user:password@localhost/starpath"
```

### Fixed Code

**Step 1: Update app/database.py**

Replace entire file with:

```python
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool
import os
import logging

logger = logging.getLogger(__name__)

# Get database URL with validation
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is required. "
        "Format: postgresql://user:password@host:5432/dbname or sqlite:///path/to/db.db"
    )

logger.info(f"Connecting to database: {DATABASE_URL.split('@')[0]}@...")

# Create engine with appropriate settings
if "sqlite" in DATABASE_URL:
    # SQLite: single-threaded, good for local testing only
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
else:
    # PostgreSQL: production-ready with connection pooling
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,           # Number of connections to keep in pool
        max_overflow=20,        # Additional connections allowed
        pool_pre_ping=True,     # Test connections before using (detects stale ones)
        pool_recycle=3600,      # Recycle connections after 1 hour
        echo=False              # Set to True for SQL debugging
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for FastAPI to inject database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def check_database_connection() -> bool:
    """Check if database is accessible"""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
```

**Step 2: Update app/config.py**

Replace the DATABASE_URL line:

Before:
```python
DATABASE_URL: str = "postgresql://user:password@localhost/starpath"
```

After:
```python
# No default! Must be set in environment
# Format examples:
# - postgresql://user:password@localhost:5432/starpath
# - sqlite:///./test.db (local development only)
```

**Step 3: Add startup event to app/main.py**

Add this to [app/main.py](app/main.py), after creating the app:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    # Startup
    logger.info("Starting up StarPath API")
    
    # Check database connection
    from app.database import check_database_connection
    db_ok = await check_database_connection()
    if not db_ok:
        raise RuntimeError("Failed to connect to database on startup")
    
    logger.info("✓ Database connection verified")
    
    yield
    
    # Shutdown
    logger.info("Shutting down StarPath API")

app = FastAPI(
    title="StarPath SNF API",
    description="SaaS platform for skilled nursing facilities to optimize their CMS Five-Star Quality Rating.",
    version="1.0.0",
    lifespan=lifespan  # Add this
)
```

**Step 4: Add health check endpoint**

Update [app/main.py](app/main.py#L27-L28):

Before:
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

After:
```python
@app.get("/health")
async def health_check():
    from app.database import check_database_connection
    db_ok = await check_database_connection()
    
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected"
    }
```

### Environment Variables to Set

**Local Development:**
```bash
# PostgreSQL (recommended)
export DATABASE_URL="postgresql://postgres:password@localhost:5432/starpath"

# Or SQLite (for testing only)
export DATABASE_URL="sqlite:///./test.db"
```

**Railway Production:**
```bash
# Set on Railway (replace with actual connection string from Railway dashboard)
railway variables set DATABASE_URL="postgresql://user:password@hostname:5432/dbname"
```

### Get Connection String from Railway

```bash
# View Railway environment variables
railway variables list

# Should show something like DATABASE_URL = postgresql://...
```

---

## FIX #4: Configuration Validation

### Status
🔴 **CRITICAL** - No validation that required environment variables are set

### Create New File: app/startup_checks.py

```python
"""
Startup validation checks for required configuration
"""
import os
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)


def check_required_env_vars() -> Tuple[bool, List[str]]:
    """
    Verify all required environment variables are set.
    
    Returns:
        Tuple of (all_ok, list_of_missing_vars)
    """
    required_vars = {
        "SECRET_KEY": "JWT signing key",
        "DATABASE_URL": "Database connection string",
        "CORS_ORIGINS": "Allowed origins for CORS",
    }
    
    optional_vars = {
        "RESEND_API_KEY": "Email sending service (optional)",
        "CMS_API_KEY": "CMS integration (optional)",
    }
    
    missing = []
    
    # Check required variables
    for var_name, description in required_vars.items():
        value = os.getenv(var_name)
        if not value:
            missing.append(f"{var_name} ({description})")
            logger.error(f"✗ Missing required: {var_name} - {description}")
        else:
            logger.info(f"✓ Set: {var_name}")
            
            # Additional validation
            if var_name == "SECRET_KEY" and "change-in-production" in value:
                missing.append(f"{var_name} (using default value)")
                logger.error(f"✗ {var_name} using default/test value")
    
    # Warn about optional variables
    for var_name, description in optional_vars.items():
        if not os.getenv(var_name):
            logger.warning(f"⚠ Optional not set: {var_name} - {description}")
    
    return len(missing) == 0, missing


def validate_startup() -> None:
    """
    Run all startup validation checks.
    Raises ValueError if critical issues found.
    """
    logger.info("Running startup validation checks...")
    
    all_ok, missing = check_required_env_vars()
    
    if not all_ok:
        error_msg = (
            f"Configuration validation failed. Missing {len(missing)} required variables:\n"
            + "\n".join(f"  - {var}" for var in missing)
        )
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    logger.info("✓ All startup checks passed")
```

### Update app/main.py to Call Validation

Add at the very beginning of the file:

```python
from app.startup_checks import validate_startup
import logging

logger = logging.getLogger(__name__)

# Run validation on module import
try:
    validate_startup()
except ValueError as e:
    logger.critical(str(e))
    raise
```

### Testing
```bash
# This should fail
python3 app/main.py
# Error: Configuration validation failed...

# This should succeed
export SECRET_KEY="test"
export DATABASE_URL="sqlite:///./test.db"
export CORS_ORIGINS="http://localhost:3000"
python3 app/main.py
# Output: ✓ All startup checks passed
```

---

## FIX #5: Database Migrations

### Status
🔴 **CRITICAL** - Users table and other models not migrated

### Step 1: Generate Missing Migrations

```bash
cd starpath-backend

# Generate migration for all models that don't have one
alembic revision --autogenerate -m "Create initial schema (users, facilities, etc)"

# Check it was created
ls -la alembic/versions/
# Should see: 002_create_initial_schema_*.py
```

### Step 2: Review Generated Migration

```bash
# Look at the new migration file
cat alembic/versions/002_create_initial_schema_*.py

# Should contain CREATE TABLE for: users, facilities, health_inspections, etc.
```

### Step 3: Apply Migrations

**Local:**
```bash
cd starpath-backend
alembic upgrade head

# Verify
python3 -c "
from app.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print('Tables:', sorted(tables))
"
```

**Railway:**
```bash
railway run alembic upgrade head

# Or add to Dockerfile (recommended for automation)
```

### Step 4: Update Dockerfile

**File:** [Dockerfile](Dockerfile)

Change the CMD at the end from:
```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

To:
```dockerfile
# Run migrations then start server
CMD sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

---

## FIX #6: Environment Variables File

### Create .env.example

**File:** [.env.example](should be in root)

```bash
# =====================================================
# CRITICAL - Must be set for production
# =====================================================

# Database connection string
# Format: postgresql://user:password@host:port/dbname
# Or: sqlite:///path/to/db.db (for local dev only)
DATABASE_URL=postgresql://user:password@localhost:5432/starpath

# JWT secret key - generate with: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-secret-key-generate-a-new-one

# Allowed origins for CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,https://starpath.app

# =====================================================
# Important but has defaults
# =====================================================

# Token expiry in minutes (default: 60 = 1 hour)
ACCESS_TOKEN_EXPIRE_MINUTES=60

# =====================================================
# Optional features
# =====================================================

# Email service key for password reset (optional)
# Get from: https://resend.com/
RESEND_API_KEY=

# CMS API integration (optional)
CMS_API_KEY=
CMS_API_SECRET=

# Password reset URL (for emails, optional)
RESET_PASSWORD_URL=http://localhost:3000/auth/reset-password
```

### Instructions in README

Add to README.md:

```markdown
## Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```bash
   nano .env
   ```

3. Load environment:
   ```bash
   source .env  # Linux/Mac
   # or
   set -a && source .env && set +a  # Bash
   ```

4. Run migrations:
   ```bash
   alembic upgrade head
   ```

5. Start server:
   ```bash
   uvicorn app.main:app --reload
   ```
```

---

## Implementation Priority

### Phase 1: Critical (Must do for any deployment)
1. ✅ Fix CORS configuration
2. ✅ Fix SECRET_KEY handling  
3. ✅ Fix DATABASE_URL handling
4. ✅ Add startup validation
5. ✅ Generate migrations for missing tables

### Phase 2: Important (Do before production)
6. ✅ Fix database connection pooling
7. ✅ Add health check with DB verification
8. ✅ Update Dockerfile to run migrations
9. ✅ Add .env.example and docs

### Phase 3: Enhancement (Polish)
10. Add password strength validation
11. Add token revocation mechanism
12. Set up structured logging
13. Integrate rate limiting middleware

---

## Deployment Checklist

### Before Pushing to Railway

```bash
# 1. Test locally
export SECRET_KEY="test-key-$(date +%s)"
export DATABASE_URL="sqlite:///./test.db"
export CORS_ORIGINS="http://localhost:3000"

# 2. Run migrations
cd starpath-backend
alembic upgrade head

# 3. Verify tables
python3 -c "from sqlalchemy import inspect; from app.database import engine; print(sorted(inspect(engine).get_table_names()))"

# 4. Test startup
python3 -c "from app.main import app; print('✓ App loads')"

# 5. Test login endpoint (with dummy data first)
sqlite3 test.db "INSERT INTO users VALUES ('user1@test.com', 'hashed', 'Test', 'test', True, False, NULL, NULL, datetime('now'), datetime('now'));"

# Or use the register endpoint to create a test user
```

### Deploy to Railway

```bash
# 1. Generate secure keys
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "SECRET_KEY=$SECRET_KEY"

# 2. Set on Railway
railway variables set SECRET_KEY="$SECRET_KEY"
railway variables set DATABASE_URL="postgresql://..."  # Get from Railway dashboard
railway variables set CORS_ORIGINS="https://your-frontend-url"

# 3. Deploy
git push railway main  # or your deployment trigger

# 4. Verify
railway logs --follow
```

---

## Testing After Fixes

### Local Testing

```bash
# Terminal 1: Backend
cd starpath-backend
export SECRET_KEY="test"
export DATABASE_URL="sqlite:///./test.db"
export CORS_ORIGINS="http://localhost:3000"
alembic upgrade head
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd starpath-frontend
npm start

# Terminal 3: Test
# 1. Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "full_name": "Test User"
  }'

# 2. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=Password123"

# 3. Use token
TOKEN="eyJhbGci..." # from login response
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Railway Testing

```bash
# Get the API URL
BACKEND_URL=$(railway service:list | grep backend)
# Or check Railway dashboard

# Test health
curl https://$BACKEND_URL/health

# Test registration
curl -X POST https://$BACKEND_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "full_name": "Test User"
  }'
```

