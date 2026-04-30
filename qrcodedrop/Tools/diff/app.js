const text1 = document.getElementById('diff-text1');
const text2 = document.getElementById('diff-text2');
const btnCompare = document.getElementById('btn-compare');
const resultsDiv = document.getElementById('diff-results');

function simpleDiff(str1, str2) {
  const lines1 = str1.split('\n');
  const lines2 = str2.split('\n');
  const result = [];

  const maxLen = Math.max(lines1.length, lines2.length);

  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i] || '';
    const line2 = lines2[i] || '';

    if (line1 === line2) {
      result.push(`<div style="color: var(--text); padding: 2px 0;">  ${escapeHtml(line1)}</div>`);
    } else {
      if (line1) result.push(`<div style="color: red; padding: 2px 0;">- ${escapeHtml(line1)}</div>`);
      if (line2) result.push(`<div style="color: green; padding: 2px 0;">+ ${escapeHtml(line2)}</div>`);
    }
  }

  return result.join('');
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function compare() {
  const str1 = text1.value;
  const str2 = text2.value;

  if (!str1 && !str2) {
    resultsDiv.innerHTML = '<p>Enter text in both fields to compare.</p>';
    return;
  }

  const similarity = calculateSimilarity(str1, str2);
  const html = `<p><strong>Similarity: ${similarity.toFixed(1)}%</strong></p>${simpleDiff(str1, str2)}`;
  resultsDiv.innerHTML = html;
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 100;

  const editDistance = getEditDistance(shorter, longer);
  return ((longer.length - editDistance) / longer.length) * 100;
}

function getEditDistance(str1, str2) {
  const costs = [];
  for (let i = 0; i <= str1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= str2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[str2.length] = lastValue;
  }
  return costs[str2.length];
}

btnCompare.addEventListener('click', compare);
text1.addEventListener('input', compare);
text2.addEventListener('input', compare);

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
      body: JSON.stringify({ email, source: 'diff_tool', timestamp: new Date().toISOString() })
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