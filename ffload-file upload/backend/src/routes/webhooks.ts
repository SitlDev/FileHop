import { Router, Request, Response, NextFunction } from 'express';
import { WebhookController } from '../controllers/WebhookController';
import { AppError, ValidationError } from '../utils/errors';
import Stripe from 'stripe';
import express from 'express';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

/**
 * POST /api/webhooks/stripe
 * Stripe webhook endpoint
 * Handles payment, subscription, and invoice events
 * Uses raw body middleware for signature verification
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await WebhookController.handleStripeWebhook(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/webhooks/test
 * Test webhook endpoint for development/staging
 * Allows simulating Stripe webhook events
 * ONLY available in development/staging - blocked in production
 */
router.post('/test', express.json(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new ValidationError('Webhook testing not allowed in production');
    }

    const { eventType, customerId, invoiceId } = req.body;

    if (!eventType) {
      throw new ValidationError('eventType required');
    }

    // Create a mock event based on type
    let mockEvent: any = {
      type: eventType,
      data: { object: {} },
    };

    switch (eventType) {
      case 'invoice.payment_failed':
        mockEvent.data.object = {
          id: invoiceId || `in_test_${Date.now()}`,
          customer: customerId,
          total: 399,
          currency: 'usd',
          paid: false,
        };
        break;

      case 'invoice.payment_succeeded':
        mockEvent.data.object = {
          id: invoiceId || `in_test_${Date.now()}`,
          customer: customerId,
          total: 399,
          currency: 'usd',
          paid: true,
        };
        break;

      case 'payment_intent.succeeded':
        mockEvent.data.object = {
          id: `pi_test_${Date.now()}`,
          customer: customerId,
          amount: 199,
          currency: 'usd',
          status: 'succeeded',
        };
        break;

      default:
        throw new ValidationError(`Unsupported event type for testing: ${eventType}`);
    }

    console.log(`[TEST] Simulating webhook event: ${eventType}`);
    console.log(`[TEST] Mock event:`, mockEvent);

    // Acknowledge the test
    res.json({
      received: true,
      message: `Test event ${eventType} simulated successfully`,
      mockEvent,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
