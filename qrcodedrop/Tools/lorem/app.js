const loremType = document.getElementById('lorem-type');
const loremCount = document.getElementById('lorem-count');
const loremStart = document.getElementById('lorem-start');
const generateButton = document.getElementById('btn-generate-lorem');
const copyButton = document.getElementById('btn-copy-lorem');
const loremOutput = document.getElementById('lorem-output');

// Lorem Ipsum text database
const loremWords = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
    "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
    "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
    "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
    "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
    "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla",
    "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
    "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
    "est", "laborum"
];

const loremSentences = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    "Nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
    "Eu fugiat nulla pariatur.",
    "Excepteur sint occaecat cupidatat non proident.",
    "Sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem.",
    "Accusantium doloremque laudantium, totam rem aperiam.",
    "Eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt.",
    "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
    "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
    "Consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt.",
    "Ut labore et dolore magnam aliquam quaerat voluptatem."
];

function generateLoremIpsum() {
    const type = loremType.value;
    const count = Math.min(Math.max(parseInt(loremCount.value, 10) || 1, 1), 100);
    const startWithLorem = loremStart.checked;

    let result = '';

    switch(type) {
        case 'paragraphs':
            result = generateParagraphs(count, startWithLorem);
            break;
        case 'sentences':
            result = generateSentences(count, startWithLorem);
            break;
        case 'words':
            result = generateWords(count, startWithLorem);
            break;
    }

    loremOutput.value = result;
}

function generateParagraphs(count, startWithLorem) {
    const paragraphs = [];

    for (let i = 0; i < count; i++) {
        let paragraph = '';

        if (i === 0 && startWithLorem) {
            paragraph = loremSentences[0] + ' ';
        }

        // Generate 3-6 sentences per paragraph
        const sentenceCount = Math.floor(Math.random() * 4) + 3;
        const sentences = [];

        for (let j = 0; j < sentenceCount; j++) {
            if (i === 0 && j === 0 && startWithLorem) continue;
            sentences.push(loremSentences[Math.floor(Math.random() * loremSentences.length)]);
        }

        paragraph += sentences.join(' ');
        paragraphs.push(paragraph);
    }

    return paragraphs.join('\n\n');
}

function generateSentences(count, startWithLorem) {
    const sentences = [];

    for (let i = 0; i < count; i++) {
        if (i === 0 && startWithLorem) {
            sentences.push(loremSentences[0]);
        } else {
            sentences.push(loremSentences[Math.floor(Math.random() * loremSentences.length)]);
        }
    }

    return sentences.join(' ');
}

function generateWords(count, startWithLorem) {
    const words = [];

    for (let i = 0; i < count; i++) {
        if (i === 0 && startWithLorem) {
            words.push(...loremSentences[0].toLowerCase().replace(/[,.]/g, '').split(' ').slice(0, count));
            break;
        } else {
            words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
        }
    }

    return words.slice(0, count).join(' ');
}

function copyLoremText() {
    const text = loremOutput.value.trim();
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 2000);
    });
}

// Event listeners
generateButton.addEventListener('click', generateLoremText);
copyButton.addEventListener('click', copyLoremText);
loremType.addEventListener('change', generateLoremText);
loremCount.addEventListener('input', generateLoremText);
loremStart.addEventListener('change', generateLoremText);

// --- Email Collection Modal ---
const emailModal = document.getElementById('email-modal');
const closeModal = document.querySelector('.close-modal');
const emailSignupForm = document.getElementById('email-signup-form');
const signupEmail = document.getElementById('signup-email');

// Show modal after 30 seconds or when user copies text
let modalShown = false;
setTimeout(() => {
    if (!modalShown) {
        emailModal.style.display = 'block';
        modalShown = true;
    }
}, 30000);

// Show modal on copy action
function showEmailModal(trigger) {
    if (!modalShown && !localStorage.getItem('email_subscribed')) {
        emailModal.style.display = 'block';
        modalShown = true;
    }
}

// Close modal
closeModal.addEventListener('click', () => {
    emailModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === emailModal) {
        emailModal.style.display = 'none';
    }
});

// Handle email signup
emailSignupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupEmail.value.trim();

    if (!email) return;

    try {
        const response = await fetch('https://knotstranded.com/api/newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                source: 'lorem_tool',
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            localStorage.setItem('email_subscribed', 'true');
            emailModal.style.display = 'none';
            alert('Thanks for subscribing! Check your email for confirmation.');
        } else {
            alert('There was an error subscribing. Please try again.');
        }
    } catch (error) {
        console.error('Newsletter signup error:', error);
        alert('There was an error subscribing. Please try again.');
    }
});

// Attach modal trigger to copy button
copyButton.addEventListener('click', () => showEmailModal('copy'));

// Initial generation
generateLoremText();