# StarPath Backend - Registration/Login Failure Diagnosis

## Quick Diagnosis Guide

If registration or login is failing, check these in order:

### 1. **CORS Issue** (Most Likely)
**Symptom:** Browser shows CORS error when attempting login/register

**Root Cause:** [app/main.py](app/main.py#L14-L20) has incompatible CORS config:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  # ❌ INCOMPATIBLE!
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Why It Fails:**
- Modern browsers block `allow_origins=["*"]` when `allow_credentials=True`
- This is a browser security restriction, not fixable by client
- Applies to: cookies, authorization headers, all credentials

**Fix:**
```python
import os
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Specific domains only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
```

**Environment Variable to Set:**
```
CORS_ORIGINS=http://localhost:3000,https://starpath.app
```

**Browser Error You'd See:**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/auth/login' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
The value of the 'Access-Control-Allow-Credentials' header in the response 
is '' which must be 'true' when the request's credentials mode (include) is 'credentials'. 
The credentials mode of requests initiated by the XMLHttpRequest is controlled by the 
withCredentials attribute.
```

---

### 2. **Database Not Connected** (Very Likely)
**Symptom:** 500 error when trying to register/login with no clear error message

**Root Cause:** 
- `DATABASE_URL` environment variable not set ([app/database.py](app/database.py#L3))
- Falls back to `sqlite:///./test.db` which is local-only
- On production (Railway), no .db file exists

**Verification:**
```bash
# Check if database URL is set
echo $DATABASE_URL  # Should show PostgreSQL URL, not empty

# If empty, this is the issue:
# railway run echo $DATABASE_URL  # On Railway, check what's actually set
```

**Expected Format:**
```
postgresql://username:password@host:5432/database_name
```

**Why It Fails in Production:**
- Railway environment doesn't create .db files
- SQLite is single-threaded, not suitable for multi-instance deployment
- /tmp directories don't persist on Railway

**Fix:**
1. Set DATABASE_URL on Railway
2. Verify with: `railway run python -c "import os; print(os.getenv('DATABASE_URL'))"`

---

### 3. **Database Tables Don't Exist** (Very Likely)
**Symptom:** 500 error mentioning "no such table: users"

**Root Cause:** 
- Only one Alembic migration exists: [001_create_cms_submissions_table.py](alembic/versions/001_create_cms_submissions_table.py)
- Migrations for `users`, `facilities`, etc. tables **don't exist**
- SQLAlchemy doesn't auto-create tables anymore (SQLAlchemy 2.0+)

**Where Tables Are Defined But Not Migrated:**
```
✅ MIGRATED:       cms_submissions table
❌ NOT MIGRATED:   users table              [app/models/user.py]
❌ NOT MIGRATED:   facilities table         [app/models/facility.py]
❌ NOT MIGRATED:   health_inspections       [app/models/health_inspection.py]
❌ NOT MIGRATED:   star_ratings             [app/models/star_rating.py]
❌ NOT MIGRATED:   notifications            [app/models/notification.py]
❌ NOT MIGRATED:   deficiencies             [app/models/deficiency.py]
```

**Exact Error When Login Attempted:**
```
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such table: users
```

**Fix - Generate Missing Migrations:**
```bash
cd starpath-backend

# Generate new migration for all models
alembic revision --autogenerate -m "Create all application tables"

# Verify migration was created
ls -la alembic/versions/

# Apply migrations
alembic upgrade head
```

**Verify Tables Created:**
```bash
# For PostgreSQL on Railway
railway run python -c "
from sqlalchemy import inspect
from app.database import engine
inspector = inspect(engine)
print('Tables:', inspector.get_table_names())
"
```

---

### 4. **SECRET_KEY Not Set** (Critical)
**Symptom:** Tokens generated but can't be decoded; 401 errors on all subsequent requests

**Root Cause:**
- [app/utils/security.py](app/utils/security.py#L5) has default:
```python
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
```
- Different instances have different defaults (or same if .env not set)
- Token created on one instance can't be verified on another

**Why It Fails:**
- Dev instance: generates token with default key
- Prod instance: tries to verify token with different/default key
- Signature mismatch = 401 Unauthorized

**Verification:**
```bash
# Check if set on Railway
railway run python -c "import os; print('SECRET_KEY set:', bool(os.getenv('SECRET_KEY')))"

# Should output: SECRET_KEY set: True
# If False, that's the issue
```

**Fix:**
```bash
# Generate a secure key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Output: something-like-AbCdEf123456...

# Set on Railway
railway variables set SECRET_KEY="AbCdEf123456..."

# Verify
railway run python -c "import os; print(os.getenv('SECRET_KEY'))"
```

---

### 5. **Environment Variables Missing** (Production Deployment)
**Symptom:** Application starts but fails when any route is accessed

**Required Environment Variables:**
```bash
# CRITICAL - Must be set
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=<generated-secure-key>

# Important for features
RESEND_API_KEY=<for-password-reset>        # Optional but recommended
CORS_ORIGINS=http://localhost:3000,https://app.example.com

# Optional - defaults are fine
CMS_API_KEY=<for-real-cms-integration>
CMS_MOCK_MODE=true  # Leave as true for testing
```

**Check on Railway:**
```bash
railway variables list
```

**Add Missing Variables:**
```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set SECRET_KEY="..."
railway variables set CORS_ORIGINS="http://localhost:3000,https://starpath.app"
```

---

### 6. **Alembic Not Running on Startup** (Probable)
**Symptom:** Login works locally but fails after Railway deployment

**Root Cause:**
- No startup script to run migrations
- Dockerfile has no `alembic upgrade head` command
- Kubernetes/Railway starts app with stale schema

**Check Dockerfile:** [Dockerfile](Dockerfile)
```dockerfile
# ❌ Missing:
# RUN alembic upgrade head

# Current:
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Why It Fails:**
1. Deploy new version
2. Old tables don't have new columns
3. New queries fail with "column X doesn't exist"
4. Or previous version expects columns that new version removed

**Fix:**
Update Dockerfile to run migrations before starting:
```dockerfile
FROM python:3.13-slim

WORKDIR /app

# ... setup ...

COPY . .

# RUN migrations on startup
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

### 7. **Password Reset URL Broken** (Not Critical for Login but For Recovery)
**Symptom:** User resets password, gets email with broken link

**Root Cause:** [app/api/v1/auth.py](app/api/v1/auth.py#L107)
```python
reset_url = f"http://localhost:3000/auth/reset-password?token={reset_token}"
# ❌ Hardcoded localhost, doesn't work in production!
```

**Fix:**
Add `RESET_PASSWORD_URL` to config:
```python
# app/config.py
RESET_PASSWORD_URL: str = os.getenv("RESET_PASSWORD_URL", "http://localhost:3000/auth/reset-password")

# app/api/v1/auth.py
from app.config import settings
reset_url = f"{settings.RESET_PASSWORD_URL}?token={reset_token}"
```

**Set on Railway:**
```bash
railway variables set RESET_PASSWORD_URL="https://starpath.app/auth/reset-password"
```

---

## Troubleshooting Checklist for Each Environment

### Local Development
```bash
[ ] DATABASE_URL set to local PostgreSQL or SQLite path
[ ] SECRET_KEY set (can be dummy for local)
[ ] Migrations run: alembic upgrade head
[ ] CORS_ORIGINS includes http://localhost:3000
[ ] npm start (frontend) on port 3000
[ ] python uvicorn (backend) on port 8000
```

### Testing Before Railway Deployment
```bash
[ ] Run: alembic upgrade head
[ ] Verify all tables exist: python -c "from sqlalchemy import inspect; from app.database import engine; print(inspect(engine).get_table_names())"
[ ] Test registration: curl -X POST http://localhost:8000/api/v1/auth/register ...
[ ] Test login: curl -X POST http://localhost:8000/api/v1/auth/login ...
[ ] Test protected route: curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/v1/auth/me
```

### Railway Production
```bash
[ ] DATABASE_URL set in Railway variables
[ ] SECRET_KEY set in Railway variables (use: python -c "import secrets; print(secrets.token_urlsafe(32))")
[ ] CORS_ORIGINS set to production domain
[ ] RESET_PASSWORD_URL set to production domain
[ ] Dockerfile runs: alembic upgrade head before starting
[ ] Deploy and check logs: railway logs
[ ] Test health: curl https://starpath-production-xxxx.up.railway.app/health
[ ] Test login: curl -X POST https://starpath-production-xxxx.up.railway.app/api/v1/auth/login ...
```

---

## Common Error Messages & Solutions

### "no such table: users"
→ Run migrations: `alembic upgrade head`

### "CORS policy: The value of the 'Access-Control-Allow-Credentials' header..."
→ Fix CORS in [app/main.py](app/main.py#L14-L20), set CORS_ORIGINS env var

### "Invalid email or password" (but credentials are correct)
→ Check if users table exists and has data: 
```bash
sqlite3 test.db "SELECT COUNT(*) FROM users;"  # For SQLite
psql -c "SELECT COUNT(*) FROM users;"          # For PostgreSQL
```

### "Invalid token" on /auth/me after login
→ SECRET_KEY mismatch - verify all instances use same SECRET_KEY

### "401 Unauthorized" on every protected route
→ Check Authorization header format: `Authorization: Bearer <token>`

### "Database connection refused"
→ Check DATABASE_URL format and that database service is running

### Docker health check failing
→ `requests` library not in requirements.txt, add it

---

## Quick Fix Commands for Railway

```bash
# 1. SSH into Railway environment
railway shell

# 2. Check what's set
printenv | grep -E 'DATABASE|SECRET|CORS'

# 3. Check if migrations ran
python -c "from app.database import engine; from sqlalchemy import inspect; print(inspect(engine).get_table_names())"

# 4. Manually run migrations (if stuck)
alembic upgrade head

# 5. Check logs
railway logs --follow
```

---

## Most Likely Root Cause

**If registration/login is failing, it's most likely:**

1. **CORS issue** (if error visible in browser console)
2. **Database tables missing** (if error is "no such table" or 500 error)
3. **DATABASE_URL not set** (if using SQLite on Railway, won't work)

**Quick diagnostic:**
```bash
# Test locally first
cd starpath-backend
alembic upgrade head
uvicorn app.main:app --reload

# If it works locally but fails on Railway:
# → DATABASE_URL or SECRET_KEY likely not set on Railway
```

