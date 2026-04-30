const input = document.getElementById('slug-input');
const output = document.getElementById('slug-output');
const lowercase = document.getElementById('slug-lowercase');
const spaces = document.getElementById('slug-spaces');
const special = document.getElementById('slug-special');
const btnGen = document.getElementById('btn-generate-slug');
const btnCopy = document.getElementById('btn-copy-slug');

function generateSlug() {
  let txt = input.value.trim();
  if (!txt) { output.value = ''; return; }

  if (lowercase.checked) txt = txt.toLowerCase();
  if (spaces.checked) txt = txt.replace(/\s+/g, '-');
  if (special.checked) txt = txt.replace(/[^\w\-]/g, '');

  output.value = txt;
}

async function copySlug() {
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

input.addEventListener('input', generateSlug);
lowercase.addEventListener('change', generateSlug);
spaces.addEventListener('change', generateSlug);
special.addEventListener('change', generateSlug);
btnGen.addEventListener('click', generateSlug);
btnCopy.addEventListener('click', copySlug);

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
      body: JSON.stringify({ email, source: 'slug_tool', timestamp: new Date().toISOString() })
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