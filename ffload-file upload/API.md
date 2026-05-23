# FileHop API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### POST `/auth/register`
Register a new user with email/password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "storageUsedBytes": 0,
    "storageQuotaBytes": 2147483648
  }
}
```

### POST `/auth/login`
Login user with email/password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": { ... }
}
```

### POST `/auth/logout`
Logout user. Frontend should delete token from storage.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### POST `/auth/google`
Handle Google OAuth authentication.

**Body:**
```json
{
  "googleId": "google_id_here",
  "email": "user@example.com",
  "name": "John Doe",
  "image": "profile_image_url"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": { ... }
}
```

---

## Upload Endpoints

### POST `/uploads`
Create a new file upload. Requires authentication.

**Body (multipart/form-data):**
- `filename` (string): Original filename
- `fileBuffer` (buffer): File content
- `fileSizeBytes` (number): File size in bytes
- `mimeType` (string): MIME type (e.g., "application/pdf")
- `fileHash` (string): SHA-256 hash of file content

**Response (201):**
```json
{
  "upload": {
    "id": "upload_id",
    "filename": "document.pdf",
    "fileSizeBytes": "1048576",
    "uploadedAt": "2026-05-22T10:30:00Z",
    "expiresAt": "2026-06-06T10:30:00Z"
  }
}
```

**Errors:**
- `413 Payload Too Large`: Storage quota exceeded
- `400 Bad Request`: File too large (max 500MB)

### GET `/uploads`
List authenticated user's uploads. Requires authentication.

**Response (200):**
```json
{
  "uploads": [
    {
      "id": "upload_id",
      "filename": "document.pdf",
      "fileSizeBytes": "1048576",
      "uploadedAt": "2026-05-22T10:30:00Z",
      "expiresAt": "2026-06-06T10:30:00Z",
      "downloadCount": 3,
      "status": "active"
    }
  ]
}
```

### DELETE `/uploads/:uploadId`
Delete a user's upload. Requires authentication.

**Response (200):**
```json
{
  "message": "Upload deleted successfully"
}
```

### GET `/uploads/:uploadId/check-quota`
Check if user has quota for a specific upload.

**Response (200):**
```json
{
  "storageUsedBytes": "1048576",
  "storageQuotaBytes": "2147483648",
  "wouldExceedQuota": false,
  "availableBytes": "2146435072"
}
```

---

## Download Endpoints

### GET `/downloads/:uploadId`
Get signed download URL for an upload. Public endpoint.

**Response (200):**
```json
{
  "filename": "document.pdf",
  "fileSizeBytes": "1048576",
  "downloadUrl": "https://s3.amazonaws.com/...",
  "expiresAt": "2026-06-06T10:30:00Z",
  "daysRemaining": 15,
  "downloadCount": 1
}
```

### GET `/downloads/:uploadId/qr`
Get QR code for shareable download link. Public endpoint.

**Response (200):**
```json
{
  "qrCode": "data:image/png;base64,...",
  "downloadLink": "https://filehop.com/download/upload_id"
}
```

### POST `/downloads/:uploadId/share`
Share upload via email.

**Body:**
```json
{
  "uploadId": "upload_id",
  "recipientEmail": "recipient@example.com"
}
```

**Response (200):**
```json
{
  "message": "Download link sent to recipient@example.com"
}
```

### GET `/downloads/:uploadId/page`
Get public download page information. Public endpoint.

**Response (200):**
```json
{
  "filename": "document.pdf",
  "fileSizeBytes": "1048576",
  "uploadedAt": "2026-05-22T10:30:00Z",
  "expiresAt": "2026-06-06T10:30:00Z",
  "daysRemaining": 15,
  "downloadCount": 3
}
```

---

## Payment Endpoints

### POST `/payments/intent`
Create a Stripe payment intent or subscription. Requires authentication.

**Body:**
```json
{
  "paymentType": "one_time" // or "subscription"
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_...",
  "paymentIntentId": "pi_...",
  "amount": 199
}
```

### POST `/payments/confirm`
Confirm successful payment. Requires authentication.

