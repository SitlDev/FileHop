# YourCalc Admin Setup Guide

## Step 1: Google Analytics 4
1. Create GA4 property at analytics.google.com
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to every page <head>:
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
4. For admin dashboard API access:
   - Create Google Cloud project
   - Enable Google Analytics Data API
   - Create OAuth 2.0 credentials
   - Store client ID and secret in /admin/config.js (gitignored)

## Step 2: Google Search Console
1. Verify yourcalc.info at search.google.com/search-console
2. Submit sitemap: https://yourcalc.info/sitemap.xml
3. For API access:
   - Enable Search Console API in same Google Cloud project
   - Use same OAuth credentials as GA4

## Step 3: Google AdSense
1. Apply at adsense.google.com with admin@knotstranded.com
2. Once approved, get publisher ID (ca-pub-XXXXXXXXXX)
3. Replace all ad placeholder divs with actual AdSense code
4. For API access:
   - Enable AdSense Management API in Google Cloud project
   - Use same OAuth credentials

## Step 4: Admin Password
1. Choose a strong password
2. Generate SHA-256 hash at: https://emn178.github.io/online-tools/sha256.html
3. Replace ADMIN_HASH constant in /admin/index.html

## Step 5: Lead Capture Backend (Optional)
For leads to persist beyond a single browser:
- Option A: Formspree (formspree.io) — free tier, no backend needed
- Option B: Netlify Forms — if hosting on Netlify
- Option C: Custom endpoint — set window.YC_LEADS_ENDPOINT = 'https://your-endpoint.com/leads'

## Step 6: Deploy /admin
- Add /admin/ to .gitignore if repo is public
- Or password-protect via hosting provider (Netlify: use _redirects with basic auth)

## Step 7: Neon Postgres Server-Side Authentication
1. Since we migrated to **Neon Postgres Auth**, ensure these environment variables are added to Vercel:
   - `DATABASE_URL` (Your Neon connection string)
   - `AUTH_SECRET` (A random string for signing session cookies)
   - `ADMIN_EMAIL` (set to `admin@knotstranded.com`)
2. **Initialize the Database**:
   - Visit `yourcalc.info/api/auth/setup-db` once to create the `admin_users` table and insert the initial admin.
   - Default password: `KnotStranded2026!`
3. **Change Password**:
   - To change the password, you must update the `password_hash` in the `admin_users` table with a SHA-256 hash of your new password.
4. Vercel automatically runs the `middleware.ts` at the edge to verify the `yc_session` cookie against your `AUTH_SECRET`.
