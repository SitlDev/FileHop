const input = document.getElementById('case-input');
const upper = document.getElementById('case-upper');
const lower = document.getElementById('case-lower');
const title = document.getElementById('case-title');
const camel = document.getElementById('case-camel');
const snake = document.getElementById('case-snake');
const kebab = document.getElementById('case-kebab');
const pascal = document.getElementById('case-pascal');
const constant = document.getElementById('case-constant');

const btnCopyUpper = document.getElementById('btn-copy-upper');
const btnCopyCamel = document.getElementById('btn-copy-camel');

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function toCamelCase(str) {
  return str.toLowerCase().replace(/[\s_-]+(.)/g, (_, c) => c.toUpperCase());
}

function toSnakeCase(str) {
  return str.toLowerCase().replace(/[\s-]+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2');
}

function toKebabCase(str) {
  return str.toLowerCase().replace(/[\s_]+/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2');
}

function toPascalCase(str) {
  return toCamelCase(str).charAt(0).toUpperCase() + toCamelCase(str).slice(1);
}

function toConstantCase(str) {
  return toSnakeCase(str).toUpperCase();
}

function convertCases() {
  const txt = input.value.trim();
  upper.value = txt.toUpperCase();
  lower.value = txt.toLowerCase();
  title.value = toTitleCase(txt);
  camel.value = toCamelCase(txt);
  snake.value = toSnakeCase(txt);
  kebab.value = toKebabCase(txt);
  pascal.value = toPascalCase(txt);
  constant.value = toConstantCase(txt);
}

async function copyField(fieldId) {
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

input.addEventListener('input', convertCases);
btnCopyUpper.addEventListener('click', () => copyField('case-upper'));
btnCopyCamel.addEventListener('click', () => copyField('case-camel'));

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
      body: JSON.stringify({ email, source: 'textcase_tool', timestamp: new Date().toISOString() })
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