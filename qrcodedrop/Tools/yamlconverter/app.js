const input = document.getElementById('yaml-input');
const output = document.getElementById('yaml-output');
const btnConvert = document.getElementById('btn-convert');
const btnCopy = document.getElementById('btn-copy');

// Simple YAML to JSON converter (handles basic YAML)
function parseYAML(yaml) {
  const lines = yaml.split('\n');
  const obj = {};
  const stack = [{ obj, indent: -1 }];

  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Find appropriate parent based on indentation
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (trimmed.includes(':')) {
      const [key, ...rest] = trimmed.split(':');
      const value = rest.join(':').trim();

      if (!value || value.startsWith('{') || value.startsWith('[')) {
        // Nested object or array
        const nested = {};
        parent[key.trim()] = nested;
        stack.push({ obj: nested, indent });
      } else {
        // Regular key-value pair
        parent[key.trim()] = parseValue(value);
      }
    } else if (trimmed.startsWith('- ')) {
      // Array item - simplified handling
      if (!Array.isArray(parent)) {
        // This is a simplified version; full YAML parsing is complex
      }
    }
  }

  return obj;
}

function parseValue(val) {
  val = val.trim();

  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === 'nil') return null;
  if (!isNaN(val) && val !== '') return Number(val);
  if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
  if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);

  return val;
}

function convertYAML() {
  const yaml = input.value.trim();
  if (!yaml) {
    output.value = '{}';
    return;
  }

  try {
    const obj = parseYAML(yaml);
    output.value = JSON.stringify(obj, null, 2);
  } catch (err) {
    output.value = 'Error: ' + err.message;
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

btnConvert.addEventListener('click', convertYAML);
btnCopy.addEventListener('click', copyOutput);
input.addEventListener('input', convertYAML);

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
      body: JSON.stringify({ email, source: 'yaml_tool', timestamp: new Date().toISOString() })
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

// initial
convertYAML();