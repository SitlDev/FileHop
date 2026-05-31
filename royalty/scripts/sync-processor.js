#!/usr/bin/env node

/**
 * Background Sync Job Processor
 *
 * Usage:
 *   node scripts/sync-processor.js          # Process all pending jobs (default: 10)
 *   node scripts/sync-processor.js --limit 20  # Process up to 20 jobs
 *   node scripts/sync-processor.js --once      # Process once and exit (vs continuous)
 *   node scripts/sync-processor.js --user-id <userId>  # Process jobs for specific user
 *
 * Can be run as:
 *   - One-time job (cron, GitHub Actions, etc.)
 *   - Persistent daemon (supervisor, systemd, PM2, etc.)
 *   - Docker container
 */

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Dynamically import ES modules
const importModule = async (modulePath) => {
  const module = await import(modulePath);
  return module.default;
};

/**
 * Main sync processor function
 */
async function main() {
  const prisma = new PrismaClient();

  // Parse command line arguments
  const args = process.argv.slice(2);
  let limit = 10;
  let once = false;
  let userId = null;
  let interval = 60000; // 1 minute default

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--once') {
      once = true;
    } else if (args[i] === '--user-id' && args[i + 1]) {
      userId = args[i + 1];
      i++;
    } else if (args[i] === '--interval' && args[i + 1]) {
      interval = parseInt(args[i + 1], 10) * 1000;
      i++;
    }
  }

  console.log(`
╔════════════════════════════════════════╗
║   RoyaltyOS Sync Job Processor         ║
╚════════════════════════════════════════╝

Configuration:
  - Limit: ${limit} jobs per run
  - Mode: ${once ? 'Run once' : 'Continuous'}
  - Interval: ${once ? 'N/A' : interval / 1000}s
  - User: ${userId || 'All'}
  - Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Unknown'}

Starting...
`);

  const processSyncJob = async () => {
    try {
      // Import the sync processor module
      const syncProcessor = await importModule(
        path.resolve(__dirname, '../src/lib/sync-processor.ts')
      );

      let results;

      if (userId) {
        console.log(`\n[${new Date().toISOString()}] Processing sync jobs for user: ${userId}`);
        results = await syncProcessor.processUserSyncJobs(userId);
      } else {
        console.log(
          `\n[${new Date().toISOString()}] Processing up to ${limit} pending sync jobs...`
        );
        results = await syncProcessor.processPendingSyncJobs(limit);
      }

      // Report results
      if (results.length === 0) {
        console.log('  ✓ No pending jobs found');
      } else {
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        console.log(`\nResults:`);
        console.log(`  ✓ Successful: ${successful}`);
        console.log(`  ✗ Failed: ${failed}`);

        results.forEach((result) => {
          if (result.success) {
            console.log(
              `    ✓ Job ${result.jobId} (${result.platform}): ${result.recordsProcessed} records`
            );
          } else {
            console.log(
              `    ✗ Job ${result.jobId}: ${result.error?.message || 'Unknown error'}`
            );
          }
        });
      }

      if (once) {
        console.log('\n✓ Sync processing complete (once mode)');
        await prisma.$disconnect();
        process.exit(0);
      }
    } catch (error) {
      console.error('Fatal error in sync processor:', error);
      if (!once) {
        // Don't exit in continuous mode, just log and retry
        console.log(`Retrying in ${interval / 1000}s...`);
      } else {
        await prisma.$disconnect();
        process.exit(1);
      }
    }
  };

  // Run once or start continuous processing
  if (once) {
    await processSyncJob();
  } else {
    // Initial run
    await processSyncJob();

    // Set up continuous processing
    const processInterval = setInterval(async () => {
      try {
        await processSyncJob();
      } catch (error) {
        console.error('Error during scheduled sync:', error);
      }
    }, interval);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down sync processor...');
      clearInterval(processInterval);
      await prisma.$disconnect();
      console.log('✓ Sync processor stopped');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\nTerminating sync processor...');
      clearInterval(processInterval);
      await prisma.$disconnect();
      console.log('✓ Sync processor terminated');
      process.exit(0);
    });
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
