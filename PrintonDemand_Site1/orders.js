/**
 * routes/orders.js
 *
 * Full checkout flow:
 *   1. POST /api/orders/intent   — create Stripe PaymentIntent, return client_secret
 *   2. (frontend confirms payment with Stripe.js)
 *   3. POST /api/orders/confirm  — verify payment, submit order to Printify
 *   4. GET  /api/orders/:id      — order status lookup
 */

import { Router } from "express";
import Stripe from "stripe";
import { nanoid } from "nanoid";
import * as P from "../lib/printify.js";
import { resolveVariant } from "../lib/catalog.js";

export const ordersRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// In production replace with a real DB (Postgres, Mongo, etc.)
const ordersDb = new Map();

// ─── POST /api/orders/intent ──────────────────────────────────────────────────
/**
 * Body: {
 *   cart: [{ shirtId, size, qty, price }],
 *   email: string
 * }
 * Returns: { clientSecret, orderId, amount }
 */
ordersRouter.post("/intent", async (req, res, next) => {
  try {
    const { cart, email } = req.body;
    if (!cart?.length) return res.status(400).json({ error: "Empty cart" });

    const amount = cart.reduce((sum, i) => sum + i.price * i.qty * 100, 0); // cents

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      receipt_email: email,
      metadata: { cart: JSON.stringify(cart) },
      automatic_payment_methods: { enabled: true },
    });

    // Persist pending order
    const orderId = `RT-${nanoid(8).toUpperCase()}`;
    ordersDb.set(orderId, {
      orderId,
      status: "pending_payment",
      stripePaymentIntentId: intent.id,
      cart,
      email,
      createdAt: new Date().toISOString(),
    });

    res.json({
      clientSecret: intent.client_secret,
      orderId,
      amount,
    });
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/orders/confirm ─────────────────────────────────────────────────
/**
 * Called after Stripe payment succeeds on the frontend.
 * Body: {
 *   orderId: string,
 *   paymentIntentId: string,
 *   shippingAddress: {
 *     first_name, last_name, email, phone,
 *     address1, city, region, zip, country  (ISO 2-letter)
 *   }
 * }
 */
ordersRouter.post("/confirm", async (req, res, next) => {
  try {
    const { orderId, paymentIntentId, shippingAddress } = req.body;

    // 1. Verify payment with Stripe
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded") {
      return res.status(402).json({ error: `Payment not succeeded: ${intent.status}` });
    }

    // 2. Load pending order
    const order = ordersDb.get(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "pending_payment") {
      return res.status(409).json({ error: "Order already processed" });
    }

    // 3. Resolve cart → Printify line items
    const lineItems = order.cart.map(({ shirtId, size, qty }) => {
      const { printifyProductId, variantId } = resolveVariant(shirtId, size);
      return P.buildLineItem({ printifyProductId, variantId, quantity: qty });
    });

    // 4. Submit to Printify
    const printifyPayload = P.buildOrderPayload({
      externalId: orderId,
      label: `RebelThreads ${orderId}`,
      lineItems,
      shippingAddress,
      stripePaymentIntentId: paymentIntentId,
    });

    const printifyOrder = await P.createOrder(printifyPayload);

    // 5. Update local record
    const updated = {
      ...order,
      status: "submitted_to_printify",
      printifyOrderId: printifyOrder.id,
      shippingAddress,
      updatedAt: new Date().toISOString(),
    };
    ordersDb.set(orderId, updated);

    res.json({
      orderId,
      printifyOrderId: printifyOrder.id,
      status: "submitted_to_printify",
      message: "Order submitted for fulfillment. Expect 3–7 business days.",
    });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
ordersRouter.get("/:id", async (req, res, next) => {
  try {
    const order = ordersDb.get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Optionally fetch live status from Printify
    let printifyStatus = null;
    if (order.printifyOrderId) {
      try {
        const po = await P.getOrder(order.printifyOrderId);
        printifyStatus = po.status;
      } catch (_) {}
    }

    res.json({ ...order, printifyStatus });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/orders — list all (admin) ──────────────────────────────────────
ordersRouter.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");
    const all = [...ordersDb.values()].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json({
      total: all.length,
      page,
      data: all.slice((page - 1) * limit, page * limit),
    });
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/orders/:id/cancel ─────────────────────────────────────────────
ordersRouter.post("/:id/cancel", async (req, res, next) => {
  try {
    const order = ordersDb.get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.printifyOrderId) {
      await P.cancelOrder(order.printifyOrderId);
    }

    ordersDb.set(req.params.id, { ...order, status: "cancelled" });
    res.json({ cancelled: true });
  } catch (e) {
    next(e);
  }
});
