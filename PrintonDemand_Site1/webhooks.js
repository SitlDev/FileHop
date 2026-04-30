/**
 * routes/webhooks.js
 *
 * Handles:
 *   - Stripe webhooks (payment_intent.succeeded fallback)
 *   - Printify webhooks (order fulfilled, shipment tracking)
 *
 * Register Printify webhooks once via:
 *   POST https://api.printify.com/v1/shops/{shop_id}/webhooks.json
 *   { "topic": "order:fulfilled", "url": "https://yoursite.com/webhooks/printify" }
 *   { "topic": "order:shipment:created", "url": "https://yoursite.com/webhooks/printify" }
 */

import { Router } from "express";
import Stripe from "stripe";

export const webhookRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Stripe ───────────────────────────────────────────────────────────────────
webhookRouter.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      console.log(`✅ Stripe payment succeeded: ${intent.id}`);
      // If you want webhook-driven fulfillment instead of client-confirm flow,
      // parse intent.metadata.cart here and submit to Printify.
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      console.warn(`❌ Stripe payment failed: ${intent.id}`);
      // TODO: update order status, notify customer
      break;
    }
    case "charge.dispute.created": {
      const dispute = event.data.object;
      console.warn(`⚠️  Dispute created: ${dispute.id} — $${dispute.amount / 100}`);
      break;
    }
    default:
      console.log(`Stripe event unhandled: ${event.type}`);
  }

  res.json({ received: true });
});

// ─── Printify ─────────────────────────────────────────────────────────────────
webhookRouter.post("/printify", async (req, res) => {
  // Printify signs requests with X-Pfy-Delivery header (UUID)
  // For HMAC verification, check X-Pfy-Signature if you set a secret
  const topic = req.headers["x-pfy-event"];
  const body = JSON.parse(req.body.toString());

  console.log(`Printify webhook: ${topic}`, JSON.stringify(body, null, 2));

  switch (topic) {
    case "order:fulfilled": {
      const { order_id, shipment } = body;
      console.log(`📦 Order fulfilled: ${order_id}`);
      console.log(`   Carrier: ${shipment?.carrier}`);
      console.log(`   Tracking: ${shipment?.number}`);
      console.log(`   URL: ${shipment?.url}`);
      // TODO: look up externalId, email customer with tracking link
      break;
    }

    case "order:shipment:created": {
      const { resource } = body;
      console.log(`🚚 Shipment created for order: ${resource?.id}`);
      // TODO: push tracking to customer
      break;
    }

    case "order:shipment:delivered": {
      console.log(`✅ Delivered: ${body?.resource?.id}`);
      break;
    }

    case "product:deleted": {
      console.warn(`⚠️  Product deleted in Printify: ${body?.resource?.id}`);
      break;
    }

    default:
      console.log(`Printify event unhandled: ${topic}`);
  }

  res.json({ received: true });
});

// ─── Register Printify webhooks (one-time setup helper) ───────────────────────
webhookRouter.post("/register-printify", async (req, res) => {
  const BASE_URL = process.env.PUBLIC_URL; // e.g. https://api.rebelthreads.com
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const apiKey = process.env.PRINTIFY_API_KEY;

  const topics = [
    "order:fulfilled",
    "order:shipment:created",
    "order:shipment:delivered",
    "product:deleted",
  ];

  const results = await Promise.allSettled(
    topics.map((topic) =>
      fetch(`https://api.printify.com/v1/shops/${shopId}/webhooks.json`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          url: `${BASE_URL}/webhooks/printify`,
        }),
      }).then((r) => r.json())
    )
  );

  res.json(results.map((r) => (r.status === "fulfilled" ? r.value : r.reason)));
});
