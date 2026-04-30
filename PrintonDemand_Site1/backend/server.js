import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { printifyRouter } from './routes/printify.js';
import { ordersRouter } from './routes/orders.js';
import { webhookRouter } from './routes/webhooks.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body — mount BEFORE json parser
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

app.use(express.json());
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'https://rebelthreads.knotstranded.com',
  'http://localhost:5173',
  'http://localhost:4173',
];
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(logger);

app.use('/api/printify', printifyRouter);
app.use('/api/orders', ordersRouter);

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'RebelThreads API', ts: Date.now() }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log('\n\x1b[31m  REBELTHREADS API\x1b[0m');
  console.log(`  Port:   \x1b[32m${PORT}\x1b[0m`);
  console.log(`  Shop:   \x1b[32m${process.env.PRINTIFY_SHOP_ID || '⚠ not set'}\x1b[0m`);
  console.log(`  Stripe: \x1b[32m${process.env.STRIPE_SECRET_KEY ? '✓' : '⚠ not set'}\x1b[0m\n`);
});
