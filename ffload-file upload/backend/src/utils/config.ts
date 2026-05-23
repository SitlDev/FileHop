export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '5000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/filehop_dev',

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

  // AWS S3
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'filehop-uploads',

  // Stripe
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@knotstranded.com',

  // File settings
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '524288000'), // 500MB
  USER_STORAGE_LIMIT: parseInt(process.env.USER_STORAGE_LIMIT || '2147483648'), // 2GB
  FILE_RETENTION_DAYS: parseInt(process.env.FILE_RETENTION_DAYS || '15'),
  STORAGE_WARNING_THRESHOLD: 0.9, // 90%

  // Pricing
  ONE_TIME_PRICE_CENTS: 199, // $1.99
  MONTHLY_SUBSCRIPTION_CENTS: 399, // $3.99
};

export function validateConfig(): void {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'STRIPE_SECRET_KEY',
    'RESEND_API_KEY',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      console.warn(`⚠️ Missing environment variable: ${key}`);
    }
  }
}