**Body:**
```json
{
  "paymentIntentId": "pi_..." // or "subscriptionId"
}
```

**Response (200):**
```json
{
  "message": "Payment successful",
  "paymentId": "payment_id"
}
```

### POST `/payments/cancel-subscription`
Cancel active subscription. Requires authentication.

**Response (200):**
```json
{
  "message": "Subscription cancelled"
}
```

### POST `/payments/webhooks/stripe`
Stripe webhook handler for payment events. Requires Stripe signature header.

**Header:**
```
Stripe-Signature: t=...,v1=...
```

---

## Profile Endpoints

### GET `/profile`
Get authenticated user's profile. Requires authentication.

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "profile_url",
    "storageUsedBytes": "1048576",
    "storageQuotaBytes": "2147483648",
    "subscriptionStatus": "free",
    "subscriptionEndDate": null,
    "createdAt": "2026-05-22T10:30:00Z"
  }
}
```

### PUT `/profile`
Update authenticated user's profile. Requires authentication.

**Body:**
```json
{
  "name": "Updated Name",
  "image": "new_image_url"
}
```

**Response (200):**
```json
{
  "user": { ... }
}
```

### GET `/profile/storage`
Get user's storage information and file breakdown. Requires authentication.

**Response (200):**
```json
{
  "storageUsedBytes": "1048576",
  "storageQuotaBytes": "2147483648",
  "percentUsed": 0.00048828125,
  "uploads": [
    {
      "id": "upload_id",
      "filename": "document.pdf",
      "fileSizeBytes": "1048576",
      "uploadedAt": "2026-05-22T10:30:00Z"
    }
  ]
}
```

---

## Admin Endpoints

All admin endpoints require authentication and admin role.

### GET `/admin/dashboard`
Get admin dashboard statistics.

**Response (200):**
```json
{
  "stats": {
    "totalUploads": 150,
    "totalDownloads": 500,
    "totalUsers": 50,
    "activeSubscribers": 10,
    "totalRevenue": 1500.00,
    "monthlyRevenue": 300.00,
    "totalStorageBytes": 107374182400,
    "averageStoragePerUser": 2.15
  }
}
```

### GET `/admin/users`
List all users with optional search. Query params: `search`, `page`, `limit`

**Response (200):**
```json
{
  "users": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "storageUsedBytes": "1048576",
      "subscriptionStatus": "free",
      "createdAt": "2026-05-22T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

### GET `/admin/uploads`
Search uploads. Query params: `filename`, `userId`, `minSize`, `maxSize`, `page`, `limit`

**Response (200):**
```json
{
  "uploads": [ ... ],
  "pagination": { ... }
}
```

### DELETE `/admin/users/:userId`
Delete user and all their data.

**Body:**
```json
{
  "reason": "GDPR request"
}
```

**Response (200):**
```json
{
  "message": "User data deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials",
  "code": "AUTH_ERROR"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required",
  "code": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "error": "Upload not found",
  "code": "NOT_FOUND"
}
```

### 413 Payload Too Large
```json
{
  "error": "Storage quota exceeded",
  "code": "QUOTA_EXCEEDED"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "code": "INTERNAL_ERROR"
}
```

---

## Rate Limiting

- Upload: 10 per hour per IP (unauthenticated)
- Download: 100 per hour per IP
- API: 1000 per hour per user

---

## Example Workflows

### Upload File (Authenticated)
```
1. POST /auth/login → get token
2. POST /uploads → upload file (requires token)
3. GET /downloads/:uploadId → get signed URL
4. GET /downloads/:uploadId/qr → get QR code
```

### Payment Flow (Subscriber)
```
1. POST /payments/intent → create payment intent
2. [User completes Stripe Checkout]
3. POST /payments/confirm → confirm payment
4. User now has subscription
```

### Admin Management
```
1. POST /auth/login (admin@knotstranded.com) → get admin token
2. GET /admin/dashboard → view stats
3. GET /admin/users → list users
4. DELETE /admin/users/:userId → manage users
```
