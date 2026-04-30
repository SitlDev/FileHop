const input = document.getElementById('md-input');
const output = document.getElementById('md-output');
const btnConvert = document.getElementById('btn-convert');
const btnCopy = document.getElementById('btn-copy');

// Simple markdown to HTML converter
function markdownToHtml(md) {
  let html = md;

  // Escape HTML special characters first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Unordered lists
  html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/^\+ (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '');

  return html;
}

function convert() {
  const md = input.value;
  if (!md) { output.value = ''; return; }
  const html = markdownToHtml(md);
  output.value = html;
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

input.addEventListener('input', convert);
btnConvert.addEventListener('click', convert);
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
      body: JSON.stringify({ email, source: 'markdown_tool', timestamp: new Date().toISOString() })
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
convert();