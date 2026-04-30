const input = document.getElementById('csv-input');
const output = document.getElementById('csv-output');
const headersCheckbox = document.getElementById('csv-headers');
const btnConvert = document.getElementById('btn-convert');
const btnCopy = document.getElementById('btn-copy');

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];

  const rows = [];
  for (let line of lines) {
    const row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    row.push(field.trim());
    rows.push(row);
  }

  return rows;
}

function convertCSV() {
  const csv = input.value.trim();
  if (!csv) {
    output.value = '[]';
    return;
  }

  const rows = parseCSV(csv);
  if (rows.length === 0) {
    output.value = '[]';
    return;
  }

  let result = [];
  const hasHeaders = headersCheckbox.checked;

  if (hasHeaders && rows.length > 0) {
    const headers = rows[0];
    for (let i = 1; i < rows.length; i++) {
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = rows[i][j] || '';
      }
      result.push(obj);
    }
  } else {
    for (let row of rows) {
      const obj = {};
      for (let i = 0; i < row.length; i++) {
        obj[`column_${i + 1}`] = row[i];
      }
      result.push(obj);
    }
  }

  output.value = JSON.stringify(result, null, 2);
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

btnConvert.addEventListener('click', convertCSV);
btnCopy.addEventListener('click', copyOutput);
input.addEventListener('input', convertCSV);
headersCheckbox.addEventListener('change', convertCSV);

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
      body: JSON.stringify({ email, source: 'csvjson_tool', timestamp: new Date().toISOString() })
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
convertCSV();