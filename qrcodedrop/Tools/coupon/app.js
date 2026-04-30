const countInput = document.getElementById('coupon-count');
const lengthInput = document.getElementById('coupon-length');
const prefixInput = document.getElementById('coupon-prefix');
const uppercaseCheckbox = document.getElementById('coupon-uppercase');
const lowercaseCheckbox = document.getElementById('coupon-lowercase');
const numbersCheckbox = document.getElementById('coupon-numbers');
const symbolsCheckbox = document.getElementById('coupon-symbols');
const generateCouponsButton = document.getElementById('btn-generate-coupons');
const copyCouponsButton = document.getElementById('btn-copy-coupons');
const couponOutput = document.getElementById('coupon-output');

function getCharset() {
    let charset = '';
    if (uppercaseCheckbox.checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowercaseCheckbox.checked) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (numbersCheckbox.checked) charset += '0123456789';
    if (symbolsCheckbox.checked) charset += '-_@#$%';
    return charset;
}

function generateCode(length, prefix, charset) {
    let code = prefix || '';
    for (let i = 0; i < length; i += 1) {
        code += charset[Math.floor(Math.random() * charset.length)];
    }
    return code;
}

function generateCoupons() {
    const count = Math.min(Math.max(parseInt(countInput.value, 10) || 1, 1), 100);
    const length = Math.min(Math.max(parseInt(lengthInput.value, 10) || 8, 4), 32);
    const prefix = prefixInput.value.trim();
    const charset = getCharset();

    if (!charset) {
        couponOutput.value = 'Select at least one character set.';
        return;
    }

    const codes = new Set();
    while (codes.size < count) {
        codes.add(generateCode(length, prefix, charset));
    }
    couponOutput.value = Array.from(codes).join('\n');
}

function copyCoupons() {
    const text = couponOutput.value.trim();
    if (!text) return;
    navigator.clipboard.writeText(text);
}

generateCouponsButton.addEventListener('click', generateCoupons);
copyCouponsButton.addEventListener('click', copyCoupons);

// --- Email Collection Modal ---
const emailModal = document.getElementById('email-modal');
const closeModal = document.querySelector('.close-modal');
const emailSignupForm = document.getElementById('email-signup-form');
const signupEmail = document.getElementById('signup-email');

// Show modal after 30 seconds or when user generates coupons
let modalShown = false;
setTimeout(() => {
    if (!modalShown) {
        emailModal.style.display = 'block';
        modalShown = true;
    }
}, 30000);

// Show modal on generate action
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
                source: 'coupon_tool',
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

// Attach modal trigger to generate button
generateCouponsButton.addEventListener('click', () => showEmailModal('generate'));

generateCoupons();
