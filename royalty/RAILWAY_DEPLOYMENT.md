# Railway Deployment Guide for RoyaltyOS

## 🚀 Quick Deploy to Railway

### Option 1: Deploy from CLI (Fastest)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login to Railway
railway login

# 3. Create new Railway project
railway init

# 4. Add your project name when prompted
# Follow the interactive setup

# 5. Deploy
railway up

# 6. Check logs
railway logs -f
```

### Option 2: Deploy from GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   git add railway.json
   git commit -m "Add Railway deployment config"
   git push origin main
   ```

2. **Go to [Railway Dashboard](https://railway.app/dashboard)**
   - Click "Create New Project"
   - Select "Deploy from GitHub"
   - Authorize GitHub and select this repository
   - Railway auto-detects the railway.json config

3. **Set Environment Variables**
   - In Railway Dashboard → Project Settings → Variables
   - Add these secrets:
     ```
     DB_PASSWORD=<strong-random-password>
     TOKEN_ENCRYPTION_KEY=<32-char-random-string>
     JWT_SECRET=<32-char-random-string>
     CLERK_SECRET_KEY=<your-clerk-secret>
     CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
     SENDGRID_API_KEY=<your-sendgrid-key>
     ```

4. **Deploy**
   - Click "Deploy" button
   - Railway builds and deploys automatically

---

## 🔧 Required Secrets

Generate random values for security secrets:

```bash
# Generate strong random strings
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to Railway as **Variables** (protected secrets):

| Variable | Example | Required |
|----------|---------|----------|
| `DB_PASSWORD` | *(auto-generated)* | ✅ Yes |
| `TOKEN_ENCRYPTION_KEY` | 32-char hex string | ✅ Yes |
| `JWT_SECRET` | 32-char hex string | ✅ Yes |
| `CLERK_SECRET_KEY` | sk_live_... | ✅ Yes |
| `CLERK_PUBLISHABLE_KEY` | pk_live_... | ✅ Yes |
| `SENDGRID_API_KEY` | SG.xxxx | ✅ Yes |

---

## 🎵 DSP Platform Credentials (Optional)

Add these to Railway Variables if you want to enable DSP syncing:

```
SPOTIFY_CLIENT_ID=<your-spotify-id>
SPOTIFY_CLIENT_SECRET=<your-spotify-secret>
SPOTIFY_REFRESH_TOKEN=<user-refresh-token>

APPLE_MUSIC_KEY=<your-apple-key>
APPLE_MUSIC_SECRET=<your-apple-secret>

YOUTUBE_MUSIC_REFRESH_TOKEN=<token>

AMAZON_MUSIC_ENABLED=true
TIDAL_ENABLED=true
DEEZER_ENABLED=true
SOUNDCLOUD_ENABLED=true
BANDCAMP_ENABLED=true
```

---

## ✅ Deployment Checklist

- [ ] railway.json created ✓
- [ ] Repository pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL service available
- [ ] Redis service available
- [ ] All secrets added in Railway Dashboard
- [ ] Domain configured (custom or railway.app)
- [ ] SSL certificate configured
- [ ] Health check passing
- [ ] Database migrations completed
- [ ] Application logs show success

---

## 🔍 Verify Deployment

After deployment completes:

```bash
# 1. Check application status
railway status

# 2. View logs
railway logs -f

# 3. Test health endpoint
curl https://your-app.railway.app/api/health

# 4. View database
railway db:admin  # Opens admin panel
```

---

## 📊 Monitoring

Railway provides built-in monitoring:
- **Logs** - Real-time application logs
- **Metrics** - CPU, Memory, Network usage
- **Deployments** - Deployment history
- **Health** - Service health checks

Access in Railway Dashboard → Project → Deployments

---

## 🔄 Background Sync Processor

The sync processor runs as part of the app container but can be scaled separately:

```bash
# Scale to dedicated instances if needed
railway scale app=2  # For high load
```

The processor runs automatically on startup via the entrypoint script.

---

## 🆘 Troubleshooting

### Database Connection Failed
- Check `DB_PASSWORD` is set correctly
- Verify PostgreSQL service is running: `railway logs postgres`
- Check `DATABASE_URL` format

### Build Failed
- Check build logs: `railway logs -f`
- Ensure pnpm-lock.yaml is committed
- Verify Dockerfile path is correct

### Health Check Failing
- Check app logs: `railway logs -f app`
- Verify `/api/health` endpoint exists
- Check database connection during startup

### Slow Deployments
- First deploy is slower (cold start)
- Subsequent deploys are faster (incremental)
- Monitor at railway.app/dashboard

---

## 🚀 Zero-Downtime Deployments

Railway supports blue-green deployments:
- New version deployed alongside current
- Traffic switched automatically when healthy
- Automatic rollback if health checks fail

---

## 💡 Pro Tips

1. **Use Environment-Specific Variables**
   ```
   NODE_ENV=production
   RAILS_ENV=production
   ```

2. **Enable Auto-Scaling** (Railway Pro plan)
   - Configure in Railway Dashboard
   - Set min/max replicas
   - Based on CPU/Memory metrics

3. **Scheduled Jobs**
   - Use Railway's scheduled deploys for maintenance
   - Or use the built-in job processor (Bull queues)

4. **Custom Domain**
   - Add in Railway → Project Settings → Domains
   - Configure DNS records
   - Auto-SSL provisioning

---

## 📞 Support

- Railway Docs: https://docs.railway.app
- Discord: https://railway.app/discord
- Status: https://status.railway.app
