const patternInput = document.getElementById('regex-pattern');
const testText = document.getElementById('regex-text');
const globalFlag = document.getElementById('regex-global');
const insensitiveFlag = document.getElementById('regex-insensitive');
const multilineFlag = document.getElementById('regex-multiline');
const btnTest = document.getElementById('btn-test');
const btnCopyResult = document.getElementById('btn-copy-result');
const output = document.getElementById('regex-output');

function testRegex() {
  const pattern = patternInput.value.trim();
  const text = testText.value;

  if (!pattern) {
    output.value = 'Please enter a regex pattern.';
    return;
  }

  try {
    let flags = '';
    if (globalFlag.checked) flags += 'g';
    if (insensitiveFlag.checked) flags += 'i';
    if (multilineFlag.checked) flags += 'm';

    const regex = new RegExp(pattern, flags);
    const matches = text.match(regex);

    if (matches) {
      const result = `Matched ${matches.length} result(s):\n\n${matches.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
      output.value = result;
      output.style.borderColor = 'var(--accent)';
    } else {
      output.value = 'No matches found.';
      output.style.borderColor = 'var(--accent)';
    }
  } catch (err) {
    output.value = `Invalid regex: ${err.message}`;
    output.style.borderColor = 'crimson';
  }
}

function copyResult() {
  const txt = output.value;
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(() => {
    const orig = btnCopyResult.textContent;
    btnCopyResult.textContent = 'Copied!';
    setTimeout(() => btnCopyResult.textContent = orig, 1500);
    showEmailModal('copy');
  });
}

btnTest.addEventListener('click', testRegex);
btnCopyResult.addEventListener('click', copyResult);
patternInput.addEventListener('input', testRegex);
testText.addEventListener('input', testRegex);
globalFlag.addEventListener('change', testRegex);
insensitiveFlag.addEventListener('change', testRegex);
multilineFlag.addEventListener('change', testRegex);

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
      body: JSON.stringify({ email, source: 'regex_tool', timestamp: new Date().toISOString() })
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

// initial test
testRegex();