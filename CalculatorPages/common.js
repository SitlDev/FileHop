/**
 * YourCalc Common Functionality
 * Shared logic for tabs, feedback, and site-wide interactions.
 */

// Tab switching logic
window.saveActivity = function() {}; // No-op for legacy calls
function showTab(id, event) {
    document.querySelectorAll('.calc-container').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.info-block').forEach(i => i.classList.remove('active'));

    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    const info = document.getElementById('info-' + id);
    if (info) info.classList.add('active');

    if(event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        const btn = document.querySelector(`[onclick*="'${id}'"]`);
        if(btn) btn.classList.add('active');
    }
    
    // Hide results when switching tabs — clear both class and inline styles
    document.querySelectorAll('.result-panel').forEach(p => {
        p.classList.remove('visible');
        p.style.display = '';
        p.style.opacity = '';
    });
}

// Global Theme Initialization (Inline prevention of flash)
(function() {
    const saved = localStorage.getItem('calcTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
})();

// Feedback submission placeholder
function submitFeedback() {
    const name = document.getElementById('feedbackName')?.value;
    const email = document.getElementById('feedbackEmail')?.value;
    const comment = document.getElementById('feedbackComment')?.value;
    
    if (!email || !comment) {
        alert('Please provide at least an email and a comment.');
        return;
    }
    
    const btn = document.querySelector('.btn-feedback');
    const originalText = btn.innerText;
    
    btn.innerText = 'Posting...';
    btn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        alert('Thank you for your feedback! Your post has been sent to the moderation queue.');
        btn.innerText = originalText;
        btn.disabled = false;
        if (document.getElementById('feedbackComment')) document.getElementById('feedbackComment').value = '';
    }, 1500);
}


// ==========================================
// YourCalc - GA4 Tracking & Email Capture
// ==========================================

window.YC = window.YC || {};

YC.trackCalcLoad = function(calcId, calcName, category) {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'calculator_load', { calc_id: calcId, calc_name: calcName, calc_category: category });
};

YC.trackCalcResult = function(calcId, calcName, category, inputs) {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'calculator_result', {
    calc_id: calcId,
    calc_name: calcName,
    calc_category: category,
    input_summary: JSON.stringify(inputs)
  });
  if (window._yc_load_time) {
    gtag('event', 'calculator_time_to_result', {
      calc_id: calcId,
      seconds: Math.round((Date.now() - window._yc_load_time) / 1000)
    });
  }
};

window._yc_load_time = Date.now();

