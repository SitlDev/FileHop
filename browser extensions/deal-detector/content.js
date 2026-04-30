// content.js — Deal Detector
// Extracts product info and price data from supported retailer pages

(function () {
  'use strict';

  const hostname = window.location.hostname;

  function extractProductData() {
    const data = {
      title: null,
      currentPrice: null,
      originalPrice: null,
      discountPercent: null,
      currency: 'USD',
      asin: null,
      url: window.location.href,
      retailer: hostname.replace('www.', '').split('.')[0],
    };

    // ── Amazon ──────────────────────────────────────────────────────────────
    if (hostname.includes('amazon.com')) {
      data.title = document.querySelector('#productTitle')?.textContent?.trim();

      // Current / sale price
      const salePrice =
        document.querySelector('.priceToPay .a-offscreen')?.textContent?.trim() ||
        document.querySelector('#priceblock_saleprice')?.textContent?.trim() ||
        document.querySelector('#priceblock_dealprice')?.textContent?.trim() ||
        document.querySelector('.a-price .a-offscreen')?.textContent?.trim();

      // Original / strike-through price
      const origPrice =
        document.querySelector('.basisPrice .a-offscreen')?.textContent?.trim() ||
        document.querySelector('#priceblock_ourprice')?.textContent?.trim() ||
        document.querySelector('.a-price.a-text-price .a-offscreen')?.textContent?.trim();

      data.currentPrice = parsePrice(salePrice);
      data.originalPrice = parsePrice(origPrice);

      // Discount badge (e.g. "Save 30%")
      const savingBadge = document.querySelector('.savingsPercentage')?.textContent?.trim();
      if (savingBadge) {
        data.discountPercent = parseInt(savingBadge.replace(/[^0-9]/g, ''));
      }

      // ASIN from URL or page
      const asinMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
      if (asinMatch) data.asin = asinMatch[1];
    }

    // ── Walmart ─────────────────────────────────────────────────────────────
    else if (hostname.includes('walmart.com')) {
      data.title = document.querySelector('[itemprop="name"]')?.textContent?.trim() ||
        document.querySelector('h1.lh-copy')?.textContent?.trim();

      const priceNow = document.querySelector('[itemprop="price"]')?.getAttribute('content') ||
        document.querySelector('.price-characteristic')?.textContent?.trim();
      const priceWas = document.querySelector('.was-price')?.textContent?.trim() ||
        document.querySelector('[class*="strike"]')?.textContent?.trim();

      data.currentPrice = parsePrice(priceNow);
      data.originalPrice = parsePrice(priceWas);
    }

    // ── Target ──────────────────────────────────────────────────────────────
    else if (hostname.includes('target.com')) {
      data.title = document.querySelector('[data-test="product-title"]')?.textContent?.trim() ||
        document.querySelector('h1')?.textContent?.trim();

      const currentEl = document.querySelector('[data-test="product-price"]') ||
        document.querySelector('[class*="CurrentPrice"]');
      const wasEl = document.querySelector('[data-test="product-regular-price"]') ||
        document.querySelector('[class*="RegularPrice"]');

      data.currentPrice = parsePrice(currentEl?.textContent?.trim());
      data.originalPrice = parsePrice(wasEl?.textContent?.trim());
    }

    // ── Best Buy ─────────────────────────────────────────────────────────────
    else if (hostname.includes('bestbuy.com')) {
      data.title = document.querySelector('.sku-title h1')?.textContent?.trim();

      const saleEl = document.querySelector('.priceView-customer-price span[aria-hidden]') ||
        document.querySelector('.priceView-hero-price span');
      const origEl = document.querySelector('.pricing-price__regular-price') ||
        document.querySelector('[class*="regular-price"]');

      data.currentPrice = parsePrice(saleEl?.textContent?.trim());
      data.originalPrice = parsePrice(origEl?.textContent?.trim());
    }

    // ── eBay ─────────────────────────────────────────────────────────────────
    else if (hostname.includes('ebay.com')) {
      data.title = document.querySelector('#itemTitle')?.textContent?.replace('Details about', '').trim() ||
        document.querySelector('.x-item-title__mainTitle')?.textContent?.trim();

      const priceEl = document.querySelector('#prcIsum') ||
        document.querySelector('.x-price-primary .ux-textspans');
      const origEl = document.querySelector('#orgPrc') ||
        document.querySelector('.ux-textspans--STRIKETHROUGH');

      data.currentPrice = parsePrice(priceEl?.textContent?.trim());
      data.originalPrice = parsePrice(origEl?.textContent?.trim());
    }

    // ── Home Depot ───────────────────────────────────────────────────────────
    else if (hostname.includes('homedepot.com')) {
      data.title = document.querySelector('.product-title__title')?.textContent?.trim() ||
        document.querySelector('h1[class*="title"]')?.textContent?.trim();

      const priceEl = document.querySelector('[class*="special-buy"]') ||
        document.querySelector('.price-format__main-price');
      const origEl = document.querySelector('.price-format__was-price') ||
        document.querySelector('[class*="was-price"]');

      data.currentPrice = parsePrice(priceEl?.textContent?.trim());
      data.originalPrice = parsePrice(origEl?.textContent?.trim());
    }

    return data;
  }

  function parsePrice(str) {
    if (!str) return null;
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  }

  // Respond to popup requests
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_PRODUCT_DATA') {
      sendResponse(extractProductData());
    }
    return true;
  });

})();
