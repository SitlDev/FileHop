# Fix DATABASE_URL on Railway

## Problem
The MySQL plugin is linked but DATABASE_URL is not automatically set. 

## Solution: Manually Set DATABASE_URL

### Step 1: Get MySQL Connection Info from Railway Dashboard
1. Go to Railway: https://railway.app
2. Open project `attractive-mercy` → `production`
3. Click the **MySQL** service
4. Go to **Variables** tab
5. Look for these variables:
   - `MYSQL_HOST` or `host`
   - `MYSQL_PORT` or `port`
   - `MYSQL_USER` or `username`
   - `MYSQL_PASSWORD` or `password`
   - `MYSQL_DATABASE` (should be `railway`)

### Step 2: Set DATABASE_URL
Copy the MySQL credentials and set this variable on the **starpath-backend** service:

**For mysql+mysqlconnector (using mysql-connector-python):**
```
DATABASE_URL=mysql+mysqlconnector://username:password@host:port/railway
```

**For mysql+pymysql (lighter, recommended):**
```
DATABASE_URL=mysql+pymysql://username:password@host:port/railway
```

Example:
```
DATABASE_URL=mysql+mysqlconnector://root:MyPassword123@mysql.railway.internal:3306/railway
```

### Step 3: Verify
After setting, run in Railway shell:
```bash
railway shell
python3 startup_check.py
```

Should show:
```
✅ DATABASE_URL: Set (mysql+mysqlconnector://...)
✅ ALL CHECKS PASSED
```

## Alternative: Let Railway Auto-Generate

If the above doesn't work:
1. **Disconnect MySQL** from starpath-backend
2. **Reconnect MySQL** plugin (it should regenerate DATABASE_URL)

OR

Use Railway CLI to list all available variables:
```bash
railway variables
```

This will show exactly what's available to use.
