const input = document.getElementById('minify-input');
const output = document.getElementById('minify-output');
const btnMinify = document.getElementById('btn-minify');
const btnCopy = document.getElementById('btn-copy');

const originalSizeEl = document.getElementById('size-original');
const minifiedSizeEl = document.getElementById('size-minified');
const savedSizeEl = document.getElementById('size-saved');
const savedPercentEl = document.getElementById('size-percent');

function minifyCode() {
  let code = input.value;
  if (!code) {
    output.value = '';
    updateSizes(0, 0);
    return;
  }

  const originalSize = new Blob([code]).size;

  // Remove comments
  code = code.replace(/<!--[\s\S]*?-->/g, '');
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  code = code.replace(/\/\/.*$/gm, '');

  // Remove extra whitespace
  code = code.replace(/\s+/g, ' ');
  code = code.replace(/>\s+</g, '><');
  code = code.replace(/:\s+/g, ':');
  code = code.replace(/;\s+/g, ';');
  code = code.replace(/,\s+/g, ',');
  code = code.replace(/{\s+/g, '{');
  code = code.replace(/}\s+/g, '}');
  code = code.replace(/\s+}/g, '}');
  code = code.replace(/\s+{/g, '{');

  // Remove spaces around operators in CSS
  code = code.replace(/\s*([>+~])\s*/g, '$1');

  code = code.trim();

  const minifiedSize = new Blob([code]).size;
  output.value = code;
  updateSizes(originalSize, minifiedSize);
}

function updateSizes(original, minified) {
  const saved = original - minified;
  const percent = original > 0 ? ((saved / original) * 100).toFixed(1) : 0;

  originalSizeEl.textContent = original;
  minifiedSizeEl.textContent = minified;
  savedSizeEl.textContent = saved;
  savedPercentEl.textContent = percent;
}

async function copyOutput() {
  const txt = output.value;
  if (!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
    const orig = btnCopy.textContent;
    btnCopy.textContent = 'Copied!';
    setTimeout(() => btnCopy.textContent = orig, 1500);
    showEmailModal('copy');
  } catch (err) {
    alert('Copy failed: ' + err.message);
  }
}

btnMinify.addEventListener('click', minifyCode);
btnCopy.addEventListener('click', copyOutput);
input.addEventListener('input', minifyCode);

// --- Email modal ---
const emailModal = document.getElementById('email-modal');
const closeModal = document.querySelector('.close-modal');
const emailSignupForm = document.getElementById('email-signup-form');
const signupEmail = document.getElementById('signup-email');
let modalShown = false;

function showEmailModal(trigger) {
  if (!modalShown && !localStorage.getItem('email_subscribed')) {
    emailModal.style.display = 'block';
    modalShown = true;
  }
}

closeModal.addEventListener('click', () => { emailModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === emailModal) emailModal.style.display = 'none'; });

emailSignupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = signupEmail.value.trim();
  if (!email) return;
  try {
    const res = await fetch('https://knotstranded.com/api/newsletter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'minifier_tool', timestamp: new Date().toISOString() })
    });
    if (res.ok) {
      localStorage.setItem('email_subscribed', 'true');
      emailModal.style.display = 'none';
      alert('Thanks for subscribing!');
    } else {
      alert('Subscription error. Try again later.');
    }
  } catch (err) {
    console.error(err);
    alert('Subscription error. Try again later.');
  }
});