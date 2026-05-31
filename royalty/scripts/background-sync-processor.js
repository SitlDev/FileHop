#!/usr/bin/env node

/**
 * Background Sync Processor for RoyaltyOS
 * 
 * Runs as a standalone Node.js process to execute scheduled synchronizations.
 * Can be managed by PM2, systemd, or Docker.
 * 
 * Usage:
 *   node scripts/background-sync-processor.js [--interval 60000] [--once]
 * 
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string
 *   SYNC_INTERVAL - Interval in milliseconds (default: 60000 = 1 minute)
 *   NODE_ENV - development|production
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isOnce = args.includes('--once');
const intervalMs = parseInt(
  args.find((arg) => arg.startsWith('--interval'))?.split('=')[1] || '60000',
);

interface SyncResult {
  success: boolean;
  error?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * Execute earnings sync for an entity
 */
async function syncEarnings(userId: string, entityId?: string): Promise<SyncResult> {
  const startTime = new Date();
  try {
    // TODO: Implement earnings sync
    // Call MultiDSPSyncManager.syncAllDSPEarnings(userId, entityId)
    // Apply AccountingMapping configurations
    // Create GL journal entries
    // Log to audit trail

    const endTime = new Date();
    return {
      success: true,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };
  } catch (error) {
    const endTime = new Date();
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };
  }
}

/**
 * Execute payouts sync for an entity
 */
async function syncPayouts(userId: string, entityId?: string): Promise<SyncResult> {
  const startTime = new Date();
  try {
    // TODO: Implement payouts sync
    // Call PayoutScheduler.executePendingPayouts(userId, entityId)
    // Apply AccountingMapping configurations
    // Create GL journal entries
    // Log to audit trail

    const endTime = new Date();
    return {
      success: true,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };
  } catch (error) {
    const endTime = new Date();
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };
  }
}

/**
 * Execute a single sync schedule
 */
async function executeSchedule(schedule: any): Promise<{
  success: boolean;
  results: SyncResult[];
  error?: string;
}> {
  console.log(`[${new Date().toISOString()}] ⏱️  Executing schedule ${schedule.id}`);

  const results: SyncResult[] = [];

  try {
    if (schedule.syncType === 'EARNINGS' || schedule.syncType === 'ALL') {
      const result = await syncEarnings(schedule.userId, schedule.entityId);
      results.push(result);
      console.log(
        `  - Earnings sync: ${result.success ? '✓ Success' : '✗ Failed'} (${result.duration}ms)`,
      );
    }

    if (schedule.syncType === 'PAYOUTS' || schedule.syncType === 'ALL') {
      const result = await syncPayouts(schedule.userId, schedule.entityId);
      results.push(result);
      console.log(
        `  - Payouts sync: ${result.success ? '✓ Success' : '✗ Failed'} (${result.duration}ms)`,
      );
    }

    const allSuccess = results.every((r) => r.success);

    // Update schedule in database
    const nextRunAt = calculateNextRunTime(schedule);
    await prisma.syncSchedule.update({
      where: { id: schedule.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
        lastStatus: allSuccess ? 'success' : 'failed',
        lastErrorMessage: allSuccess ? null : results.find((r) => r.error)?.error,
        runCount: { increment: 1 },
        failureCount: allSuccess ? undefined : { increment: 1 },
      },
    });

    return {
      success: allSuccess,
      results,
      error: allSuccess ? undefined : results.find((r) => r.error)?.error,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ✗ Error: ${errorMessage}`);

    // Update schedule with failure
    await prisma.syncSchedule.update({
      where: { id: schedule.id },
      data: {
        lastRunAt: new Date(),
        lastStatus: 'failed',
        lastErrorMessage: errorMessage,
        failureCount: { increment: 1 },
      },
    });

    return {
      success: false,
      results,
      error: errorMessage,
    };
  }
}

/**
 * Calculate next run time based on schedule configuration
 */
function calculateNextRunTime(schedule: any): Date {
  const now = new Date();
  const next = new Date(now);

  // Map timezone to UTC offset (simplified - in production use a proper library)
  const tzOffsets: Record<string, number> = {
    UTC: 0,
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
    'Europe/London': 0,
    'Europe/Paris': 1,
  };

  const offset = (tzOffsets[schedule.timeZone] || 0) * 60 * 60 * 1000;

  switch (schedule.frequency) {
    case 'HOURLY':
      next.setHours(next.getHours() + 1);
      break;
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      next.setHours(schedule.hourOfDay || 0, 0, 0, 0);
      next.setTime(next.getTime() + offset);
      break;
    case 'WEEKLY':
      const daysUntilDayOfWeek = ((schedule.dayOfWeek || 1) - next.getDay() + 7) % 7;
      next.setDate(next.getDate() + (daysUntilDayOfWeek === 0 ? 7 : daysUntilDayOfWeek));
      next.setHours(schedule.hourOfDay || 0, 0, 0, 0);
      next.setTime(next.getTime() + offset);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      next.setDate(schedule.dayOfMonth || 1);
      next.setHours(schedule.hourOfDay || 0, 0, 0, 0);
      next.setTime(next.getTime() + offset);
      break;
  }

  return next;
}

/**
 * Process all due schedules
 */
async function processDueSchedules(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  try {
    // Get all active schedules that are due to run
    const dueSchedules = await prisma.syncSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: new Date(),
        },
      },
      take: 50, // Process max 50 schedules per cycle
    });

    console.log(`[${new Date().toISOString()}] 🔄 Processing ${dueSchedules.length} due schedules...`);

    const stats = {
      processed: dueSchedules.length,
      successful: 0,
      failed: 0,
    };

    for (const schedule of dueSchedules) {
      const result = await executeSchedule(schedule);
      if (result.success) {
        stats.successful++;
      } else {
        stats.failed++;
      }
    }

    console.log(
      `[${new Date().toISOString()}] ✓ Completed: ${stats.successful} successful, ${stats.failed} failed\n`,
    );

    return stats;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Fatal error:`, error);
    throw error;
  }
}

/**
 * Main processor loop
 */
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║        RoyaltyOS Background Sync Processor v2.0            ║
╚════════════════════════════════════════════════════════════╝

Environment:
  NODE_ENV: ${process.env.NODE_ENV || 'development'}
  Database: ${process.env.DATABASE_URL?.split('@')[1] || 'not configured'}
  Interval: ${isOnce ? 'ONE-TIME' : intervalMs + 'ms'}
  Started: ${new Date().toISOString()}

  `);

  if (isOnce) {
    // Run once and exit
    try {
      await processDueSchedules();
      console.log('✓ One-time execution completed');
      process.exit(0);
    } catch (error) {
      console.error('✗ One-time execution failed:', error);
      process.exit(1);
    }
  } else {
    // Run as daemon
    process.on('SIGTERM', async () => {
      console.log('\n[SIGTERM] Gracefully shutting down...');
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\n[SIGINT] Gracefully shutting down...');
      await prisma.$disconnect();
      process.exit(0);
    });

    // Run immediately
    await processDueSchedules().catch(console.error);

    // Then run on interval
    setInterval(async () => {
      await processDueSchedules().catch(console.error);
    }, intervalMs);
  }
}

main().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
