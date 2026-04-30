const input = document.getElementById('stats-input');
const wordsField = document.getElementById('stat-words');
const charsField = document.getElementById('stat-chars');
const charsNoSpaceField = document.getElementById('stat-chars-no-space');
const sentencesField = document.getElementById('stat-sentences');
const paragraphsField = document.getElementById('stat-paragraphs');
const avgWordField = document.getElementById('stat-avg-word');
const readingTimeField = document.getElementById('stat-reading-time');
const uniqueWordsField = document.getElementById('stat-unique-words');

function analyzeText() {
  const text = input.value;

  // Character counts
  const charsWithSpace = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;

  // Word count
  const words = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0) : [];
  const wordCount = words.length;

  // Sentence count
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  // Paragraph count
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;

  // Average word length
  const avgWordLength = wordCount > 0 ? (charsNoSpace / wordCount).toFixed(2) : 0;

  // Reading time (assuming 200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);

  // Unique words
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;

  // Update fields
  wordsField.value = wordCount;
  charsField.value = charsWithSpace;
  charsNoSpaceField.value = charsNoSpace;
  sentencesField.value = sentences;
  paragraphsField.value = paragraphs;
  avgWordField.value = avgWordLength;
  readingTimeField.value = readingTime || 0;
  uniqueWordsField.value = uniqueWords;
}

input.addEventListener('input', analyzeText);

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
      body: JSON.stringify({ email, source: 'textstats_tool', timestamp: new Date().toISOString() })
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
analyzeText();