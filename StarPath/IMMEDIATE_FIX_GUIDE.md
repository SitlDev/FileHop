# 🚨 IMMEDIATE ACTIONS TO FIX 502 ERROR

## Problem
Backend returning 502 error - "Application failed to respond"

## Root Cause
Environment variables not set on Railway. The backend needs:
1. `DATABASE_URL` (auto-set by MySQL plugin, but verify it's there)
2. `ALLOWED_ORIGINS` (set by you - required for CORS)
3. `SECRET_KEY` (set by you - required for JWT tokens)

---

## ✅ STEP-BY-STEP FIX

### Step 1: Open Railway Dashboard
Go to: https://railway.com/project/99a82203-cf92-48f6-a96f-31ee5f5a8a8b

### Step 2: Find Backend Service
- Click on the **Backend** service (or "starpath" service)
- Look for the **"Variables"** tab on the right panel

### Step 3: Check DATABASE_URL
- **Look for:** `DATABASE_URL` variable
- **Expected format:** `mysql://user:password@hostname:3306/database`
- **If missing:** The MySQL plugin should have auto-set it. Check your MySQL plugin in Railway.

### Step 4: Add ALLOWED_ORIGINS
If not present, click **"+ New Variable"** and add:
```
Name:  ALLOWED_ORIGINS
Value: https://starpath-frontend-production.up.railway.app
```

### Step 5: Add SECRET_KEY
Click **"+ New Variable"** and add:
```
Name:  SECRET_KEY
Value: [Generate random string: use next section]
```

**To generate SECRET_KEY**, run in terminal:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Example output:** `AbC-D12_EFg34HIjkLMno56pqRStuVwXYZ7890`

### Step 6: Save & Redeploy
- After adding variables, Railway auto-redeployes the backend
- Wait 30-60 seconds for redeploy to complete
- Status will change from "Crashed" or "Deploying" to "Running"

### Step 7: Verify Health Endpoint
Run in terminal:
```bash
curl https://starpath-production-af61.up.railway.app/api/v1/health
```

**Expected response:**
```json
{"status": "healthy"}
```

---

## 🗄️ Step 8: Run Database Migrations

Once health endpoint works, run migrations to create tables:

**Option A: Using Railway CLI (recommended)**
```bash
railway run alembic upgrade head
```

**Option B: Using Docker with local database**
If you have local MySQL set up, create `.env` file:
```
DATABASE_URL=mysql://user:password@localhost:3306/starpath
```

Then run:
```bash
cd starpath-backend
pip install -r requirements.txt
alembic upgrade head
```

---

## ✨ Step 9: Test Registration

1. Go to: https://starpath-frontend-production.up.railway.app
2. Click **"Sign Up"**
3. Fill in email/password
4. Click **"Register"**

**Success indicators:**
- ✅ No CORS error
- ✅ Account created
- ✅ Redirected to login
- ✅ Can login with new credentials

---

## 🆘 Troubleshooting

### Still getting 502?
1. Check backend logs in Railway dashboard
2. Verify all 3 variables are set
3. Wait longer for redeploy
4. Restart backend service manually

### CORS errors still appearing?
1. Verify `ALLOWED_ORIGINS` exactly matches: `https://starpath-frontend-production.up.railway.app`
2. No trailing slash!
3. Restart backend after changing

### "Table users not found" error?
1. Migrations haven't run yet
2. Run: `railway run alembic upgrade head`
3. Wait for migrations to complete

---

## 📝 Recent Code Changes

**Commits pushed to fix 502:**
- `1312ad58`: Fixed CORS to use `ALLOWED_ORIGINS` env var
- `6b2070eb`: Fixed database config to read `DATABASE_URL` from env
- `29c280ee`: Created all 8 missing migration files

All changes are already in production - just need env vars + migrations.

---

## 🎯 Next Steps After Fixes

1. ✅ Set environment variables → Backend comes online
2. ✅ Run migrations → Tables created
3. ✅ Test registration → Full auth flow works
4. ✅ Celebrate! 🎉
