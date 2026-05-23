import { Router, raw } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { validatePaymentIntent } from '../utils/validation';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/payments/intent
 * Create Stripe payment intent
 * Authenticated users only
 */
router.post('/intent', verifyToken, validatePaymentIntent(), async (req, res, next) => {
  try {
    await PaymentController.createPaymentIntent(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/confirm
 * Handle successful payment
 * Authenticated users only
 */
router.post('/confirm', verifyToken, async (req, res, next) => {
  try {
    await PaymentController.handlePaymentSuccess(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/cancel-subscription
 * Cancel active subscription
 * Authenticated users only
 */
router.post('/cancel-subscription', verifyToken, async (req, res, next) => {
  try {
    await PaymentController.cancelSubscription(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/history
 * Get payment history
 * Authenticated users only
 * Query params: limit=10, page=1
 */
router.get('/history', verifyToken, async (req, res, next) => {
  try {
    await PaymentController.getPaymentHistory(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/subscription
 * Get subscription status
 * Authenticated users only
 */
router.get('/subscription', verifyToken, async (req, res, next) => {
  try {
    await PaymentController.getSubscriptionStatus(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/payment-method/intent
 * Create SetupIntent for payment method update
 * Authenticated users only
 */
router.post('/payment-method/intent', verifyToken, async (req, res, next) => {
  try {
    await PaymentController.createPaymentMethodIntent(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/payment-method/confirm
 * Confirm and update payment method
 * Authenticated users only
 */
router.post('/payment-method/confirm', verifyToken, async (req, res, next) => {
  try {
    await PaymentController.confirmPaymentMethod(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/failed
 * Get list of failed payments
 * Authenticated users only
 */
router.get('/failed', verifyToken, async (req, res, next) => {
  try {
    await PaymentController.getFailedPayments(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/retry
 * Retry failed payments
 * Authenticated users only
 */
router.post('/retry', verifyToken, async (req, res, next) => {
  try {
    await PaymentController.retryFailedPayments(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webhooks/stripe
 * Stripe webhook for payment events
 * Requires raw body for signature verification
 */
router.post(
  '/webhooks/stripe',
  raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      await PaymentController.handleStripeWebhook(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
