const lengthInput = document.getElementById('pw-length');
const upperCheckbox = document.getElementById('pw-upper');
const lowerCheckbox = document.getElementById('pw-lower');
const numbersCheckbox = document.getElementById('pw-numbers');
const symbolsCheckbox = document.getElementById('pw-symbols');
const excludeSimilar = document.getElementById('pw-similar');
const generateBtn = document.getElementById('btn-generate-pw');
const copyBtn = document.getElementById('btn-copy-pw');
const output = document.getElementById('pw-output');

const similarChars = /[il1Lo0O]/g;
const sets = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>?'
};

function buildCharset() {
    let chars = '';
    if (upperCheckbox.checked) chars += sets.upper;
    if (lowerCheckbox.checked) chars += sets.lower;
    if (numbersCheckbox.checked) chars += sets.numbers;
    if (symbolsCheckbox.checked) chars += sets.symbols;

    if (excludeSimilar.checked) chars = chars.replace(similarChars, '');
    return chars;
}

function secureRandomInt(max) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
}

function generatePassword() {
    const len = Math.min(Math.max(parseInt(lengthInput.value, 10) || 8, 4), 256);
    const charset = buildCharset();
    if (!charset) {
        alert('Select at least one character set.');
        return '';
    }

    let pw = '';
    for (let i = 0; i < len; i++) {
        const idx = secureRandomInt(charset.length);
        pw += charset.charAt(idx);
    }

    output.value = pw;
    return pw;
}

function copyPassword() {
    const text = output.value.trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = orig; }, 2000);
        // show email modal if not subscribed
        showEmailModal('copy');
    });
}

// Email modal logic
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
            body: JSON.stringify({ email, source: 'password_tool', timestamp: new Date().toISOString() })
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

// Events
generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyPassword);
lengthInput.addEventListener('input', generatePassword);
upperCheckbox.addEventListener('change', generatePassword);
lowerCheckbox.addEventListener('change', generatePassword);
numbersCheckbox.addEventListener('change', generatePassword);
symbolsCheckbox.addEventListener('change', generatePassword);

// Initial
generatePassword();