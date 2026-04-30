# Static Deployment Configuration

## Overview
This project is configured for **static deployment** on Vercel (or any static hosting). All tools are client-side only with no server-side processing required.

## Files Not Needed for Static Deployment

The following files are included in the repo but are **not required** for the static site to function:

### Backend API Files (can be removed)
- `/api/` folder (analytics.php, newsletter.php, consent.php, config.php)
- `database.sql` - PostgreSQL database schema

**Note:** These were part of the original design but are not necessary for the static version. Analytics currently use fallback/local storage.

### Environment Configuration
The `.env.example` file includes optional configurations for:
- **Database** (not used)
- **Analytics API** (external - disabled by default)
- **Newsletter API** (external - disabled by default)  
- **AdSense** (requires your own publisher ID)

## Deployment to Vercel

### Quick Deploy
```bash
vercel deploy --prod
```

### Configuration
The `vercel.json` file is already configured to:
- Serve static files from root and `/Tools/` directory
- Cache index.html for 1 hour
- Redirect all routes to index.html for SPA support

## Optional Features

### 1. Enable AdSense Monetization
1. Get a Google AdSense Publisher ID
2. Update the AdSense client ID in files containing `ca-pub-YOUR_ID_HERE`
3. Uncomment the AdSense script tags

### 2. Enable Analytics
To track dashboard and tool usage:
1. Set up an analytics endpoint (or use a third-party service like Plausible, Fathom, etc.)
2. Update `VITE_ANALYTICS_API` in `.env`
3. Uncomment the tracking code in `Tools/dashboard.js`

### 3. Newsletter Signup
External newsletter integration is available but disabled by default. Update `VITE_NEWSLETTER_API` when ready to implement.

## Security Notes

- ✅ No user data is collected by default
- ✅ All processing happens client-side
- ✅ Admin dashboard is password-protected
- ⚠️ Change default admin password (`h14sua12`) before deploying
- ⚠️ Store sensitive credentials in Vercel Environment Variables, not `.env`

## SEO & Meta Tags

All files include:
- ✅ Open Graph tags for social sharing
- ✅ Meta descriptions
- ✅ Canonical URLs
- ✅ Structured metadata
- ✅ robots.txt and sitemap.xml

## Performance Optimizations

- ✅ Static file caching (3600s)
- ✅ Edge caching via Vercel CDN
- ✅ Gzip compression (automatic)
- ✅ Zero cold starts (no server logic)
- ✅ Client-side processing only

## Troubleshooting

### 404 Errors on Tool Pages
- Check that `/Tools/[tool-name]/index.html` files exist
- Verify tool paths in `dashboard.js` match actual directory names
- Clear Vercel cache: `vercel -t $TOKEN env pull`

### Analytics Not Loading
- This is expected in development - dashboard shows "—" instead of numbers
- Optional feature that requires external API configuration

### AdSense Not Showing
- Placeholder IDs (`ca-pub-YOUR_ID_HERE`) won't load ads
- Replace with your actual Google AdSense publisher ID
- Can remain commented out if not monetizing

## File Structure

```
/
├── index.html                    # Landing page
├── Tools/
│   ├── dashboard.html           # Tools hub
│   ├── dashboard.js             # Tool definitions & rendering
│   ├── admin.html               # Analytics dashboard (password protected)
│   ├── [tool-name]/
│   │   ├── index.html           # Tool interface
│   │   └── app.js               # Tool logic
│   └── ... (41 total tools)
├── style.css                     # Shared styles
├── privacy.html, terms.html, contact.html  # Legal pages
├── robots.txt                    # SEO
├── sitemap.xml                   # SEO
├── vercel.json                   # Vercel configuration
├── package.json                  # Dev dependencies
└── ...
```

## Support

For issues or questions, refer to:
- `DEPLOYMENT_GUIDE.md` - Detailed Vercel deployment steps
- `README.md` - Project overview
- Individual tool files in `/Tools/[tool-name]/index.html`
