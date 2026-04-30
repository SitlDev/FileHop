/**
 * lib/printify.js
 * Low-level Printify REST client
 * Docs: https://developers.printify.com/
 */

const BASE = "https://api.printify.com/v1";

async function req(method, path, body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "RebelThreads/1.0",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data?.message || `Printify ${res.status}`);
    err.status = res.status;
    err.printifyError = data;
    throw err;
  }
  return data;
}

const SHOP = () => `/shops/${process.env.PRINTIFY_SHOP_ID}`;

// ─── Products ────────────────────────────────────────────────────────────────

/** List all products in the shop */
export const listProducts = () => req("GET", `${SHOP()}/products.json`);

/** Get a single product with all variants */
export const getProduct = (productId) =>
  req("GET", `${SHOP()}/products/${productId}.json`);

/** Create a new product */
export const createProduct = (payload) =>
  req("POST", `${SHOP()}/products.json`, payload);

/** Update a product */
export const updateProduct = (productId, payload) =>
  req("PUT", `${SHOP()}/products/${productId}.json`, payload);

/** Publish a product to the storefront */
export const publishProduct = (productId) =>
  req("POST", `${SHOP()}/products/${productId}/publish.json`, {
    title: true,
    description: true,
    images: true,
    variants: true,
    tags: true,
  });

// ─── Blueprints (catalog) ─────────────────────────────────────────────────────

/** All available blueprints (shirt types) */
export const listBlueprints = () => req("GET", "/catalog/blueprints.json");

/** Variants for a blueprint + print provider combo */
export const getBlueprintVariants = (blueprintId, providerId) =>
  req(
    "GET",
    `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`
  );

/** Print providers for a blueprint */
export const getBlueprintProviders = (blueprintId) =>
  req("GET", `/catalog/blueprints/${blueprintId}/print_providers.json`);

// ─── Orders ───────────────────────────────────────────────────────────────────

/** Submit an order to Printify for fulfillment */
export const createOrder = (payload) =>
  req("POST", `${SHOP()}/orders.json`, payload);

/** Get a single order */
export const getOrder = (orderId) =>
  req("GET", `${SHOP()}/orders/${orderId}.json`);

/** List orders (paginated) */
export const listOrders = (page = 1, limit = 20) =>
  req("GET", `${SHOP()}/orders.json?page=${page}&limit=${limit}`);

/** Cancel an order (only if not yet in production) */
export const cancelOrder = (orderId) =>
  req("POST", `${SHOP()}/orders/${orderId}/cancel.json`);

/** Send an existing order to production manually */
export const sendOrderToProduction = (orderId) =>
  req("POST", `${SHOP()}/orders/${orderId}/send_to_production.json`);

// ─── Uploads ──────────────────────────────────────────────────────────────────

/** Upload an image by URL for use in product designs */
export const uploadImageByUrl = (fileName, url) =>
  req("POST", "/uploads/images.json", { file_name: fileName, url });

/** Upload an image as base64 */
export const uploadImageBase64 = (fileName, contents) =>
  req("POST", "/uploads/images.json", { file_name: fileName, contents });

// ─── Shipping ────────────────────────────────────────────────────────────────

/** Calculate shipping for a list of line items */
export const calculateShipping = (addressTo, lineItems) =>
  req("POST", `${SHOP()}/orders/shipping.json`, {
    line_items: lineItems,
    address_to: addressTo,
  });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a Printify line item from our internal cart item.
 * Requires pre-mapped variantId per (productId, size).
 */
export const buildLineItem = ({ printifyProductId, variantId, quantity }) => ({
  product_id: printifyProductId,
  variant_id: variantId,
  quantity,
});

/**
 * Build a full Printify order payload from a completed Stripe PaymentIntent.
 */
export const buildOrderPayload = ({
  externalId,       // your internal order ID
  label,            // human-readable label e.g. "Order #1042"
  lineItems,        // array of buildLineItem() results
  shippingAddress,  // { first_name, last_name, email, phone, country, region, address1, city, zip }
  stripePaymentIntentId,
}) => ({
  external_id: externalId,
  label,
  line_items: lineItems,
  shipping_method: 1,         // 1 = Standard, 2 = Express
  is_printify_express: false,
  send_shipping_notification: true,
  address_to: shippingAddress,
  metadata: { stripe_payment_intent: stripePaymentIntentId },
});
