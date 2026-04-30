const mode = document.getElementById('enc-mode');
const shift = document.getElementById('enc-shift');
const input = document.getElementById('enc-input');
const output = document.getElementById('enc-output');
const btnProcess = document.getElementById('btn-process');
const btnCopy = document.getElementById('btn-copy');

function caesarCipher(text, shiftVal, decrypt = false) {
  const actualShift = decrypt ? 26 - shiftVal : shiftVal;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const start = char >= 'a' ? 97 : 65;
    return String.fromCharCode(start + (char.charCodeAt(0) - start + actualShift) % 26);
  });
}

function process() {
  const txt = input.value;
  const shiftVal = parseInt(shift.value, 10) || 0;
  const isDecrypt = mode.value === 'decrypt';

  if (!txt) {
    output.value = '';
    return;
  }

  const result = caesarCipher(txt, shiftVal, isDecrypt);
  output.value = result;
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

mode.addEventListener('change', process);
shift.addEventListener('input', process);
input.addEventListener('input', process);
btnProcess.addEventListener('click', process);
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
      body: JSON.stringify({ email, source: 'encryption_tool', timestamp: new Date().toISOString() })
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