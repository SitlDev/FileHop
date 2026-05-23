# FileHop Deployment Guide

**Application Status**: ✅ Production-Ready

This guide covers deploying FileHop to production on popular platforms.

---

## Pre-Deployment Checklist

### Code Quality ✅
- [x] All TypeScript code compiles without errors
- [x] All 23 integration tests passing
- [x] No console.log debugging statements (except errors)
- [x] Error handling configured (stack traces disabled in production)
- [x] Development-only endpoints protected (webhook test endpoint blocked in production)

### Features Implemented ✅
- [x] User authentication (signup/login)
- [x] File upload with storage quota
- [x] Payment processing (one-time + subscription)
- [x] Payment method management (card updates via SetupIntent)
- [x] Payment retry logic with email notifications
- [x] Email notifications (Resend API)
- [x] QR code generation for shares
- [x] Admin dashboard
- [x] CORS and security headers (Helmet.js)

---

## Environment Variables Setup

### Backend (.env)

Required variables for production:

```bash
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com          # Production frontend URL

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/db

# Auth
JWT_SECRET=$(openssl rand -base64 32)        # Generate new secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)   # Generate new secret

# AWS S3 / Backblaze B2
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-backblaze-app-key-id
AWS_SECRET_ACCESS_KEY=your-backblaze-app-key
S3_BUCKET_NAME=your-bucket-name
S3_ENDPOINT=s3.us-east-005.backblazeb2.com  # If using Backblaze B2

# Stripe (LIVE KEYS - not test keys)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...             # From Stripe webhook settings

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com    # Production email

# Admin
ADMIN_EMAIL=admin@yourdomain.com

# File Settings (adjust as needed)
MAX_FILE_SIZE=524288000                     # 500MB
USER_STORAGE_LIMIT=2147483648              # 2GB
FILE_RETENTION_DAYS=15
```

### Frontend (.env.local)

Required variables for production:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com   # Production backend URL
NEXT_PUBLIC_STRIPE_KEY=pk_live_...              # Must match backend key
```

---

## Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend)

**Frontend Deployment (Vercel)**

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_STRIPE_KEY`
4. Deploy with `vercel deploy --prod`

**Backend Deployment (Railway)**

1. Create Railway project
2. Connect GitHub repo
3. Add PostgreSQL database
4. Set environment variables in Railway dashboard
5. Deploy automatically on git push

**Backend Deployment (Render)**

1. Create Render service
2. Connect GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add PostgreSQL database
6. Set environment variables in Render dashboard

### Option 2: Docker + Self-Hosted

```bash
# Build images
docker build -t filehop-backend:latest ./backend
docker build -t filehop-frontend:latest ./frontend

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Manual Deployment

**Backend**
```bash
# SSH to server
ssh user@server.com

# Clone and install
git clone <repo> filehop
cd filehop/backend
npm install
npm run build

# Set environment variables
nano .env

# Run with process manager (PM2)
npm install -g pm2
pm2 start dist/server.js --name "filehop-backend"
pm2 save
```

**Frontend**
```bash
cd filehop/frontend
npm install
npm run build

# Serve with Next.js
npm start

# Or use PM2
pm2 start "npm start" --name "filehop-frontend"
```

---

## Post-Deployment Steps

### 1. Database Migration

```bash
cd backend
npm run db:migrate -- --skip-generate
```

### 2. Stripe Configuration

- [ ] Update Stripe webhook endpoint to `https://api.yourdomain.com/api/webhooks/stripe`
- [ ] Use LIVE webhook secret (not test)
- [ ] Subscribe to these events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`

### 3. Resend Email Configuration

- [ ] Verify domain in Resend dashboard
- [ ] Update RESEND_FROM_EMAIL in environment
- [ ] Test email sending: Create test user and trigger payment

### 4. Backblaze B2 / AWS S3

- [ ] Create production bucket
- [ ] Set bucket policy for signed URLs
- [ ] Configure CORS for domain
- [ ] Update AWS credentials in environment

### 5. Security

- [ ] Enable HTTPS/SSL certificate (free with Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Set strong database passwords
- [ ] Enable database backups
- [ ] Set up monitoring/alerting
- [ ] Configure rate limiting on API endpoints

### 6. Testing

```bash
# Test API health
curl https://api.yourdomain.com/api/health

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123"}'

# Test payment webhook (use Stripe CLI in development)
stripe listen --forward-to api.yourdomain.com/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

### 7. Monitoring

- [ ] Set up error tracking (Sentry, DataDog, etc.)
- [ ] Enable database query logging
- [ ] Set up uptime monitoring
- [ ] Configure alerting for errors

---

## Scaling Considerations

### Database
- Use connection pooling (PgBouncer)
- Enable read replicas for analytics
- Regular backups (automated)
- Monitor slow queries

### Backend
- Use load balancer (nginx, AWS ALB)
- Run multiple instances
- Use Redis for caching (optional)
- Enable horizontal scaling

### Frontend
- Use CDN (Cloudflare, AWS CloudFront)
- Cache static assets
- Enable compression (gzip)
- Optimize images

### File Storage
- Use multi-region replication for B2
- Enable versioning
- Set up lifecycle policies
- Monitor storage costs

---

## Troubleshooting

**Payment webhook not working**
- [ ] Verify webhook secret in environment
- [ ] Check webhook endpoint is public
- [ ] Verify Stripe webhook configuration in dashboard
- [ ] Check server logs for errors

**Email not sending**
- [ ] Verify Resend API key is valid
- [ ] Check domain is verified in Resend
- [ ] Verify FROM email is correct
- [ ] Check email logs in Resend dashboard

**Database connection failing**
- [ ] Verify DATABASE_URL is correct
- [ ] Check database server is running
- [ ] Verify firewall allows connection
- [ ] Check database credentials

**Files not uploading**
- [ ] Verify S3/B2 credentials
- [ ] Check bucket exists and is accessible
- [ ] Verify CORS configuration
- [ ] Check file size limits

---

## Rollback Plan

If issues occur in production:

1. **Stop traffic** - Point domain to previous version
2. **Investigate** - Check logs and error tracking
3. **Fix** - Make necessary code changes
4. **Test** - Run tests locally and in staging
5. **Redeploy** - Deploy fix to production
6. **Monitor** - Watch metrics and logs closely

---

## Maintenance

### Regular Tasks
- [ ] Review error logs (weekly)
- [ ] Check database size (weekly)
- [ ] Monitor storage usage (weekly)
- [ ] Review security logs (weekly)
- [ ] Update dependencies (monthly)
- [ ] Database backup verification (monthly)

### Monitoring Checklist
- API response times
- Error rates
- Database query performance
- Storage usage
- Payment success rates
- Email delivery rates

---

## Cost Estimation

### Typical Production Costs (Monthly)

| Service | Cost |
|---------|------|
| Server/Hosting | $50-200 |
| PostgreSQL Database | $50-200 |
| File Storage (B2) | $10-100 |
| Stripe (2.9% + $0.30) | Variable |
| Email (Resend) | $20-100 |
| SSL/CDN | $0-50 |
| **Total** | **~$150-650** |

---

## Support

For deployment issues:
1. Check application logs
2. Review environment variables
3. Verify all services are running
4. Contact hosting provider support
5. Check Stripe/Resend status pages

---

**Last Updated**: May 22, 2026
**Status**: Ready for Production Deployment
