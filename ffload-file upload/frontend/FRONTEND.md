# FileHop Frontend

## Overview

The FileHop frontend is a Next.js 14 application built with TypeScript, Tailwind CSS, and React. It provides:

- **Landing page** with pricing and features
- **Authentication** (email/password, Google OAuth)
- **Upload page** with drag-and-drop file uploader
- **Dashboard** with file management
- **Download page** with QR code sharing
- **Payment modal** with Stripe integration

## Components

### Core Components

- **FileUploader** - Drag-and-drop file upload with progress tracking
- **StorageQuota** - Visual storage usage indicator
- **FileList** - Table of uploaded files with actions
- **PaymentModal** - Stripe payment UI
- **Dashboard** - Main user dashboard
- **UploadPage** - Upload flow page
- **Navigation** - Top navigation bar
- **AuthForms** - Login and signup forms

### Utilities

- **api.ts** - Axios client with auth interceptors
- **auth-context.tsx** - Auth state management
- **file-utils.ts** - File hashing and MIME type detection
- **types.ts** - TypeScript interfaces
- **utils.ts** - Helper functions (formatBytes, formatDate, etc.)
- **constants.ts** - App constants (file size limits, etc.)

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
NEXT_PUBLIC_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

### `/` - Landing Page
Hero section with features, pricing, and CTAs.

### `/login` - Login Page
Email/password login form with Google OAuth support.

### `/signup` - Signup Page
Email/password signup form with validation.

### `/upload` - Upload Page
Drag-and-drop file uploader with storage quota checking.

### `/download/[uploadId]` - Download Page
Public download page with QR code and sharing options.

### `/dashboard` - Dashboard
User dashboard with file list, storage info, and management options.

## Authentication Flow

1. User signs up or logs in
2. JWT token is stored in localStorage
3. Token is automatically sent with all API requests
4. Token is cleared on logout

## File Upload Flow

1. User selects file with drag-and-drop or click
2. Frontend validates file size
3. Frontend calculates SHA-256 hash
4. File is uploaded to backend API
5. Backend uploads to S3
6. User sees download page with QR code

## Payment Flow

1. User clicks download
2. If not subscribed, payment modal appears
3. User selects one-time ($1.99) or subscription ($3.99/mo)
4. Redirected to Stripe Checkout
5. Upon success, user can download file

## Styling

All components use:
- **Tailwind CSS** for styling
- **Tailwind animations** for transitions
- **Responsive design** (mobile-first)
- **Dark mode ready** (CSS variables)

## Development Tips

### Adding New Components

1. Create component in `src/components/`
2. Use TypeScript interfaces for props
3. Use Tailwind for styling
4. Import and use in pages

### API Integration

```typescript
import { apiClient } from '@/lib/api';

// GET request
const response = await apiClient.get('/endpoint');

// POST request
const response = await apiClient.post('/endpoint', { data });

// DELETE request
await apiClient.delete('/endpoint');
```

### Using Auth

```typescript
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // ...
}
```

## Building for Production

```bash
npm run build
npm run start
```

Or deploy directly to Vercel:

```bash
vercel deploy
```

## Next Steps

- [ ] Add Google OAuth button styling
- [ ] Implement email verification
- [ ] Add password reset flow
- [ ] Implement file preview before download
- [ ] Add file search/filtering
- [ ] Implement admin dashboard UI
- [ ] Add dark mode toggle
- [ ] Optimize images and fonts
- [ ] Add error boundaries
- [ ] Setup analytics (GA4)