document.addEventListener('DOMContentLoaded', function() {
    // 1. Inject Email Capture HTML
    const widgetHTML = `
    <div id="yc-email-capture" class="yc-capture-widget" style="display:none; position:fixed; bottom:20px; right:20px; width:calc(100% - 40px); max-width:400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <div class="yc-capture-inner">
        <button class="yc-capture-close" aria-label="Dismiss">✕</button>
        <div class="yc-capture-icon" style="font-size:24px; margin-bottom:8px;">📬</div>
        <p class="yc-capture-headline">Save or email your results</p>
        <p class="yc-capture-sub">Optional — get a copy of this calculation sent to your inbox.</p>
        <div class="yc-capture-form">
          <input type="email" id="yc-email-input" placeholder="your@email.com" autocomplete="email" />
          <button id="yc-email-submit">Send Results</button>
        </div>
        <p class="yc-capture-legal">
          No spam. No account created. We'll send one email with your results.
          <a href="/privacy.html">Privacy Policy</a>
        </p>
      </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    // 2. Email Capture Logic
    const STORAGE_KEY = 'yc_email_submitted';
    const DISMISS_KEY = 'yc_capture_dismissed';
    const widget = document.getElementById('yc-email-capture');
    
    if (widget && !sessionStorage.getItem(STORAGE_KEY) && !sessionStorage.getItem(DISMISS_KEY)) {
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                if (m.type === 'attributes' && m.attributeName === 'class') {
                    if (m.target.classList.contains('result-panel') && m.target.classList.contains('visible')) {
                        // Result panel became visible! Show widget.
                        if (!sessionStorage.getItem(STORAGE_KEY) && !sessionStorage.getItem(DISMISS_KEY)) {
                            setTimeout(() => { widget.style.display = 'block'; }, 800);
                        }
                    }
                }
            }
        });
        observer.observe(document.body, { attributes: true, subtree: true });

        document.querySelector('.yc-capture-close').addEventListener('click', function() {
            widget.style.display = 'none';
            sessionStorage.setItem(DISMISS_KEY, '1');
        });

        document.getElementById('yc-email-submit').addEventListener('click', async function() {
            const email = document.getElementById('yc-email-input').value.trim();
            if (!email || !email.includes('@')) {
                document.getElementById('yc-email-input').style.borderColor = '#ef4444';
                return;
            }

            const activeContainer = document.querySelector('.calc-container.active');
            let calcName = document.title.split('—')[0].trim();
            if (activeContainer) {
                const btn = document.querySelector(`[onclick*="'${activeContainer.id}'"]`);
                if (btn) calcName = btn.innerText.replace('→', '').trim();
            }

            // Capture results from the DOM
            const results = {};
            if (activeContainer) {
                const resultPanel = activeContainer.querySelector('.result-panel');
                if (resultPanel) {
                    resultPanel.querySelectorAll('.result-item').forEach(item => {
                        const label = item.querySelector('.result-label')?.innerText || 'Result';
                        const value = item.querySelector('.result-value')?.innerText || '0';
                        results[label] = value;
                    });
                }
            }

            // Capture inputs from the DOM
            const inputs = {};
            if (activeContainer) {
                activeContainer.querySelectorAll('input, select').forEach(inp => {
                    const label = inp.closest('.input-group')?.querySelector('label')?.innerText || inp.id;
                    if (label) inputs[label] = inp.value;
                });
            }

            const payload = {
                email: email,
                name: email.split('@')[0],
                referrer: document.referrer || 'Direct',
                log: [{
                    tool: calcName,
                    inputs: inputs,
                    results: results,
                    url: window.location.pathname + window.location.hash,
                    timestamp: new Date().toISOString()
                }]
            };

            const STORAGE_KEY = 'yc_email_submitted';
            const widget = document.getElementById('yc-email-capture');

            try {
                const response = await fetch('/api/save-activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('API failed');

                if (typeof gtag !== 'undefined') {
                    gtag('event', 'email_capture', { calculator: calcName, page: window.location.pathname });
                }

                sessionStorage.setItem(STORAGE_KEY, '1');
                widget.innerHTML = '<div style="text-align:center;padding:12px;color:#4ade80;font-weight:600;">✓ Results have been sent to your inbox.</div>';
                setTimeout(() => { widget.style.display = 'none'; }, 2500);
            } catch (error) {
                console.error('Email Capture Error:', error);
                document.getElementById('yc-email-submit').innerText = 'Retry Send';
                document.getElementById('yc-email-input').style.borderColor = '#ef4444';
            }
        });
    }

    // 3. Global Calculate Interceptor for GA4
    document.body.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-calculate')) {
            const container = e.target.closest('.calc-container');
            if (container) {
                const calcId = container.id;
                const tabBtn = document.querySelector(`[onclick*="'${calcId}'"]`);
                const calcName = tabBtn ? tabBtn.innerText : calcId;
                const h1 = document.querySelector('h1');
                const category = h1 ? h1.innerText.replace(/<[^>]*>?/gm, '').trim() : 'Unknown';

                const inputs = {};
                container.querySelectorAll('input, select').forEach(inp => {
                    if (inp.id) {
                        if (inp.tagName === 'SELECT') {
                            inputs[inp.id] = inp.value;
                        } else {
                            let val = parseFloat(inp.value);
                            if (!isNaN(val)) {
                                if (val > 100000) inputs[inp.id] = '>100k';
                                else if (val > 10000) inputs[inp.id] = '10k-100k';
                                else if (val > 1000) inputs[inp.id] = '1k-10k';
                                else inputs[inp.id] = '<1k';
                            } else {
                                inputs[inp.id] = 'text_or_empty';
                            }
                        }
                    }
                });

                YC.trackCalcResult(calcId, calcName, category, inputs);
            }
        }
    });
});
