# StarPath Backend Codebase Audit Report
**Date:** May 8, 2026  
**Focus Areas:** CORS, Authentication, Database, Environment Variables, API Routes, Error Handling, Migrations

---

## Executive Summary

The StarPath backend is a FastAPI-based SaaS platform with a comprehensive authentication system, CMS integration capabilities, and detailed RBAC. However, there are several critical configuration issues, security concerns, and missing features that likely cause login/registration failures in production.

---

## 1. CORS Configuration

### Location
- **File:** [app/main.py](app/main.py#L14-L20)
- **Lines:** 14-20

### Current Implementation
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issues Found
1. **🔴 CRITICAL - Overly Permissive CORS**
   - `allow_origins=["*"]` with `allow_credentials=True` is **invalid in most browsers**
   - Browser security model prohibits wildcard origins with credentials
   - Will cause CORS errors when frontend sends credentials (cookies/auth headers)
   - Comment indicates awareness but not implemented

2. **Missing Production Configuration**
   - No environment-based CORS configuration
   - No fallback for deployed environments
   - No frontend domain whitelist

### Recommendations
1. Implement environment-based CORS:
   ```python
   CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=CORS_ORIGINS,
       allow_credentials=True,
       allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       allow_headers=["*"],
   )
   ```

2. Set proper environment variables for production
3. Remove wildcard in production deployments

---

## 2. Authentication

### 2.1 Auth Endpoints
**File:** [app/api/v1/auth.py](app/api/v1/auth.py)

#### POST `/api/v1/auth/register`
- **Lines:** 38-56
- **Status:** ✅ Implemented
- **Features:**
  - Email validation (EmailStr via Pydantic)
  - Duplicate user check
  - bcrypt password hashing
  - Returns User model with ID and timestamps

#### POST `/api/v1/auth/login`
- **Lines:** 58-77
- **Status:** ✅ Implemented
- **Features:**
  - OAuth2PasswordRequestForm (accepts `username` and `password`)
  - Uses email as username
  - JWT token generation (8-day expiry)
  - Returns bearer token
  - Inactive user check

#### GET `/api/v1/auth/me`
- **Lines:** 79-82
- **Status:** ✅ Implemented
- **Features:**
  - Returns current authenticated user info
  - Requires valid JWT

#### POST `/api/v1/auth/forgot-password`
- **Lines:** 84-121
- **Status:** ⚠️ Partially Implemented
- **Features:**
  - Generates reset token (32-byte secure)
  - 1-hour expiry
  - Email service integration (Resend)
- **Issues:**
  - ❌ **RESEND_API_KEY not in config** - Only checked at runtime
  - ❌ **Hardcoded reset URL** (`http://localhost:3000`)
  - ❌ **Email service optional but not gracefully handled**

#### POST `/api/v1/auth/reset-password`
- **Lines:** 123-161
- **Status:** ⚠️ Implemented
- **Issues:**
  - ✅ Token expiry validation
  - ✅ Password minimum length (6 chars)
  - ❌ No password strength validation
  - ❌ No password history check

### 2.2 JWT Token Management
**File:** [app/utils/security.py](app/utils/security.py)

- **Access Token Expiry:** 8 days (lines 7)
- **Algorithm:** HS256 (line 6)
- **Secret Key:** Loaded from `SECRET_KEY` env var (line 5)
- **Default Secret:** `"your-secret-key-change-in-production"` (line 5)

#### Issues with Security
1. **🔴 CRITICAL - Default Secret Key**
   - Default is hardcoded: `"your-secret-key-change-in-production"`
   - Will be exposed if .env not set
   - Should fail loudly in production

2. **🟡 WARNING - Long Token Expiry**
   - 8 days is longer than typical (JWT best practice: 15 mins + refresh token)
   - Increases token theft risk window
   - No token revocation mechanism

3. **Token Scope Missing**
   - Missing `user_id` consistency (sometimes included, sometimes not)
   - No token type tracking (access vs refresh)

### 2.3 Password Hashing
**File:** [app/utils/security.py](app/utils/security.py#L11-L17)

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()
```

- **Status:** ✅ Properly implemented with bcrypt
- **Strength:** Uses bcrypt salt (default rounds = 12)
- **No Issues Found** here

### 2.4 Current User Dependency
**File:** [app/api/v1/auth.py](app/api/v1/auth.py#L21-L34)

```python
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserModel:
```

- **OAuth2 Scheme:** `/api/v1/auth/login`
- **Issues:**
  - ✅ Proper dependency injection
  - ⚠️ No scopes defined (could add role-based token scopes)

---

## 3. Database Configuration

### Location
- **Main Config:** [app/config.py](app/config.py#L11)
- **Connection:** [app/database.py](app/database.py)

### Current Implementation

#### Config (app/config.py)
```python
DATABASE_URL: str = "postgresql://user:password@localhost/starpath"
```

#### Connection Setup (app/database.py)
```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
```

### Issues Found
1. **🔴 CRITICAL - Hardcoded Credentials**
   - Default DATABASE_URL contains plain `user:password`
   - Exposes credentials if .env not set
   - Should fail loudly instead of defaulting

2. **🔴 CRITICAL - SQLite in Production Risk**
   - Falls back to SQLite (`./test.db`) if DATABASE_URL not set
   - SQLite cannot handle concurrent writes
   - No connection pooling configuration
   - SQLite connector doesn't use connection_args

3. **🟡 Missing Connection Pool Configuration**
   ```python
   engine = create_engine(
       DATABASE_URL,
       pool_size=10,          # NOT SET
       max_overflow=20,       # NOT SET
       pool_pre_ping=True,    # NOT SET - detects stale connections
       pool_recycle=3600,     # NOT SET - recycles connections
   )
   ```

4. **⚠️ No Database Migration Status Check**
   - No automatic Alembic migration on startup
   - Requires manual `alembic upgrade head`
   - Application doesn't validate schema exists

### Recommendations
1. Use environment variables with required validation:
   ```python
   DATABASE_URL = os.getenv("DATABASE_URL")
   if not DATABASE_URL:
       raise ValueError("DATABASE_URL environment variable is required")
   ```

2. Add connection pool configuration for PostgreSQL
3. Add startup event to run migrations automatically
4. Add health check for database connectivity

---

## 4. Environment Variables

### Location
- **File:** [app/config.py](app/config.py)

### Required Environment Variables

| Variable | Default | Production Status | Issues |
|----------|---------|-------------------|--------|
| `DATABASE_URL` | `sqlite:///./test.db` | ❌ Not Set | Exposes credentials, falls back to SQLite |
| `SECRET_KEY` | `your-secret-key-change-in-production` | ❌ Not Set | **CRITICAL: Hardcoded default** |
| `RESEND_API_KEY` | None | Optional | Needed for password reset emails |
| `CMS_API_KEY` | None | Optional | Needed for real CMS submission |
| `CMS_API_SECRET` | None | Optional | Needed for real CMS submission |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 480 (8 days) | ✅ Configurable | Should reduce to 15-60 mins |

### Configuration Class
**File:** [app/config.py](app/config.py)

```python
class Settings(BaseSettings):
    class Config:
        case_sensitive = True
        env_file = ".env"
```

- ✅ Uses Pydantic Settings for type safety
- ✅ Reads from `.env` file
- ⚠️ No validation that required vars are set
- ⚠️ No startup check for missing configurations

### Issues Found
1. **🔴 No Validation of Required Variables**
   - Optional env vars should be marked properly
   - No startup validation
   - Missing vars will only fail at usage time

2. **🟡 CMS Configuration**
   - `CMS_MOCK_MODE = True` (default)
   - Real API credentials optional
   - Should be environment-specific

3. **⚠️ Missing Environment Variable List**
   - No `.env.example` file found
   - No documentation of all required vars
   - New deployments will miss variables

### Recommendations
1. Create `.env.example` with all required variables
2. Add startup validation:
   ```python
   if not settings.SECRET_KEY or "change-in-production" in settings.SECRET_KEY:
       raise ValueError("SECRET_KEY must be set to a secure value")
   ```
3. Separate development and production configs

---

## 5. API Routes

### Route Overview

**Authentication Routes** (`/api/v1/auth`)
- ✅ `POST /register` - Create user account
- ✅ `POST /login` - Get JWT token
- ✅ `GET /me` - Current user info
- ✅ `POST /forgot-password` - Request reset
- ✅ `POST /reset-password` - Complete reset

**Health Check Routes**
- ✅ `GET /` - Root welcome message ([app/main.py](app/main.py#L24-L25))
- ✅ `GET /health` - Health check endpoint ([app/main.py](app/main.py#L27-L28))

**Facility Routes** (`/api/v1/facilities`)
- `GET /` - List all facilities
- `POST /` - Create facility
- `GET /{facility_id}` - Get facility details

**Health Inspection Routes** (`/api/v1/inspections`)
- `GET /facility/{facility_id}` - List inspections
- `GET /facility/{facility_id}/latest` - Latest inspection

**CMS Routes** (`/api/v1/cms`)
- `POST /export/{facility_id}` - Export facility data
- `POST /validate/{facility_id}` - Validate CMS data
- `POST /submit/{facility_id}` - Submit to CMS
- More routes for status tracking

**Admin Routes** (`/api/v1`)
- `GET /reports/facility/{facility_id}` - Download facility report
- `GET /reports/ratings-trend/{facility_id}` - Ratings trend report
- `GET /notifications` - Get user notifications
- WebSocket route for real-time notifications

### Issues Found
1. ✅ **Route Prefixes are Correct**
2. ⚠️ **No Centralized Error Response Format**
   - Different endpoints may return different error structures
   - No consistent HTTP status codes

---

## 6. Error Handling

### Logging Setup

**Found in Multiple Services:**
- [app/services/cms_submission_service.py](app/services/cms_submission_service.py#L12-L14)

```python
import logging
logger = logging.getLogger(__name__)
```

### Error Handling Patterns

#### RBAC Errors
**File:** [app/utils/rbac.py](app/utils/rbac.py)

```python
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Admin access required"
)
```

- ✅ Proper HTTP status codes
- ✅ Clear error messages

#### Authentication Errors
**File:** [app/api/v1/auth.py](app/api/v1/auth.py)

- ✅ 401 for invalid tokens
- ✅ 409 for duplicate users
- ✅ 403 for inactive users

#### CMS Submission Errors
**File:** [app/services/cms_submission_service.py](app/services/cms_submission_service.py)

```python
logger.warning(f"CMS server error (attempt {attempt + 1}): {response.status_code}")
logger.error(f"CMS HTTP error: {e}")
```

- ✅ Proper logging levels
- ✅ Retry logic for transient errors
- ⚠️ No centralized error handler

### Issues Found
1. **🟡 No Global Exception Handler**
   - No `@app.exception_handler` for unexpected errors
   - Validation errors may expose implementation details
   - 500 errors return generic responses

2. **🟡 Inconsistent Error Response Format**
   - FastAPI default: `{"detail": "..."}` for HTTPException
   - Some services return custom error structures
   - Frontend may not handle all formats

3. **🟡 Limited Logging Configuration**
   - No log levels configuration
   - No structured logging (JSON logs for production)
   - No log rotation configured

### Recommendations
1. Create global exception handler:
   ```python
   @app.exception_handler(Exception)
   async def general_exception_handler(request, exc):
       logger.exception("Unhandled exception")
       return JSONResponse(
           status_code=500,
           content={"detail": "Internal server error"}
       )
   ```

2. Use structured logging for production
3. Create consistent error response schema

---

## 7. Migration Setup

### Alembic Configuration

**Migration File:** [alembic/versions/001_create_cms_submissions_table.py](alembic/versions/001_create_cms_submissions_table.py)

### Current Status
1. ✅ Alembic properly configured
2. ✅ Single migration exists for `cms_submissions` table
3. ⚠️ **CRITICAL: Missing Other Tables**

### Tables Found in Models but NOT in Migrations

**File:** [app/models/](app/models/)

Defined models without corresponding migrations:
- ❌ `User` - [app/models/user.py](app/models/user.py)
- ❌ `Facility` - [app/models/facility.py](app/models/facility.py)
- ❌ `HealthInspection` - [app/models/health_inspection.py](app/models/health_inspection.py)
- ❌ `StarRating` - [app/models/star_rating.py](app/models/star_rating.py)
- ❌ `Notification` - [app/models/notification.py](app/models/notification.py)
- ❌ `Deficiency` - [app/models/deficiency.py](app/models/deficiency.py)
- ❌ `PBJ` - [app/models/pbj.py](app/models/pbj.py)

### Migration Issues
1. **🔴 CRITICAL - SQLAlchemy Auto-creation Fallback**
   - Tables are auto-created by SQLAlchemy if migrations haven't run
   - [app/database.py](app/database.py) doesn't call `Base.metadata.create_all()`
   - Manual migration creation needed

2. **🔴 CRITICAL - No Migration Versioning**
   - Only one migration file (001)
   - New models added without migrations
   - `alembic upgrade head` may not work correctly

3. **🟡 Missing Foreign Key Relationships**
   - CMS Submission has FK to `facilities.id`
   - But `facilities` table not migrated yet
   - Will fail at constraint creation time

4. **🟡 No Migration Documentation**
   - No `alembic/versions/README` explaining process
   - No notes on manual vs auto migrations

### Recommendations
1. Generate migrations for all models:
   ```bash
   alembic revision --autogenerate -m "Create initial schema"
   ```

2. Create startup check for migrations:
   ```python
   def check_database_migrations():
       # Verify all tables exist
       # Run alembic upgrade if needed
   ```

3. Document migration process

---

## 8. Additional Findings

### Missing/Incomplete Features

#### 1. **Database Health Check**
- No endpoint that validates database connectivity
- Load balancers can't verify DB status independently

#### 2. **No API Rate Limiting Middleware**
- [app/utils/rate_limiting.py](app/utils/rate_limiting.py) exists but not integrated
- RateLimiter class defined but never applied to routes
- Can cause DOS on registration/login endpoints

#### 3. **WebSocket Configuration**
- [app/api/v1/admin.py](app/api/v1/admin.py) uses WebSockets for notifications
- No CORS configuration for WebSocket upgrades
- Will fail with "WebSocket connection refused" if CORS not fixed

#### 4. **No Request/Response Middleware**
- No request ID tracking (important for debugging)
- No response time logging
- No request validation middleware

#### 5. **No HTTPS Redirect**
- All examples use `http://`
- No `https` enforcement in production
- Password reset emails use `http://localhost:3000`

#### 6. **Docker Health Check**
- [Dockerfile](Dockerfile#L40) has health check
- Uses `requests` library for HTTP check
- But `requests` not in `requirements.txt` (would fail)

### Missing Dependencies in requirements.txt

```
requirements.txt missing:
- requests (used in Docker health check)
- psycopg2-binary (PostgreSQL adapter - would need for production)
- pydantic-settings (already included, good)
```

**Critical:** MySQL connector is in requirements but app uses PostgreSQL/SQLite

---

## Summary Table of Issues by Severity

| Severity | Area | Issue | Impact |
|----------|------|-------|--------|
| 🔴 CRITICAL | CORS | Wildcard + credentials incompatible | Login fails in browsers |
| 🔴 CRITICAL | Security | Default SECRET_KEY exposed | All JWT tokens compromised |
| 🔴 CRITICAL | Database | Hardcoded credentials | Credentials exposed in code |
| 🔴 CRITICAL | Database | Falls back to SQLite | Single-threaded, concurrent failures |
| 🔴 CRITICAL | Migrations | Missing table migrations | Registration/login tables don't exist |
| 🔴 CRITICAL | Config | No validation of required vars | Production deployment fails silently |
| 🟡 WARNING | Auth | No password strength validation | Weak passwords accepted |
| 🟡 WARNING | Auth | No token revocation | Compromised tokens can't be blocked |
| 🟡 WARNING | Auth | 8-day token expiry | High theft risk window |
| 🟡 WARNING | Email | Hardcoded reset URL | Works only on localhost |
| 🟡 WARNING | Logging | No log level configuration | Can't control verbosity |
| 🟡 WARNING | Rate Limiting | Not integrated | DOS possible on auth endpoints |
| 🟡 WARNING | WebSocket | No CORS for upgrades | Real-time features fail |
| 🟡 WARNING | Docker | Missing dependencies | Container health check fails |
| ⚠️ MEDIUM | Error Handling | No global exception handler | Inconsistent error responses |
| ⚠️ MEDIUM | Routes | No request ID tracking | Debugging logs scattered |

---

## Critical Fixes Required for Production

### Immediate Actions (Before Deployment)

1. **Fix CORS Configuration**
   - Set `CORS_ORIGINS` environment variable
   - Remove wildcard if using credentials

2. **Fix Database**
   - Require `DATABASE_URL` with no default
   - Add connection pool configuration
   - Run migrations for all tables

3. **Fix Security**
   - Require `SECRET_KEY` environment variable
   - Validate against default value
   - Add .env.example

4. **Fix Configuration**
   - Add startup validation for all required env vars
   - Document all environment variables
   - Add health check endpoint for database

5. **Fix Email Reset Links**
   - Add `RESET_PASSWORD_URL` to config
   - Make it environment-specific

### Testing Checklist

- [ ] Can register new user
- [ ] Can login with credentials
- [ ] JWT token generated and validated
- [ ] CORS headers present in response
- [ ] Database migrations run successfully
- [ ] All tables created (users, facilities, inspections, etc.)
- [ ] Password reset email sends with correct URL
- [ ] Rate limiting engaged on auth endpoints
- [ ] WebSocket connections work for notifications
- [ ] Health check returns database status
- [ ] Secrets not logged in debug mode

