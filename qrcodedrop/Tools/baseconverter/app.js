const inputType = document.getElementById('base-input-type');
const input = document.getElementById('base-input');
const binaryField = document.getElementById('base-binary');
const octalField = document.getElementById('base-octal');
const decimalField = document.getElementById('base-decimal');
const hexField = document.getElementById('base-hex');

function convertBase() {
  const val = input.value.trim();
  const fromBase = parseInt(inputType.value, 10);

  if (!val) {
    binaryField.value = '';
    octalField.value = '';
    decimalField.value = '';
    hexField.value = '';
    return;
  }

  try {
    // Convert to decimal first
    const decimal = parseInt(val, fromBase);
    if (isNaN(decimal)) throw new Error('Invalid input');

    // Convert to all bases
    binaryField.value = decimal.toString(2);
    octalField.value = decimal.toString(8);
    decimalField.value = decimal.toString(10);
    hexField.value = decimal.toString(16).toUpperCase();
  } catch (err) {
    binaryField.value = 'Invalid input';
    octalField.value = 'Invalid input';
    decimalField.value = 'Invalid input';
    hexField.value = 'Invalid input';
  }
}

async function copyField(fieldId) {
  const el = document.getElementById(fieldId);
  const txt = el.value;
  if (!txt || txt.includes('Invalid')) return;
  try {
    await navigator.clipboard.writeText(txt);
    showEmailModal('copy');
  } catch (err) {
    alert('Copy failed: ' + err.message);
  }
}

inputType.addEventListener('change', convertBase);
input.addEventListener('input', convertBase);

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => copyField(btn.dataset.field));
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
      body: JSON.stringify({ email, source: 'baseconverter_tool', timestamp: new Date().toISOString() })
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