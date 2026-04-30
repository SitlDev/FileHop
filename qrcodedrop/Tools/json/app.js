const input = document.getElementById('json-input');
const output = document.getElementById('json-output');
const btnFormat = document.getElementById('btn-format');
const btnMinify = document.getElementById('btn-minify');
const btnValidate = document.getElementById('btn-validate');
const btnCopy = document.getElementById('btn-copy');
const btnDownload = document.getElementById('btn-download');

function setOutput(text, ok = true) {
  output.value = text;
  output.style.borderColor = ok ? 'var(--accent)' : 'crimson';
}

function parseJSON(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function formatJSON() {
  const txt = input.value.trim();
  if (!txt) { setOutput('No input provided', false); return; }
  const res = parseJSON(txt);
  if (!res.ok) { setOutput('Invalid JSON: ' + res.error, false); return; }
  setOutput(JSON.stringify(res.value, null, 2), true);
}

function minifyJSON() {
  const txt = input.value.trim();
  if (!txt) { setOutput('No input provided', false); return; }
  const res = parseJSON(txt);
  if (!res.ok) { setOutput('Invalid JSON: ' + res.error, false); return; }
  setOutput(JSON.stringify(res.value), true);
}

function validateJSON() {
  const txt = input.value.trim();
  if (!txt) { setOutput('No input provided', false); return; }
  const res = parseJSON(txt);
  if (!res.ok) { setOutput('Invalid JSON: ' + res.error, false); return; }
  setOutput('Valid JSON — parsed OK.', true);
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

function downloadOutput() {
  const txt = output.value;
  if (!txt) return alert('Nothing to download');
  const blob = new Blob([txt], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

btnFormat.addEventListener('click', formatJSON);
btnMinify.addEventListener('click', minifyJSON);
btnValidate.addEventListener('click', validateJSON);
btnCopy.addEventListener('click', copyOutput);
btnDownload.addEventListener('click', downloadOutput);

// keyboard shortcut: Ctrl/Cmd+Enter to format
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    formatJSON();
  }
});

// initial sample
const sample = '{"hello": "world", "numbers": [1,2,3], "nested": {"a": true}}';
if (!localStorage.getItem('json_seen')) {
  input.value = sample;
  localStorage.setItem('json_seen', '1');
}

// --- Email modal (shared pattern) ---
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
      body: JSON.stringify({ email, source: 'json_tool', timestamp: new Date().toISOString() })
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