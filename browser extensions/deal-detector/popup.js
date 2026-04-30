// popup.js — Deal Detector UI controller

const SUPPORTED_HOSTS = [
  'amazon.com', 'walmart.com', 'target.com',
  'bestbuy.com', 'ebay.com', 'homedepot.com', 'costco.com'
];

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';
  const hostname = new URL(url).hostname.replace('www.', '');

  const isSupported = SUPPORTED_HOSTS.some(h => hostname.includes(h));

  if (!isSupported) {
    showState('unsupported');
    return;
  }

  showState('loading');

  try {
    // 1. Get product data from content script
    const productData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PRODUCT_DATA' });

    if (!productData || (!productData.currentPrice && !productData.originalPrice)) {
      showError('Could not find price data on this page. Try a product detail page.');
      return;
    }

    // 2. Fetch price history via background script
    let priceHistory = null;
    try {
      priceHistory = await chrome.runtime.sendMessage({
        type: 'FETCH_PRICE_HISTORY',
        payload: {
          asin: productData.asin,
          url: productData.url,
          retailer: productData.retailer,
          title: productData.title
        }
      });
    } catch (e) {
      console.warn('History fetch failed:', e);
    }

    // 3. Analyze
    const analysis = window.analyzeDeal(productData, priceHistory);

    // 4. Render
    renderResult(analysis, productData, priceHistory);

  } catch (err) {
    console.error(err);
    if (err.message?.includes('Cannot access') || err.message?.includes('No tab')) {
      showError('Cannot access this tab. Try refreshing the page.');
    } else {
      showError('Analysis failed. Navigate to a product page and try again.');
    }
  }
}

function renderResult(analysis, productData, priceHistory) {
  showState('result');

  // ── Verdict banner ──────────────────────────────────────────────────
  const banner = document.getElementById('verdictBanner');
  const icon = document.getElementById('verdictIcon');
  const label = document.getElementById('verdictLabel');
  const sub = document.getElementById('verdictSub');

  const verdictConfig = {
    REAL_DEAL:    { cls: 'real',    emoji: '✅', text: 'REAL DEAL',     sub: 'Price is genuinely discounted' },
    FAKE_DEAL:    { cls: 'fake',    emoji: '🚨', text: 'FAKE DEAL',     sub: 'This is not a real discount' },
    PARTIAL_DEAL: { cls: 'partial', emoji: '⚠️', text: 'PARTIAL DEAL', sub: 'Mild discount, not a great deal' },
    UNKNOWN:      { cls: 'unknown', emoji: '❓', text: 'UNVERIFIED',    sub: 'Not enough data to confirm' },
  };

  const vc = verdictConfig[analysis.verdict] || verdictConfig.UNKNOWN;
  banner.className = `verdict-banner ${vc.cls}`;
  icon.textContent = vc.emoji;
  label.className = `verdict-label ${vc.cls}`;
  label.textContent = vc.text;
  sub.textContent = vc.sub;

  // ── Score bar ───────────────────────────────────────────────────────
  const scoreFill = document.getElementById('scoreFill');
  const scoreNum = document.getElementById('scoreNum');
  const score = analysis.score;
  scoreNum.textContent = `${score}/100`;
  scoreNum.style.color = scoreColor(score);
  setTimeout(() => {
    scoreFill.style.width = `${score}%`;
    scoreFill.style.background = scoreColor(score);
  }, 80);

  // ── Price cells ─────────────────────────────────────────────────────
  const fmt = (v) => v != null ? `$${v.toFixed(2)}` : '—';

  document.getElementById('currentPrice').textContent = fmt(analysis.currentPrice);
  document.getElementById('claimedPrice').textContent = fmt(analysis.claimedOriginal);
  document.getElementById('histPrice').textContent = fmt(analysis.actualHistoricalHigh);

  // Sub-labels
  if (analysis.avgHistoricalPrice && analysis.actualHistoricalLow) {
    document.getElementById('histSub').textContent = `avg $${analysis.avgHistoricalPrice.toFixed(2)}`;
  }

  if (analysis.claimedDiscount) {
    document.getElementById('claimedSub').textContent = `claimed ${analysis.claimedDiscount}% off`;
  }

  if (analysis.realDiscount != null) {
    const el = document.getElementById('currentSub');
    const color = analysis.realDiscount > 20 ? 'var(--deal)' : analysis.realDiscount > 0 ? 'var(--warn)' : 'var(--fake)';
    el.style.color = color;
    el.style.fontFamily = "'Space Mono', monospace";
    el.style.fontSize = '8px';
    el.textContent = `${analysis.realDiscount > 0 ? '-' : '+'}${Math.abs(analysis.realDiscount)}% vs hist. high`;
  }

  // ── Badges ──────────────────────────────────────────────────────────
  const badgesRow = document.getElementById('badgesRow');
  badgesRow.innerHTML = '';

  if (analysis.claimedDiscount) {
    const b = document.createElement('span');
    b.className = 'badge claimed';
    b.textContent = `CLAIMED: -${analysis.claimedDiscount}%`;
    badgesRow.appendChild(b);
  }

  if (analysis.realDiscount != null) {
    const b = document.createElement('span');
    b.className = `badge ${analysis.realDiscount > 15 ? 'real-discount' : 'fake-discount'}`;
    b.textContent = `ACTUAL: ${analysis.realDiscount > 0 ? '-' : '+'}${Math.abs(analysis.realDiscount)}% VS HISTORY`;
    badgesRow.appendChild(b);
  }

  if (analysis.confidence) {
    const b = document.createElement('span');
    b.className = 'badge confidence';
    b.textContent = `${analysis.confidence.toUpperCase()} CONFIDENCE`;
    badgesRow.appendChild(b);
  }

  // ── Flags ───────────────────────────────────────────────────────────
  const flagsSection = document.getElementById('flagsSection');
  flagsSection.innerHTML = '';

  if (analysis.flags.length === 0) {
    flagsSection.classList.add('hidden');
  } else {
    flagsSection.classList.remove('hidden');
    analysis.flags.forEach(f => {
      const el = document.createElement('div');
      el.className = 'flag';
      el.textContent = f;
      flagsSection.appendChild(el);
    });
  }

  // ── Product title ───────────────────────────────────────────────────
  if (productData.title) {
    document.getElementById('productTitleText').textContent = productData.title;
    document.getElementById('productTitleSection').classList.remove('hidden');
  } else {
    document.getElementById('productTitleSection').classList.add('hidden');
  }

  // ── Mini sparkline chart ─────────────────────────────────────────────
  if (analysis.priceHistory && analysis.priceHistory.length > 2) {
    document.getElementById('historySection').classList.remove('hidden');
    document.getElementById('historySource').textContent = priceHistory?.source?.toUpperCase() || '';
    drawChart(analysis);
  }
}

