/**
 * lib/catalog.js
 *
 * Maps RebelThreads shirt IDs → Printify product IDs + size→variantId lookup.
 *
 * HOW TO POPULATE:
 *   1. Run `GET /api/printify/products` after creating products in Printify
 *   2. For each product, run `GET /api/printify/products/:id` to get variant list
 *   3. Fill in the variantIds below per size
 *
 * Blueprint reference (Gildan 64000 Unisex Softstyle):
 *   Blueprint ID: 2  |  Popular Print Provider ID: 99 (Monster Digital)
 */

export const CATALOG = {
  1: {
    slogan: "QUESTION EVERYTHING",
    printifyProductId: "FILL_ME",   // set after creating in Printify dashboard
    variants: {
      S:   null,  // e.g. 17887
      M:   null,
      L:   null,
      XL:  null,
      "2XL": null,
    },
  },
  2: {
    slogan: "NO FUTURE",
    printifyProductId: "FILL_ME",
    variants: { S: null, M: null, L: null, XL: null, "2XL": null },
  },
  3: {
    slogan: "BORN TO RAISE HELL",
    printifyProductId: "FILL_ME",
    variants: { S: null, M: null, L: null, XL: null, "2XL": null },
  },
  4: {
    slogan: "ANARCHY IN THE USA",
    printifyProductId: "FILL_ME",
    variants: { S: null, M: null, L: null, XL: null, "2XL": null },
  },
  5: {
    slogan: "DISCO SUCKS",
    printifyProductId: "FILL_ME",
    variants: { S: null, M: null, L: null, XL: null, "2XL": null },
  },
  6: {
    slogan: "FIGHT THE POWER",
    printifyProductId: "FILL_ME",
    variants: { S: null, M: null, L: null, XL: null, "2XL": null },
  },
  7: {
    slogan: "TUNE IN DROP OUT",
    printifyProductId: "FILL_ME",
    variants: { S: null, M: null, L: null, XL: null, "2XL": null },
  },
  8: {
    slogan: "I AM NOT YOUR TARGET MARKET",
    printifyProductId: "FILL_ME",
    variants: { S: null, M: null, L: null, XL: null, "2XL": null },
  },
};

/**
 * Resolves a cart item to { printifyProductId, variantId }
 * Throws if the shirt or size isn't configured yet.
 */
export function resolveVariant(shirtId, size) {
  const product = CATALOG[shirtId];
  if (!product) throw new Error(`Unknown shirt ID: ${shirtId}`);

  const variantId = product.variants[size];
  if (!variantId)
    throw new Error(
      `Variant not configured for shirt ${shirtId} / size ${size}. ` +
        `Run GET /api/printify/products/${product.printifyProductId} to find variant IDs.`
    );

  return { printifyProductId: product.printifyProductId, variantId };
}
