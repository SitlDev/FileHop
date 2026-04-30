const input = document.getElementById('entity-input');
const output = document.getElementById('entity-output');
const btnEncode = document.getElementById('btn-encode');
const btnDecode = document.getElementById('btn-decode');
const btnCopy = document.getElementById('btn-copy');

const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '¢': '&cent;',
  '£': '&pound;',
  '¥': '&yen;',
  '€': '&euro;',
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  '°': '&deg;',
  '±': '&plusmn;',
  '×': '&times;',
  '÷': '&divide;'
};

function encodeEntities() {
  const txt = input.value;
  if (!txt) { output.value = ''; return; }

  let result = txt;
  for (const [char, entity] of Object.entries(entities)) {
    result = result.split(char).join(entity);
  }

  output.value = result;
}

function decodeEntities() {
  const txt = input.value;
  if (!txt) { output.value = ''; return; }

  const textarea = document.createElement('textarea');
  textarea.innerHTML = txt;
  output.value = textarea.value;
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

btnEncode.addEventListener('click', encodeEntities);
btnDecode.addEventListener('click', decodeEntities);
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
      body: JSON.stringify({ email, source: 'htmlencode_tool', timestamp: new Date().toISOString() })
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