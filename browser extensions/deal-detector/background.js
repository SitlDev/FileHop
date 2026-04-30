// background.js — Deal Detector service worker

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_PRICE_HISTORY') {
    fetchPriceHistory(msg.payload).then(sendResponse).catch(err => {
      sendResponse({ error: err.message });
    });
    return true; // keep channel open for async
  }
});

async function fetchPriceHistory({ asin, url, retailer, title }) {
  // Primary: CamelCamelCamel RSS for Amazon products with ASIN
  if (asin) {
    try {
      const camelData = await fetchCamelData(asin);
      if (camelData) return camelData;
    } catch (e) {
      console.warn('CamelCamelCamel fetch failed:', e);
    }
  }

  // Fallback: Synthesize estimated history from page data + heuristics
  return generateEstimatedHistory({ url, retailer, title });
}

async function fetchCamelData(asin) {
  // CamelCamelCamel product page scraping via their public product URL
  const camelUrl = `https://camelcamelcamel.com/product/${asin}`;
  
  try {
    const resp = await fetch(camelUrl, {
      headers: { 'Accept': 'text/html' }
    });
    if (!resp.ok) throw new Error('CamelCamelCamel unavailable');
    const html = await resp.text();
    
    return parseCamelPage(html, asin);
  } catch (e) {
    throw e;
  }
}

function parseCamelPage(html, asin) {
  // Extract price history data from CamelCamelCamel page
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  const history = { source: 'CamelCamelCamel', asin, prices: [] };
  
  // Look for price data in script tags or table
  const scripts = doc.querySelectorAll('script');
  for (const script of scripts) {
    const text = script.textContent;
    if (text.includes('amazon_price') || text.includes('price_data') || text.includes('graph_data')) {
      // Extract JSON arrays with price/date data
      const matches = text.match(/\[\[(\d+),(\d+(?:\.\d+)?)\](?:,\[\d+,\d+(?:\.\d+)?\])*\]/g);
      if (matches) {
        for (const match of matches) {
          try {
            const pairs = JSON.parse(match);
            if (Array.isArray(pairs)) {
              history.prices = pairs.map(([ts, price]) => ({
                date: new Date(ts * 1000).toISOString().split('T')[0],
                price: price / 100
              }));
            }
          } catch {}
        }
      }
    }
  }

  // Fallback: Look for "lowest price" / "highest price" text
  const lowestEl = doc.querySelector('.price_low') || doc.querySelector('[class*="lowest"]');
  const highestEl = doc.querySelector('.price_high') || doc.querySelector('[class*="highest"]');
  const avgEl = doc.querySelector('.price_avg') || doc.querySelector('[class*="average"]');

  if (lowestEl || highestEl || avgEl) {
    history.lowestPrice = parseFloat(lowestEl?.textContent?.replace(/[^0-9.]/g, '')) || null;
    history.highestPrice = parseFloat(highestEl?.textContent?.replace(/[^0-9.]/g, '')) || null;
    history.avgPrice = parseFloat(avgEl?.textContent?.replace(/[^0-9.]/g, '')) || null;
  }

  return history.prices.length > 0 || history.lowestPrice ? history : null;
}

async function generateEstimatedHistory({ url, retailer, title }) {
  // Generate realistic estimated history for non-Amazon products
  // Uses a deterministic seed from the URL so results are consistent
  const seed = simpleHash(url);
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  // We'll return a marker indicating this is estimated
  return {
    source: 'estimated',
    retailer,
    prices: [],
    note: 'No price history API available for this retailer. Analysis based on page data only.'
  };
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
