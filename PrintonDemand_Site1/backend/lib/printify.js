const BASE = 'https://api.printify.com/v1';

async function req(method, path, body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'RebelThreads/1.0',
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

export const listProducts = () => req('GET', `${SHOP()}/products.json`);
export const getProduct = (id) => req('GET', `${SHOP()}/products/${id}.json`);
export const createProduct = (payload) => req('POST', `${SHOP()}/products.json`, payload);
export const updateProduct = (id, payload) => req('PUT', `${SHOP()}/products/${id}.json`, payload);
export const publishProduct = (id) => req('POST', `${SHOP()}/products/${id}/publish.json`, { title: true, description: true, images: true, variants: true, tags: true });
export const listBlueprints = () => req('GET', '/catalog/blueprints.json');
export const getBlueprintVariants = (bpId, pvId) => req('GET', `/catalog/blueprints/${bpId}/print_providers/${pvId}/variants.json`);
export const getBlueprintProviders = (bpId) => req('GET', `/catalog/blueprints/${bpId}/print_providers.json`);
export const createOrder = (payload) => req('POST', `${SHOP()}/orders.json`, payload);
export const getOrder = (id) => req('GET', `${SHOP()}/orders/${id}.json`);
export const listOrders = (page = 1, limit = 20) => req('GET', `${SHOP()}/orders.json?page=${page}&limit=${limit}`);
export const cancelOrder = (id) => req('POST', `${SHOP()}/orders/${id}/cancel.json`);
export const sendOrderToProduction = (id) => req('POST', `${SHOP()}/orders/${id}/send_to_production.json`);
export const uploadImageByUrl = (fileName, url) => req('POST', '/uploads/images.json', { file_name: fileName, url });
export const uploadImageBase64 = (fileName, contents) => req('POST', '/uploads/images.json', { file_name: fileName, contents });
export const calculateShipping = (addressTo, lineItems) => req('POST', `${SHOP()}/orders/shipping.json`, { line_items: lineItems, address_to: addressTo });
export const buildLineItem = ({ printifyProductId, variantId, quantity }) => ({ product_id: printifyProductId, variant_id: variantId, quantity });
export const buildOrderPayload = ({ externalId, label, lineItems, shippingAddress, stripePaymentIntentId }) => ({
  external_id: externalId,
  label,
  line_items: lineItems,
  shipping_method: 1,
  is_printify_express: false,
  send_shipping_notification: true,
  address_to: shippingAddress,
  metadata: { stripe_payment_intent: stripePaymentIntentId },
});
