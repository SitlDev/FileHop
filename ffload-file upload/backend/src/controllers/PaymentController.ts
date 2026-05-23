import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../utils/errors';
import { StripeService } from '../services/StripeService';
import { EmailService } from '../services/EmailService';
import { config } from '../utils/config';

const prisma = new PrismaClient();

export class PaymentController {
  static async createPaymentIntent(req: AuthRequest, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { paymentType } = req.body;
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await StripeService.createCustomer(user.email, user.name || undefined);
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    if (paymentType === 'one_time') {
      // Create payment intent for one-time purchase
      const intent = await StripeService.createPaymentIntent(
        config.ONE_TIME_PRICE_CENTS,
        user.email,
        `FileHop - Single Download`
      );

      res.json({
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amount: config.ONE_TIME_PRICE_CENTS,
      });
    } else if (paymentType === 'subscription') {
      // Create subscription
      // Note: You'll need to set up a price in Stripe dashboard
      const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
      if (!priceId) {
        throw new ValidationError('Subscription not configured');
      }

      const subscription = await StripeService.createSubscription(stripeCustomerId, priceId);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    }
  }

  static async handlePaymentSuccess(req: AuthRequest, res: Response) {
    const { paymentIntentId, subscriptionId } = req.body;
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    if (paymentIntentId) {
      // Handle one-time payment
      const payment = await prisma.payment.create({
        data: {
          userId,
          stripePaymentId: paymentIntentId,
          amount: config.ONE_TIME_PRICE_CENTS,
          paymentType: 'one_time',
          status: 'succeeded',
        },
      });

      // Send confirmation email
      await EmailService.sendPaymentConfirmation(user.email, payment.amount);

      res.json({
        message: 'Payment successful',
        paymentId: payment.id,
      });
    } else if (subscriptionId) {
      // Handle subscription
      const subscription = await StripeService.retrieveSubscription(subscriptionId);

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'active',
          subscriptionId,
          subscriptionEndDate: endDate,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          userId,
          stripePaymentId: subscriptionId,
          amount: config.MONTHLY_SUBSCRIPTION_CENTS,
          paymentType: 'subscription',
          status: 'succeeded',
        },
      });

      // Send confirmation email
      await EmailService.sendPaymentConfirmation(user.email, config.MONTHLY_SUBSCRIPTION_CENTS);

      res.json({
        message: 'Subscription activated',
        subscriptionId,
      });
    }
  }

  static async cancelSubscription(req: AuthRequest, res: Response) {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.subscriptionId) {
      throw new NotFoundError('Subscription');
    }

    // Cancel in Stripe
    await StripeService.cancelSubscription(user.subscriptionId);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'cancelled',
      },
    });

    res.json({
      message: 'Subscription cancelled',
    });
  }

  static async handleStripeWebhook(req: AuthRequest, res: Response) {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      throw new ValidationError('Missing Stripe signature');
    }

    const event = StripeService.constructWebhookEvent(req.body, signature);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        // Update payment status to succeeded
        await prisma.payment.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: 'succeeded' },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        // Mark subscription as cancelled
        await prisma.user.updateMany({
          where: { subscriptionId: subscription.id },
          data: { subscriptionStatus: 'cancelled' },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        // Handle subscription renewal
        break;
      }
    }

    res.json({ received: true });
  }

  static async getPaymentHistory(req: AuthRequest, res: Response) {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          stripePaymentId: true,
          amount: true,
          currency: true,
          paymentType: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      stripeId: payment.stripePaymentId,
      amount: (payment.amount / 100).toFixed(2),
      currency: payment.currency.toUpperCase(),
      type: payment.paymentType === 'one_time' ? 'One-time' : 'Subscription',
      status: payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
      date: payment.createdAt.toISOString().split('T')[0],
      createdAt: payment.createdAt,
    }));

    res.json({
      payments: formattedPayments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  }

  static async getSubscriptionStatus(req: AuthRequest, res: Response) {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.subscriptionId) {
      return res.json({
        hasSubscription: false,
        status: 'free',
      });
    }

    // Fetch subscription details from Stripe
    const subscription = await StripeService.retrieveSubscription(user.subscriptionId);
    const items = subscription.items.data[0];
    const price = items?.price;

    res.json({
      hasSubscription: true,
      status: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
      amount: price?.unit_amount ? (price.unit_amount / 100).toFixed(2) : '0',
      currency: (subscription.currency || 'usd').toUpperCase(),
      billingPeriod: `${price?.recurring?.interval === 'month' ? 'Monthly' : 'Yearly'}`,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  static async createPaymentMethodIntent(req: AuthRequest, res: Response) {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await StripeService.createCustomer(user.email, user.name || undefined);
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Create SetupIntent for payment method collection
    const setupIntent = await StripeService.createSetupIntent(stripeCustomerId);

    res.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  }

  static async confirmPaymentMethod(req: AuthRequest, res: Response) {
    const { setupIntentId, paymentMethodId } = req.body;
    const userId = req.userId!;

    if (!setupIntentId || !paymentMethodId) {
      throw new ValidationError('setupIntentId and paymentMethodId required');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      throw new NotFoundError('User or Stripe customer');
    }

    // Verify payment method is in Stripe
    const paymentMethod = await StripeService.retrievePaymentMethod(paymentMethodId);
    if (!paymentMethod) {
      throw new NotFoundError('Payment method');
    }

    // Update customer's default payment method
    await StripeService.updateDefaultPaymentMethod(user.stripeCustomerId, paymentMethodId);

    await EmailService.sendPaymentMethodUpdated(user.email);

    res.json({
      message: 'Payment method updated successfully',
      last4: (paymentMethod.card as any)?.last4,
      brand: (paymentMethod.card as any)?.brand,
    });
  }

  static async getFailedPayments(req: AuthRequest, res: Response) {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      throw new NotFoundError('User or Stripe customer');
    }

    // Get failed invoices from Stripe
    const failedInvoices = await StripeService.listFailedInvoices(user.stripeCustomerId);

    const formattedInvoices = failedInvoices.map((invoice: any) => ({
      id: invoice.id,
      amount: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      dueDate: new Date(invoice.due_date * 1000).toISOString(),
      status: invoice.paid ? 'paid' : 'unpaid',
      lastAttemptDate: invoice.last_finalization_error?.created
        ? new Date(invoice.last_finalization_error.created * 1000).toISOString()
        : null,
    }));

    res.json({
      failedPayments: formattedInvoices,
      count: formattedInvoices.length,
    });
  }

  static async retryFailedPayments(req: AuthRequest, res: Response) {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      throw new NotFoundError('User or Stripe customer');
    }

    // Get failed invoices from Stripe
    const failedInvoices = await StripeService.listFailedInvoices(user.stripeCustomerId);

    if (failedInvoices.length === 0) {
      return res.json({
        message: 'No failed payments to retry',
        retriedCount: 0,
      });
    }

    const retriedInvoices = [];
    const successfulAmounts: number[] = [];
    let successCount = 0;

    for (const invoice of failedInvoices) {
      try {
        const retried = await StripeService.retryInvoice(invoice.id);
        retriedInvoices.push({
          invoiceId: invoice.id,
          status: retried.paid ? 'succeeded' : 'pending',
          amount: retried.amount_paid,
        });

        // Record payment if successful
        if (retried.paid) {
          await prisma.payment.create({
            data: {
              userId,
              stripePaymentId: invoice.id,
              amount: retried.amount_paid || 0,
              paymentType: 'subscription',
              status: 'succeeded',
            },
          });
          successfulAmounts.push(retried.amount_paid || 0);
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to retry invoice ${invoice.id}:`, error);
      }
    }

    // Send email notification with retry results
    try {
      await EmailService.sendPaymentRetrySuccess(
        user.email,
        retriedInvoices.length,
        successCount,
        successfulAmounts
      );
    } catch (error) {
      console.error('Failed to send payment retry success email:', error);
      // Don't throw - email failure shouldn't block the response
    }

    res.json({
      message: `Retried ${retriedInvoices.length} failed payment${retriedInvoices.length !== 1 ? 's' : ''}`,
      retriedCount: retriedInvoices.length,
      invoices: retriedInvoices,
    });
  }
}
