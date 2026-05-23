import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { StripeService } from '../services/StripeService';
import { EmailService } from '../services/EmailService';
import { ValidationError } from '../utils/errors';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

export class WebhookController {
  static async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.body;

    if (!signature) {
      throw new ValidationError('Missing stripe signature');
    }

    let event: Stripe.Event;

    try {
      event = StripeService.constructWebhookEvent(
        typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody,
        signature
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new ValidationError('Invalid webhook signature');
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      // Payment intent succeeded (one-time payment)
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      // Customer subscription created
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      // Customer subscription updated
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      // Customer subscription deleted (cancelled)
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // Invoice payment succeeded (recurring billing)
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      // Invoice payment failed
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
}

// Helper functions
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const customerId = paymentIntent.customer as string;
  const metadata = paymentIntent.metadata;

  if (!customerId) {
    console.warn('Payment intent has no customer ID');
    return;
  }

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.warn(`User not found for customer: ${customerId}`);
    return;
  }

  // Record payment
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentType: 'one_time',
      status: 'succeeded',
    },
  });

  console.log(`Payment recorded for user ${user.id}: ${paymentIntent.id}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  if (!customerId) {
    console.warn('Subscription has no customer ID');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.warn(`User not found for customer: ${customerId}`);
    return;
  }

  // Update user subscription
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    },
  });

  // Record payment for subscription
  const items = subscription.items.data[0];
  const amount = items?.price?.unit_amount || 0;

  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentId: subscription.id,
      amount: amount,
      currency: subscription.currency || 'usd',
      paymentType: 'subscription',
      status: 'succeeded',
    },
  });

  console.log(`Subscription created for user ${user.id}: ${subscription.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  if (!customerId) {
    console.warn('Subscription has no customer ID');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.warn(`User not found for customer: ${customerId}`);
    return;
  }

  // Update subscription status based on Stripe status
  const status = subscription.status === 'active' ? 'active' : 'cancelled';

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: status,
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`Subscription updated for user ${user.id}: status=${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  if (!customerId) {
    console.warn('Subscription has no customer ID');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.warn(`User not found for customer: ${customerId}`);
    return;
  }

  // Mark subscription as cancelled
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'cancelled',
      subscriptionEndDate: new Date(),
    },
  });

  console.log(`Subscription cancelled for user ${user.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  if (!customerId) {
    console.warn('Invoice has no customer ID');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.warn(`User not found for customer: ${customerId}`);
    return;
  }

  // Record invoice payment
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentId: invoice.id,
      amount: invoice.total || 0,
      currency: invoice.currency || 'usd',
      paymentType: 'subscription',
      status: 'succeeded',
    },
  });

  console.log(`Invoice payment recorded for user ${user.id}: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  if (!customerId) {
    console.warn('Invoice has no customer ID');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.warn(`User not found for customer: ${customerId}`);
    return;
  }

  // Record failed payment
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentId: invoice.id,
      amount: invoice.total || 0,
      currency: invoice.currency || 'usd',
      paymentType: 'subscription',
      status: 'failed',
    },
  });

  // Send email notification about failed payment
  try {
    await EmailService.sendPaymentFailureNotification(user.email, invoice.total || 0, invoice.id);
  } catch (error) {
    console.error(`Failed to send payment failure email to ${user.email}:`, error);
  }

  console.log(`Invoice payment failed for user ${user.id}: ${invoice.id}`);
}
