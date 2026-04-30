# YourCalc — 35-Calculator Multi-Page Suite

A professional, high-performance calculator web application built with a dark editorial aesthetic. Optimized for Google AdSense and SEO.

## Project Structure
- `index.html`: Homepage with search-filtered tool grid.
- `finance.html`: Mortgage, Loan, Compound Interest, Salary, etc.
- `health.html`: BMI, TDEE, Body Fat, Macros, Water, etc.
- `ai-costs.html`: AI API Pricing, Cloud Hosting, Tokens.
- `real-estate.html`: Rent vs Buy, Affordability, Rental ROI.
- `savings.html`: Discount, Budget, CC Payoff, Unit Price.
- `career.html`: Total Comp, Freelance Rate, Raise ROI.
- `invest.html`: Crypto P&L, Stock Options, DCA Simulator.
- `sitemap.xml`: SEO Sitemap.
- `robots.txt`: Crawler instructions.

## Configuration Instructions

### 1. Update Domain
All canonical links and the sitemap currently use `https://yourcalc.info`. 
Using VS Code, search and replace `https://yourcalc.info` with your real domain.

### 2. Update AdSense
All ad units use placeholder IDs.
- Search and replace `ca-pub-XXXXXXXXXXXXXXXX` with your **AdSense Publisher ID**.
- Update the `data-ad-slot` values in each file with your specific ad unit IDs from the AdSense dashboard.

### 3. Email Gate
The email capture gate uses `localStorage` to remember users once they've unlocked a calculator. This allows for a "one-time" capture experience across the entire suite. No backend is required for this to function.

## SEO Strategy
The site is built with:
- **JSON-LD Schema**: WebApplication and FAQPage markup on all pages.
- **FAQ Content**: 400+ words of keyword-dense educational content per category.
- **Core Web Vitals**: Zero layout shift (CLS) for ad loading.
- **Mobile First**: Fully responsive sidebar and bottom-nav navigation.

## Deployment
Upload the contents of this folder to any static host (Vercel, Netlify, GitHub Pages, or S3). No build step required.
