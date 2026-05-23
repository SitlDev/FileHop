# FileHop Project Structure

## Root Level
```
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── docker-compose.yml    # PostgreSQL & Redis setup
├── README.md             # Project overview
└── STRUCTURE.md          # This file
```

## Frontend (`/frontend`)

**Tech**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI, NextAuth.js

```
frontend/
├── .env.local.example        # Frontend env vars
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── next.config.js            # Next.js config
├── tailwind.config.js        # Tailwind config
├── postcss.config.js         # PostCSS config
└── src/
    ├── app/
    │   ├── layout.tsx        # Root layout with metadata
    │   ├── page.tsx          # Home page
    │   ├── globals.css       # Global styles
    │   ├── auth/             # Auth routes (login, signup, callback)
    │   ├── dashboard/        # User dashboard (protected)
    │   ├── upload/           # Upload flow pages
    │   └── download/         # Shareable download page
    │
    ├── components/
    │   ├── FileUploader.tsx      # Drag-drop file uploader
    │   ├── StorageQuota.tsx      # Storage display widget
    │   ├── FileList.tsx          # User's file list
    │   ├── PaymentModal.tsx      # Stripe payment modal
    │   ├── QRCodeDisplay.tsx     # QR code component
    │   └── [other UI components]
    │
    └── lib/
        ├── api.ts            # Axios client with interceptors
        ├── constants.ts      # App constants
        ├── types.ts          # TypeScript interfaces
        └── utils.ts          # Helper functions
```

## Backend (`/backend`)

**Tech**: Node.js, Express, TypeScript, PostgreSQL, Prisma ORM

```
backend/
├── .env.example              # Backend env vars
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeding
│
└── src/
    ├── server.ts             # Express server entry point
    │
    ├── middleware/
    │   └── auth.ts           # JWT verification, admin check
    │
    ├── routes/
    │   ├── auth.ts           # Login, signup, logout
    │   ├── uploads.ts        # File upload, delete, list
    │   ├── downloads.ts      # Download link, QR code
    │   ├── payments.ts       # Payment & subscription
    │   ├── profile.ts        # User profile & settings
    │   ├── webhooks.ts       # Stripe webhooks
    │   └── admin.ts          # Admin dashboard routes
    │
    ├── controllers/
    │   ├── AuthController.ts
    │   ├── UploadController.ts
    │   ├── PaymentController.ts
    │   └── AdminController.ts
    │
    ├── services/
    │   ├── S3Service.ts           # AWS S3 operations
    │   ├── StripeService.ts       # Stripe API wrapper
    │   ├── EmailService.ts        # SendGrid email
    │   ├── QRCodeService.ts       # QR code generation
    │   └── [business logic services]
    │
    ├── models/
    │   ├── User.ts
    │   ├── Upload.ts
    │   ├── Payment.ts
    │   └── DownloadLog.ts
    │
    └── utils/
        ├── config.ts         # Environment config
        ├── crypto.ts         # Encryption utilities
        ├── validation.ts     # Input validation
        └── errors.ts         # Custom error classes
```

## Database Schema

**Tables**:
- `users` - User accounts with storage quota tracking
- `uploads` - File metadata with S3 keys
- `payments` - Payment history
- `downloadLogs` - Analytics on downloads
- `adminLogs` - Admin actions for compliance

## Environment Variables

See `.env.example` for all required variables:

### Core Services
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis for caching/queues (optional)

### AWS S3
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`

### Stripe
- `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### SendGrid
- `SENDGRID_API_KEY`

### Auth
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_ID`, `GOOGLE_SECRET`

### File Settings
- `MAX_FILE_SIZE=524288000` (500MB)
- `USER_STORAGE_LIMIT=2147483648` (2GB)
- `FILE_RETENTION_DAYS=15`

## Getting Started

### 1. Install Dependencies
```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Start Database
```bash
docker-compose up -d
```

### 3. Setup Database
```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run Development Servers
```bash
# Terminal 1: Frontend (http://localhost:3000)
cd frontend && npm run dev

# Terminal 2: Backend (http://localhost:5000)
cd backend && npm run dev
```

## Key Features Implemented

- ✅ Project structure and configuration
- ✅ Database schema (Prisma ORM)
- ✅ Authentication middleware
- ✅ AWS S3 service wrapper
- ✅ Stripe payment integration
- ✅ SendGrid email service
- ✅ QR code generation
- ✅ Frontend UI scaffolding
- ✅ API client setup

## Next Steps

1. **Authentication Routes** - Implement login/signup endpoints
2. **File Upload Flow** - Handle multipart file uploads with storage quota validation
3. **Payment Processing** - Stripe Checkout & subscription endpoints
4. **Admin Dashboard** - Analytics and user management
5. **Email Templates** - Design branded email notifications
6. **Frontend Components** - Build out UI from Figma designs
7. **Testing** - Unit and integration tests
8. **Deployment** - Vercel (frontend) + Railway (backend)

## Deployment Checklist

- [ ] Configure all environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure WAF (Cloudflare)
- [ ] Database backups
- [ ] Error logging (Sentry)
- [ ] Uptime monitoring
- [ ] Email authentication (SPF/DKIM)
- [ ] Google Search Console
- [ ] Analytics setup (GA4)
