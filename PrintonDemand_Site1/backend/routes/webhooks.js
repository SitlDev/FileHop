import { Router } from 'express';
import Stripe from 'stripe';

export const webhookRouter = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRINTIFY_TOPICS = [
  'order:fulfilled',
  'order:shipment:created',
  'order:shipment:delivered',
  'product:deleted',
];

// POST /webhooks/stripe
webhookRouter.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('  PaymentIntent succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('  PaymentIntent failed:', event.data.object.id);
      break;
    case 'charge.dispute.created':
      console.log('  Dispute created:', event.data.object.id);
      break;
    default:
      console.log(`  Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
});

// POST /webhooks/printify
webhookRouter.post('/printify', async (req, res) => {
  const body = JSON.parse(req.body.toString());
  console.log(`[Printify Webhook] ${body.topic}`, body.resource?.id || '');

  switch (body.topic) {
    case 'order:fulfilled':
      console.log('  Order fulfilled:', body.resource?.id);
      break;
    case 'order:shipment:created':
      console.log('  Shipment created:', JSON.stringify(body.resource?.data?.shipments?.[0]));
      break;
    case 'order:shipment:delivered':
      console.log('  Shipment delivered:', body.resource?.id);
      break;
    case 'product:deleted':
      console.log('  Product deleted:', body.resource?.id);
      break;
  }

  res.json({ received: true });
});

// POST /webhooks/register-printify — registers all webhook topics with Printify
webhookRouter.post('/register-printify', async (req, res, next) => {
  try {
    const publicUrl = process.env.PUBLIC_URL;
    if (!publicUrl) return res.status(400).json({ error: 'Set PUBLIC_URL in .env first' });

    const results = await Promise.all(
      PRINTIFY_TOPICS.map((topic) =>
        fetch(`https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/webhooks.json`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic, url: `${publicUrl}/webhooks/printify` }),
        }).then((r) => r.json())
      )
    );

    res.json(results);
  } catch (e) { next(e); }
});