function drawChart(analysis) {
  const canvas = document.getElementById('priceChart');
  const ctx = canvas.getContext('2d');
  const history = analysis.priceHistory;
  const prices = history.map(p => p.price);
  const dates = history.map(p => p.date);

  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = 60 * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const W = canvas.offsetWidth;
  const H = 60;
  const pad = { t: 4, r: 4, b: 4, l: 4 };
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const toX = (i) => pad.l + (i / (prices.length - 1)) * (W - pad.l - pad.r);
  const toY = (p) => pad.t + (1 - (p - minP) / range) * (H - pad.t - pad.b);

  // Fill gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(77,148,255,0.25)');
  grad.addColorStop(1, 'rgba(77,148,255,0)');

  ctx.beginPath();
  ctx.moveTo(toX(0), toY(prices[0]));
  prices.forEach((p, i) => { if (i > 0) ctx.lineTo(toX(i), toY(p)); });
  ctx.lineTo(toX(prices.length - 1), H);
  ctx.lineTo(toX(0), H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#4d94ff';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.moveTo(toX(0), toY(prices[0]));
  prices.forEach((p, i) => { if (i > 0) ctx.lineTo(toX(i), toY(p)); });
  ctx.stroke();

  // Current price dot
  if (analysis.currentPrice) {
    const cx = toX(prices.length - 1);
    const cy = toY(analysis.currentPrice);
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();
  }

  // Historical high line
  if (analysis.actualHistoricalHigh) {
    const hy = toY(analysis.actualHistoricalHigh);
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255,59,92,0.4)';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.l, hy);
    ctx.lineTo(W - pad.r, hy);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function scoreColor(score) {
  if (score >= 70) return 'var(--deal)';
  if (score >= 45) return 'var(--warn)';
  return 'var(--fake)';
}

function showState(state) {
  document.getElementById('loadingState').classList.toggle('hidden', state !== 'loading');
  document.getElementById('unsupportedState').classList.toggle('hidden', state !== 'unsupported');
  document.getElementById('resultState').classList.toggle('hidden', state !== 'result');
}

function showError(msg) {
  showState('unsupported');
  document.querySelector('#unsupportedState .big-icon').textContent = '⚠️';
  document.querySelector('#unsupportedState h2').textContent = 'Analysis Failed';
  document.querySelector('#unsupportedState p').textContent = msg;
  document.querySelector('.supported-sites').style.display = 'none';
}

document.getElementById('rescanBtn').addEventListener('click', () => {
  showState('loading');
  setTimeout(init, 200);
});

document.addEventListener('DOMContentLoaded', init);
