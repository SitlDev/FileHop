# Railway MySQL Deployment Checklist

## Step 1: Link MySQL Service to Backend
- [ ] Go to Railway dashboard
- [ ] Open `starpath-backend` service
- [ ] Click **Plugins** or **Add Ons**
- [ ] Add **MySQL** plugin
- [ ] Railway will automatically set `DATABASE_URL` environment variable
- [ ] Verify by going to **Variables** tab

## Step 2: Verify DATABASE_URL Format
Railway should set it to:
```
mysql+mysqlconnector://root:<password>@localhost:<port>/railway
```

⚠️ **If using PyMySQL instead**, format is:
```
mysql+pymysql://user:password@host:port/database
```

To use PyMySQL, add to requirements.txt:
```
PyMySQL==1.1.0
```

## Step 3: Set Required Environment Variables
In Railway **Variables** tab, ensure these are set:

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | Auto-set by MySQL plugin | `mysql+mysqlconnector://...` |
| `SECRET_KEY` | Secure random string | `$(openssl rand -hex 32)` |
| `ALLOWED_ORIGINS` | Frontend URL | `https://your-frontend.railway.app` |

### Generate SECRET_KEY:
**On Mac/Linux:**
```bash
openssl rand -hex 32
```

**Python:**
```python
import secrets
print(secrets.token_hex(32))
```

## Step 4: Verify Environment Variables
After setting, test by visiting:
```
https://your-backend.railway.app/debug/config
```

Should show:
- ✅ DATABASE_URL set to mysql
- ✅ SECRET_KEY marked as SET
- ✅ ALLOWED_ORIGINS set

## Step 5: Check Migrations
Backend should auto-run migrations on startup. Verify tables exist:

```bash
curl https://your-backend.railway.app/debug/config | grep -i table
```

## Step 6: Test Database Connection
From backend logs, check for:
```
✅ MySQL database engine created successfully
✅ Found 9 tables
```

## Step 7: Redeploy
After all variables are set:
- [ ] Click **Redeploy** on the backend service
- [ ] Monitor logs for startup
- [ ] Check `/health` endpoint returns 200

## Troubleshooting

### Error: "no such table"
- Migrations haven't run
- Run: `alembic upgrade head` locally first

### Error: "Access denied for user"
- MySQL credentials wrong
- Check DATABASE_URL format
- Verify MySQL is linked and running

### Error: "Connection refused"
- MySQL service not linked
- Check if MySQL plugin shows as "Online"

### Error: "Invalid port for '__port__'"
- ✅ FIXED - Updated Dockerfile to use `${PORT:-8000}`

### Port 8000 in logs but still fails
- Check Docker health check is using correct PORT
- ✅ FIXED - Updated health check to use `${PORT:-8000}`

## Command to Test from Railway CLI

```bash
# SSH into the service
railway shell

# Run the database test
python3 test_db_connection.py

# Or check logs
railway logs
```

## Success Indicators

When deployment is working:
1. ✅ Backend service shows "Online" (green)
2. ✅ No "error" logs in deploy logs
3. ✅ `GET /health` returns `{"status": "healthy"}`
4. ✅ `GET /debug/config` shows database variables
5. ✅ Frontend can connect and authenticate users
