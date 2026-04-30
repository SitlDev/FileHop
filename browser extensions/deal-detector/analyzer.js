// analyzer.js — Core deal analysis engine

function analyzeDeal(productData, priceHistory) {
  const result = {
    verdict: null,           // 'REAL_DEAL' | 'FAKE_DEAL' | 'PARTIAL_DEAL' | 'UNKNOWN'
    score: 0,                // 0-100 deal quality score
    currentPrice: productData.currentPrice,
    claimedOriginal: productData.originalPrice,
    actualHistoricalHigh: null,
    actualHistoricalLow: null,
    avgHistoricalPrice: null,
    realDiscount: null,       // actual % off vs historical
    claimedDiscount: productData.discountPercent,
    flags: [],
    confidence: 'low',
    priceHistory: [],
  };

  // ── Compute from page data ──────────────────────────────────────────
  if (productData.currentPrice && productData.originalPrice) {
    const claimedSavings = productData.originalPrice - productData.currentPrice;
    const claimedPct = (claimedSavings / productData.originalPrice) * 100;
    result.claimedDiscount = Math.round(claimedPct);
  }

  // ── Incorporate historical data ─────────────────────────────────────
  if (priceHistory && priceHistory.prices && priceHistory.prices.length > 0) {
    const prices = priceHistory.prices.map(p => p.price).filter(p => p > 0);
    result.actualHistoricalHigh = Math.max(...prices);
    result.actualHistoricalLow = Math.min(...prices);
    result.avgHistoricalPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    result.priceHistory = priceHistory.prices;
    result.confidence = prices.length >= 30 ? 'high' : prices.length >= 10 ? 'medium' : 'low';
  } else if (priceHistory && priceHistory.highestPrice) {
    // CamelCamelCamel summary data
    result.actualHistoricalHigh = priceHistory.highestPrice;
    result.actualHistoricalLow = priceHistory.lowestPrice;
    result.avgHistoricalPrice = priceHistory.avgPrice;
    result.confidence = 'medium';
  }

  // ── Verdict logic ───────────────────────────────────────────────────
  const current = result.currentPrice;
  const claimed = result.claimedOriginal;
  const histHigh = result.actualHistoricalHigh;
  const histAvg = result.avgHistoricalPrice;
  const histLow = result.actualHistoricalLow;

  if (current && histHigh) {
    result.realDiscount = Math.round(((histHigh - current) / histHigh) * 100);

    const pricedBelowAvg = histAvg && current < histAvg;
    const pricedAtHistLow = histLow && current <= histLow * 1.05;
    const claimedOrigFakeVsHistory = claimed && claimed < histHigh * 0.85;
    const isActuallyLow = current <= histHigh * 0.80;
    const nearHistoricalLow = histLow && current <= histLow * 1.10;

    if (claimedOrigFakeVsHistory) {
      result.flags.push(`⚠️ Claimed "original" price ($${claimed}) is much lower than historical high ($${histHigh?.toFixed(2)})`);
    }

    if (pricedAtHistLow || nearHistoricalLow) {
      result.flags.push(`✅ Near the lowest price ever recorded`);
    }

    if (!pricedBelowAvg && !isActuallyLow) {
      result.flags.push(`🚩 Current price is at or above the historical average`);
    }

    if (result.realDiscount > 25 && isActuallyLow) {
      result.verdict = 'REAL_DEAL';
      result.score = Math.min(99, 60 + result.realDiscount);
    } else if (isActuallyLow && !claimedOrigFakeVsHistory) {
      result.verdict = 'REAL_DEAL';
      result.score = 55 + (pricedBelowAvg ? 15 : 0);
    } else if (claimedOrigFakeVsHistory && !isActuallyLow) {
      result.verdict = 'FAKE_DEAL';
      result.score = 15;
      result.flags.push(`🚩 Price has been at this level before — not a genuine sale`);
    } else if (pricedBelowAvg) {
      result.verdict = 'PARTIAL_DEAL';
      result.score = 40;
      result.flags.push(`ℹ️ Below average but not at a historical low`);
    } else {
      result.verdict = 'FAKE_DEAL';
      result.score = 20;
    }
  } else if (current && claimed) {
    // No history — analyze based on page data only
    const discount = ((claimed - current) / claimed) * 100;

    if (discount > 70) {
      result.verdict = 'UNKNOWN';
      result.flags.push(`⚠️ Claimed ${Math.round(discount)}% discount is unusually high — often fabricated`);
      result.score = 30;
    } else if (discount > 30) {
      result.verdict = 'UNKNOWN';
      result.flags.push(`ℹ️ Discount looks plausible but no history to verify`);
      result.score = 45;
    } else {
      result.verdict = 'UNKNOWN';
      result.score = 40;
    }
    result.confidence = 'low';
    result.flags.push('📊 No price history found — install CamelCamelCamel for Amazon tracking');
  } else {
    result.verdict = 'UNKNOWN';
    result.flags.push('❌ Could not extract price data from this page');
  }

  return result;
}

// Export for popup.js
if (typeof module !== 'undefined') {
  module.exports = { analyzeDeal };
} else {
  window.analyzeDeal = analyzeDeal;
}
