const input = document.getElementById('ts-input');
const isoField = document.getElementById('ts-iso');
const localField = document.getElementById('ts-local');
const utcField = document.getElementById('ts-utc');
const btnNow = document.getElementById('btn-now');

function convertTimestamp() {
  const val = input.value.trim();
  if (!val) {
    isoField.value = '';
    localField.value = '';
    utcField.value = '';
    return;
  }

  try {
    const ts = parseInt(val, 10);
    if (isNaN(ts)) throw new Error('Invalid timestamp');

    const date = new Date(ts * 1000);
    
    isoField.value = date.toISOString();
    localField.value = date.toString();
    utcField.value = date.toUTCString();
  } catch (err) {
    isoField.value = 'Invalid timestamp';
    localField.value = 'Invalid timestamp';
    utcField.value = 'Invalid timestamp';
  }
}

function useCurrentTime() {
  const now = Math.floor(Date.now() / 1000);
  input.value = now;
  convertTimestamp();
}

input.addEventListener('input', convertTimestamp);
btnNow.addEventListener('click', useCurrentTime);

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const fieldId = btn.dataset.field;
    const el = document.getElementById(fieldId);
    const txt = el.value;
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      showEmailModal('copy');
    } catch (err) {
      alert('Copy failed: ' + err.message);
    }
  });
});

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
      body: JSON.stringify({ email, source: 'timestamp_tool', timestamp: new Date().toISOString() })
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