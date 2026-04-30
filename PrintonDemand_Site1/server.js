/**
 * RebelThreads — Printify Integration Server
 * Node.js / Express
 *
 * Required env vars (.env):
 *   PRINTIFY_API_KEY=your_api_key
 *   PRINTIFY_SHOP_ID=your_shop_id
 *   STRIPE_SECRET_KEY=sk_live_...
 *   STRIPE_WEBHOOK_SECRET=whsec_...
 *   PORT=3001
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

import { printifyRouter } from "./routes/printify.js";
import { ordersRouter } from "./routes/orders.js";
import { webhookRouter } from "./routes/webhooks.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./middleware/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body — mount BEFORE json parser
app.use("/webhooks", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(logger);

// Routes
app.use("/api/printify", printifyRouter);
app.use("/api/orders", ordersRouter);

app.get("/health", (_, res) => res.json({ status: "ok", ts: Date.now() }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🔥 RebelThreads API running on port ${PORT}`);
  console.log(`   Shop ID: ${process.env.PRINTIFY_SHOP_ID}`);
});
