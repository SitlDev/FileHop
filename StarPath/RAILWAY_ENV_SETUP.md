# Railway Environment Variables Setup

## Required Variables for Backend

### Database Connection
```
DATABASE_URL=mysql+pymysql://<username>:<password>@<host>:<port>/<database>
```
- **For Railway MySQL Plugin**: Railway will automatically set this when you link a MySQL service

### Security
```
SECRET_KEY=<generate-a-secure-random-string>
```
- Generate with: `openssl rand -hex 32` or `python3 -c "import secrets; print(secrets.token_hex(32))"`
- CRITICAL: Different value for each environment (dev/staging/production)

### CORS (Frontend Communication)
```
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```
- Comma-separated list of allowed origins

### Optional: CMS Integration
```
CMS_API_KEY=<your-cms-key>
CMS_API_SECRET=<your-cms-secret>
CMS_MOCK_MODE=false  # Set to false when using real CMS
```

## How to Set on Railway

### Option 1: Via Railway Dashboard
1. Go to your `starpath-backend` service
2. Click **Variables** tab
3. Add each environment variable
4. Redeploy

### Option 2: Via Railway CLI
```bash
railway variables set DATABASE_URL="mysql+pymysql://..."
railway variables set SECRET_KEY="<secure-key>"
railway variables set ALLOWED_ORIGINS="https://your-domain.com"
```

## Verification

After setting variables, check with:
```bash
curl https://your-backend-url/debug/config
```

This endpoint shows which environment variables are set (with secrets masked).

## Current Issues on Railway

The backend is failing because:
1. ✅ Port configuration: FIXED (now uses `$PORT` environment variable)
2. ❌ DATABASE_URL: NOT SET (defaulting to SQLite which fails in production)
3. ❌ SECRET_KEY: NOT SET (using default dev key)

## Next Steps

1. **Link MySQL database** to the Railway service (if not already done)
2. **Set SECRET_KEY** variable
3. **Set ALLOWED_ORIGINS** to match frontend URL
4. **Redeploy** the backend service
