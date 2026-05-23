import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';

const API_BASE_URL = 'http://localhost:5000/api';

interface TestContext {
  token?: string;
  userId?: string;
  uploadId?: string;
  email: string;
  password: string;
  name: string;
}

const context: TestContext = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123',
  name: 'Test User',
};

interface StripeTestContext {
  paymentIntentId?: string;
  subscriptionId?: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (context.token) {
    config.headers.Authorization = `Bearer ${context.token}`;
  }
  return config;
});

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error: any) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

async function runTests() {
  console.log('\n🚀 Starting FileHop Integration Tests\n');

  // Test 1: Signup
  await test('Signup new user', async () => {
    const response = await api.post('/auth/register', {
      email: context.email,
      password: context.password,
      name: context.name,
    });

    context.token = response.data.token;
    context.userId = response.data.user.id;

    if (!context.token) throw new Error('No token received');
    if (!context.userId) throw new Error('No user ID received');
  });

  // Test 2: Get profile
  await test('Get user profile', async () => {
    const response = await api.get('/profile');
    if (response.data.user.email !== context.email) throw new Error('Email mismatch');
    if (response.data.user.storageUsedBytes !== 0) throw new Error('Storage should be 0');
  });

  // Test 3: Create a test file and upload
  await test('Upload test file', async () => {
    // Create a 1MB test file
    const fileContent = crypto.randomBytes(1024 * 1024);
    const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');

    const response = await api.post(
      '/uploads',
      {
        filename: 'test-file.bin',
        fileSizeBytes: fileContent.length,
        mimeType: 'application/octet-stream',
        fileHash,
        fileBuffer: fileContent.toString('base64'),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    context.uploadId = response.data.upload.id;

    if (!context.uploadId) throw new Error('No upload ID received');
    if (response.data.upload.fileSizeBytes !== fileContent.length) throw new Error('File size mismatch');
  });

  // Test 4: Check storage quota
  await test('Check storage quota', async () => {
    const response = await api.get('/profile/storage');

    if (response.data.storageUsedBytes === 0) throw new Error('Storage should be > 0 after upload');
    if (response.data.percentUsed === 0) throw new Error('Percent used should be > 0');
  });

  // Test 5: List uploads
  await test('List user uploads', async () => {
    const response = await api.get('/uploads');

    if (!Array.isArray(response.data.uploads)) throw new Error('Uploads should be an array');
    if (response.data.uploads.length !== 1) throw new Error('Should have 1 upload');
    if (response.data.uploads[0].id !== context.uploadId) throw new Error('Upload ID mismatch');
  });

  // Test 6: Get download link
  await test('Get download link', async () => {
    if (!context.uploadId) throw new Error('No upload ID');

    const response = await api.get(`/downloads/${context.uploadId}`);

    if (!response.data.downloadUrl) throw new Error('No download URL');
    if (response.data.downloadCount !== 1) throw new Error('Download count should be 1');
  });

  // Test 7: Get QR code
  await test('Generate QR code', async () => {
    if (!context.uploadId) throw new Error('No upload ID');

    const response = await api.get(`/downloads/${context.uploadId}/qr`);

    if (!response.data.qrCode) throw new Error('No QR code');
    if (!response.data.downloadLink) throw new Error('No download link');
  });

  // Test 8: Share via email
  await test('Share file via email', async () => {
    if (!context.uploadId) throw new Error('No upload ID');

    const response = await api.post(`/downloads/${context.uploadId}/share`, {
      recipientEmail: 'recipient@example.com',
    });

    if (!response.data.message) throw new Error('No response message');
  });

  // Test 9: Get public download page info
  await test('Get public download page info', async () => {
    if (!context.uploadId) throw new Error('No upload ID');

    const response = await api.get(`/downloads/${context.uploadId}/page`);

    if (!response.data.filename) throw new Error('No filename');
    if (response.data.daysRemaining < 14) throw new Error('Days remaining should be ~15');
  });

  // Stripe Payment Tests
  const stripeContext: StripeTestContext = {};

  // Test 10: Create one-time payment intent
  await test('Create one-time payment intent', async () => {
    const response = await api.post('/payments/intent', {
      paymentType: 'one_time',
    });

    if (!response.data.clientSecret) throw new Error('No client secret');
    if (!response.data.paymentIntentId) throw new Error('No payment intent ID');
    if (response.data.amount !== 199) throw new Error('Amount should be 199 cents ($1.99)');

    stripeContext.paymentIntentId = response.data.paymentIntentId;
  });

  // Test 11: Confirm one-time payment success
  await test('Confirm one-time payment success', async () => {
    if (!stripeContext.paymentIntentId) throw new Error('No payment intent ID');

    const response = await api.post('/payments/confirm', {
      paymentIntentId: stripeContext.paymentIntentId,
    });

    if (!response.data.message) throw new Error('No confirmation message');
    if (!response.data.paymentId) throw new Error('No payment ID');
  });

  // Test 12: Create subscription payment intent
  await test('Create subscription payment intent', async () => {
    const response = await api.post('/payments/intent', {
      paymentType: 'subscription',
    });

    if (!response.data.subscriptionId) throw new Error('No subscription ID');
    if (!response.data.clientSecret) throw new Error('No client secret');

    stripeContext.subscriptionId = response.data.subscriptionId;
  });

  // Test 13: Confirm subscription payment success
  await test('Confirm subscription payment success', async () => {
    if (!stripeContext.subscriptionId) throw new Error('No subscription ID');

    const response = await api.post('/payments/confirm', {
      subscriptionId: stripeContext.subscriptionId,
    });

    if (!response.data.message) throw new Error('No confirmation message');
  });

  // Test 14: Cancel subscription
  await test('Cancel subscription', async () => {
    if (!stripeContext.subscriptionId) throw new Error('No subscription ID');

    const response = await api.post('/payments/cancel-subscription', {
      subscriptionId: stripeContext.subscriptionId,
    });

    if (!response.data.message) throw new Error('No cancellation message');
  });

  // Test 15: Get payment history
  await test('Get payment history', async () => {
    const response = await api.get('/payments/history');

    if (!response.data.payments) throw new Error('No payments array');
    if (!Array.isArray(response.data.payments)) throw new Error('Payments should be an array');
    if (!response.data.pagination) throw new Error('No pagination data');

    // Should have at least 1 payment (the one-time payment from test 11)
    if (response.data.payments.length < 1) throw new Error('Should have at least 1 payment');
  });

  // Test 16: Get subscription status
  await test('Get subscription status', async () => {
    const response = await api.get('/payments/subscription');

    if (response.data.hasSubscription === undefined) throw new Error('No hasSubscription field');
    if (!response.data.status) throw new Error('No status field');

    // After cancellation, should show cancelled or false
    if (response.data.hasSubscription && response.data.status === 'active') {
      throw new Error('Subscription should be cancelled');
    }
  });

  // Test 17: Delete upload
  await test('Delete upload', async () => {
    if (!context.uploadId) throw new Error('No upload ID');

    await api.delete(`/uploads/${context.uploadId}`);

    // Verify it's deleted
    const uploads = await api.get('/uploads');
    if (uploads.data.uploads.length !== 0) throw new Error('Upload should be deleted');
  });

  // Test 18: Login as different user should fail
  await test('Login validation (should fail with wrong password)', async () => {
    try {
      await api.post('/auth/login', {
        email: context.email,
        password: 'WrongPassword',
      });
      throw new Error('Should have failed');
    } catch (error: any) {
      if (error.response?.status !== 401) throw error;
      // Expected to fail
    }
  });

  // Test 19: Successful login
  await test('Login user', async () => {
    const response = await api.post('/auth/login', {
      email: context.email,
      password: context.password,
    });

    if (!response.data.token) throw new Error('No token received');
    context.token = response.data.token;
  });

  // Test 20: Create payment method intent
  await test('Create payment method update intent', async () => {
    const response = await api.post('/payments/payment-method/intent');

    if (!response.data.clientSecret) throw new Error('No clientSecret');
    if (!response.data.setupIntentId) throw new Error('No setupIntentId');

    // Store for next test
    (stripeContext as any).setupIntentId = response.data.setupIntentId;
  });

  // Test 21: Retry failed payments (should return 0 if no failed payments)
  await test('Retry failed payments', async () => {
    const response = await api.post('/payments/retry');

    if (response.data.retriedCount === undefined) throw new Error('No retriedCount in response');
    if (!response.data.message) throw new Error('No message in response');
  });

  // Test 22: Test webhook testing endpoint
  await test('Webhook test endpoint (invoke simulation)', async () => {
    const response = await api.post('/webhooks/test', {
      eventType: 'invoice.payment_failed',
      customerId: 'cus_test_123',
      invoiceId: 'in_test_456',
    });

    if (!response.data.received) throw new Error('Webhook not received');
    if (!response.data.mockEvent) throw new Error('No mock event returned');
    if (response.data.mockEvent.type !== 'invoice.payment_failed') throw new Error('Wrong event type');
  });

  // Test 23: Get failed payments (should return empty if no failed payments)
  await test('Get failed payments list', async () => {
    const response = await api.get('/payments/failed');

    if (response.data.failedPayments === undefined) throw new Error('No failedPayments in response');
    if (response.data.count === undefined) throw new Error('No count in response');
    // Should be empty or have failed payments, but structure should be consistent
  });

  console.log('\n✅ All tests passed!\n');
}

runTests().catch((error) => {
  console.error('\n❌ Test suite failed\n', error.message);
  process.exit(1);
});
