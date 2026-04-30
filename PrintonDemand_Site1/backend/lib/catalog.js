/**
 * lib/catalog.js
 * Maps RebelThreads shirt IDs → Printify product + variant lookup.
 * Also exposes display data for the storefront.
 *
 * HOW TO POPULATE:
 *   1. Create products in Printify dashboard
 *   2. GET /api/printify/products to list your shop products
 *   3. GET /api/printify/products/:id to see variant IDs per size
 *   4. Fill in printifyProductId + variants below
 */

export const CATALOG = {
  1: {
    slogan: 'QUESTION EVERYTHING',
    tagline: 'Skepticism is the beginning of wisdom.',
    description: 'For the thinkers, the doubters, and the ones who refuse to take anything at face value. 100% cotton Gildan Softstyle.',
    price: 34, accent: '#FF4500',
    printifyProductId: 'FILL_ME',
    variants: { S: null, M: null, L: null, XL: null, '2XL': null },
  },
  2: {
    slogan: 'NO FUTURE',
    tagline: 'Embrace the void.',
    description: 'A punk classic. The declaration that started a revolution. Worn by those who see through the noise.',
    price: 34, accent: '#FFD700',
    printifyProductId: 'FILL_ME',
    variants: { S: null, M: null, L: null, XL: null, '2XL': null },
  },
  3: {
    slogan: 'BORN TO RAISE HELL',
    tagline: 'Some were born to follow. Not you.',
    description: 'High-energy. Zero apologies. This shirt makes a statement before you even open your mouth.',
    price: 34, accent: '#FF0066',
    printifyProductId: 'FILL_ME',
    variants: { S: null, M: null, L: null, XL: null, '2XL': null },
  },
  4: {
    slogan: 'ANARCHY IN THE USA',
    tagline: "Freedom isn't free, it's taken.",
    description: 'For those who believe in radical freedom over comfortable chains.',
    price: 34, accent: '#00FFFF',
    printifyProductId: 'FILL_ME',
    variants: { S: null, M: null, L: null, XL: null, '2XL': null },
  },
  5: {
    slogan: 'DISCO SUCKS',
    tagline: 'The original culture war.',
    description: "A relic from the frontlines of rock's battle against glitter and groove.",
    price: 34, accent: '#FF4500',
    printifyProductId: 'FILL_ME',
    variants: { S: null, M: null, L: null, XL: null, '2XL': null },
  },
  6: {
    slogan: 'FIGHT THE POWER',
    tagline: 'The revolution will be worn.',
    description: 'Chuck D said it. You live it. Show up. Speak up. Never shut up.',
    price: 34, accent: '#00FF41',
    printifyProductId: 'FILL_ME',
    variants: { S: null, M: null, L: null, XL: null, '2XL': null },
  },
  7: {
    slogan: 'TUNE IN DROP OUT',
    tagline: 'Opt out of the system.',
    description: 'The modern treadmill leads nowhere. Step off. Look around. Wake up.',
    price: 34, accent: '#FFD700',
    printifyProductId: 'FILL_ME',
    variants: { S: null, M: null, L: null, XL: null, '2XL': null },
  },
  8: {
    slogan: 'I AM NOT YOUR TARGET MARKET',
    tagline: 'Refuse to be a demographic.',
    description: 'You are not a consumer segment. You are not a data point. You are a human being.',
    price: 34, accent: '#FF0066',
    printifyProductId: 'FILL_ME',
    variants: { S: null, M: null, L: null, XL: null, '2XL': null },
  },
};

export function resolveVariant(shirtId, size) {
  const product = CATALOG[shirtId];
  if (!product) throw new Error(`Unknown shirt ID: ${shirtId}`);
  const variantId = product.variants[size];
  if (!variantId) throw new Error(`Variant not configured for shirt ${shirtId} / size ${size}.`);
  return { printifyProductId: product.printifyProductId, variantId };
}
