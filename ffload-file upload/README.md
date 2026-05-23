# FileHop – Secure File Sharing SaaS

A production-ready file-sharing platform with 2GB per-user storage, Stripe payments, and secure ephemeral sharing.

## Project Structure

```
filehop/
├── frontend/          # Next.js 14+ (React, TypeScript, Tailwind)
├── backend/           # Node.js/Express (TypeScript)
├── docker-compose.yml # Database & services setup
├── .env.example       # Environment variables template
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- AWS S3 account
- Stripe account
- SendGrid account

### Setup

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd filehop
   cp .env.example .env.local
   
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Database**
   ```bash
   docker-compose up -d
   npm run db:migrate
   ```

3. **Development**
   ```bash
   # Terminal 1: Frontend
   cd frontend && npm run dev
   
   # Terminal 2: Backend
   cd backend && npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI, NextAuth.js
- **Backend**: Express.js, TypeScript, PostgreSQL, Prisma ORM
- **Storage**: AWS S3 with signed URLs
- **Payments**: Stripe (Checkout + Billing API)
- **Email**: SendGrid
- **Auth**: NextAuth.js (Google OAuth + Email)
- **Deployment**: Vercel (frontend), Railway/Render (backend)

## Features

- 🔐 Google OAuth + Email/Password authentication
- 📤 Drag-and-drop file upload (up to 500MB per file)
- 💾 2GB per-user storage limit with quota management
- 💳 Stripe payment integration ($1.99 one-time, $3.99/month subscription)
- 🔗 Shareable links with QR codes
- 📧 Email sharing with SendGrid
- 🗑️ 15-day automatic file expiration
- 👥 Admin dashboard with analytics
- 🔍 GDPR, CCPA, and PCI DSS compliant
- 📱 Mobile-responsive UI

## Environment Variables

See `.env.example` for all required variables.

## Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway or Render
- **Database**: PostgreSQL managed instance (e.g., Railway, AWS RDS)

## Documentation

See `SPEC.md` for full product specification.

## License

Proprietary – All rights reserved.
