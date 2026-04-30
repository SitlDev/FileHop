const input = document.getElementById('hash-input');
const sha256Field = document.getElementById('hash-sha256');
const sha512Field = document.getElementById('hash-sha512');
const sha1Field = document.getElementById('hash-sha1');
const btnHash = document.getElementById('btn-hash');

async function hashText(algorithm) {
  const txt = input.value;
  if (!txt) return '';
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(txt);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (err) {
    console.error('Hash error:', err);
    return 'Error: ' + err.message;
  }
}

async function generateHashes() {
  const txt = input.value.trim();
  if (!txt) {
    sha256Field.value = '';
    sha512Field.value = '';
    sha1Field.value = '';
    return;
  }

  sha256Field.value = 'Generating...';
  sha512Field.value = 'Generating...';
  sha1Field.value = 'Generating...';

  const [h256, h512, h1] = await Promise.all([
    hashText('SHA-256'),
    hashText('SHA-512'),
    hashText('SHA-1')
  ]);

  sha256Field.value = h256;
  sha512Field.value = h512;
  sha1Field.value = h1;
}

async function copyHash(fieldId) {
  const el = document.getElementById(fieldId);
  const txt = el.value;
  if (!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
    showEmailModal('copy');
  } catch (err) {
    alert('Copy failed: ' + err.message);
  }
}

btnHash.addEventListener('click', generateHashes);
input.addEventListener('input', generateHashes);

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => copyHash(btn.dataset.field));
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
      body: JSON.stringify({ email, source: 'hash_tool', timestamp: new Date().toISOString() })
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