const input = document.getElementById('url-input');
const output = document.getElementById('url-output');
const btnEncode = document.getElementById('btn-encode');
const btnDecode = document.getElementById('btn-decode');
const btnCopy = document.getElementById('btn-copy');

function setOutput(text, ok = true) {
  output.value = text;
  output.style.borderColor = ok ? 'var(--accent)' : 'crimson';
}

function encodeURL() {
  const txt = input.value;
  if (!txt) { setOutput('No input provided', false); return; }
  try {
    const encoded = encodeURIComponent(txt);
    setOutput(encoded, true);
  } catch (err) {
    setOutput('Encoding error: ' + err.message, false);
  }
}

function decodeURL() {
  const txt = input.value.trim();
  if (!txt) { setOutput('No input provided', false); return; }
  try {
    const decoded = decodeURIComponent(txt);
    setOutput(decoded, true);
  } catch (err) {
    setOutput('Invalid URL encoding: ' + err.message, false);
  }
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

btnEncode.addEventListener('click', encodeURL);
btnDecode.addEventListener('click', decodeURL);
btnCopy.addEventListener('click', copyOutput);

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
      body: JSON.stringify({ email, source: 'urlencoder_tool', timestamp: new Date().toISOString() })
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