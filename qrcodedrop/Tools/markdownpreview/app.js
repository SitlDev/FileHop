const input = document.getElementById('md-input');
const preview = document.getElementById('md-preview');

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function renderMarkdown(md) {
  let html = md;

  // Escape HTML first
  html = escapeHtml(html);

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^[\*\-\+] (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h|<ul|<ol|<blockquote)/g, '$1');
  html = html.replace(/<\/(h|ul|ol|blockquote)><\/p>/g, '</$1>');

  return html;
}

function updatePreview() {
  const md = input.value;
  const html = renderMarkdown(md);
  preview.innerHTML = html;
}

input.addEventListener('input', updatePreview);

// Sample markdown
const sample = `# Welcome to Markdown Preview

## Features
- **Live preview** as you type
- Support for *italic* and **bold**
- \`Code snippets\` inline
- [Links](https://example.com)

### Code Blocks
\`\`\`
const hello = "world";
console.log(hello);
\`\`\`

> This is a blockquote with *emphasis*

Happy writing!`;

if (!localStorage.getItem('md_seen')) {
  input.value = sample;
  localStorage.setItem('md_seen', '1');
}

updatePreview();

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
      body: JSON.stringify({ email, source: 'mdpreview_tool', timestamp: new Date().toISOString() })
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