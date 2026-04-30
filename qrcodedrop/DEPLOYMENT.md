# Production Deployment Guide

This guide covers deploying the Tools Dashboard to production on Vercel.

## Prerequisites

- Vercel account (https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Domain name (optional but recommended)

## Deployment Steps

### 1. Connect Repository to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
vercel
```

Or connect via Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import your Git repository
3. Select the project root
4. Click "Deploy"

### 2. Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_ANALYTICS_API=https://knotstranded.com/api/analytics
VITE_NEWSLETTER_API=https://knotstranded.com/api/newsletter
VITE_ADSENSE_PUBLISHER_ID=ca-pub-YOUR_ID_HERE
VITE_ADMIN_PASSWORD=your_secure_password_here
```

### 3. Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your domain name
3. Update DNS records as instructed by Vercel

## Features Configured for Production

### Security Headers
- X-Content-Type-Options: Prevent MIME type sniffing
- X-Frame-Options: Prevent clickjacking
- X-XSS-Protection: Enable browser XSS protection
- Referrer-Policy: Control referrer information
- Permissions-Policy: Restrict browser features

### Caching Strategy
- **Home page**: 1 hour (3600s)
- **Tools**: 2 hours (7200s)
- **Static assets**: 1 year (31536000s, immutable)

### Analytics Integration
- Dashboard automatically tracks visits
- All tools report usage metrics
- Admin panel displays real-time statistics

## Admin Panel Access

- URL: `https://yourdomain.com/Tools/admin.html`
- Password: Check environment variables
- Features:
  - View platform analytics
  - Monitor tool usage
  - Manage newsletter subscribers
  - Export subscriber lists

## Monitoring

### Dashboard Analytics
- Real-time visitor counts
- Tool usage statistics
- Popular tools ranking
- Subscriber growth tracking

### Tools Statistics
- QR Code Generator: 6 metrics
- All Tools: Aggregated statistics
- Custom event tracking per tool

## Performance Optimization

### Already Implemented:
- ✅ Static site generation (fastest)
- ✅ Aggressive caching headers
- ✅ Optimized CSS (minimal footprint)
- ✅ Client-side only processing (no cold starts)
- ✅ CDN distribution via Vercel Edge

### Recommended Improvements:
1. **Images**: Replace any images with WebP format
2. **Code Splitting**: Already optimized for 41+ tools
3. **Analytics**: Consider implementing privacy-friendly analytics
4. **Compression**: Enabled by default on Vercel

## Maintenance

### Weekly Tasks:
- Check analytics dashboard for anomalies
- Review subscriber growth
- Monitor tool error rates

### Monthly Tasks:
- Review most/least used tools
- Export and backup subscriber list
- Check for security updates

### Quarterly Tasks:
- Performance audit
- SEO analysis
- Feature planning based on usage

## Troubleshooting

### Analytics Not Showing
- Verify API endpoint is accessible
- Check browser console for CORS errors
- Ensure analytics API credentials are correct

### Admin Panel Access Denied
- Clear browser cache/localStorage
- Verify password in environment variables
- Try incognito/private browsing mode

### Tools Not Loading
- Check network tab in browser DevTools
- Verify all tool files are deployed
- Check Vercel deployment logs

## Rollback Process

```bash
# Revert to previous deployment
vercel --prod --force

# Or via Git
git revert <commit-hash>
git push
# Vercel auto-deploys on push
```

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Analytics API**: https://knotstranded.com/api/
- **Issue Tracking**: Check GitHub Issues
- **Contact**: Support email in footer

## Security Checklist

- [ ] Change admin password from default
- [ ] Set Google AdSense publisher ID
- [ ] Configure custom domain
- [ ] Enable Vercel analytics
- [ ] Set up email notifications
- [ ] Review CORS configuration
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Test admin panel access

## Additional Features

### Email Subscriber Export
```
Admin Panel → Subscribers → Export CSV
```

### Tool Analytics Details
Access individual tool stats:
```
Admin Panel → QR Code Stats
Admin Panel → Other Tools
```

### Custom Redirect Service
For dynamic QR codes with tracking:
1. Set up redirect service (bitly, tinyurl, etc.)
2. Add service URL to environment variables
3. QR codes will track usage automatically
