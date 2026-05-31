/**
 * Database Seed Script
 * Populates initial data for development
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { id: 'test-user-1' },
    update: {},
    create: {
      id: 'test-user-1',
      email: 'test@example.com',
      displayName: 'Test Artist',
      timezone: 'America/New_York',
      emailVerified: true,
      notificationsEnabled: true,
    },
  });

  console.log('✓ Created test user:', user.email);

  // Create user preferences
  const preferences = await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      autoSyncEnabled: true,
      syncFrequency: 'daily',
      syncStartTime: '00:00',
      syncCompletionNotif: true,
      syncFailureNotif: true,
      earningsAlertNotif: true,
      earningsAlertThreshold: 100,
      preferredCurrency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      retentionDays: 365,
      autoArchiveOldData: true,
      autoReconcile: true,
      reconciliationTolerance: 0.01,
    },
  });

  console.log('✓ Created user preferences');

  // Create initial encryption key
  const encryptionKey = await prisma.encryptionKey.upsert({
    where: { version: 1 },
    update: {},
    create: {
      version: 1,
      keyHash: Buffer.from('initial-key-hash').toString('hex'),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isActive: true,
    },
  });

  console.log('✓ Created encryption key');

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
