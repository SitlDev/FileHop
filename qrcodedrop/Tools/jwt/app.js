const jwtInput = document.getElementById('jwt-input');
const btnDecode = document.getElementById('btn-decode-jwt');
const btnCopy = document.getElementById('btn-copy-jwt');
const jwtHeader = document.getElementById('jwt-header');
const jwtPayload = document.getElementById('jwt-payload');
const jwtSignature = document.getElementById('jwt-signature');
const jwtError = document.getElementById('jwt-error');

function base64UrlDecode(value) {
    value = value.replace(/-/g, '+').replace(/_/g, '/');
    while (value.length % 4) {
        value += '=';
    }
    return decodeURIComponent(escape(window.atob(value)));
}

function decodeJWT() {
    const token = jwtInput.value.trim();
    jwtError.textContent = '';
    jwtHeader.textContent = '';
    jwtPayload.textContent = '';
    jwtSignature.textContent = '';

    if (!token) {
        jwtError.textContent = 'Paste a JWT token to decode.';
        return;
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
        jwtError.textContent = 'Invalid JWT format. Expect three parts separated by dots.';
        return;
    }

    try {
        const header = JSON.parse(base64UrlDecode(parts[0]));
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        jwtHeader.textContent = JSON.stringify(header, null, 2);
        jwtPayload.textContent = JSON.stringify(payload, null, 2);
        jwtSignature.textContent = parts[2];
    } catch (err) {
        jwtError.textContent = 'Unable to decode JWT. Make sure the token is valid.';
    }
}

btnDecode.addEventListener('click', decodeJWT);
btnCopy.addEventListener('click', () => {
    const token = jwtInput.value.trim();
    if (!token) return;
    navigator.clipboard.writeText(token);
});

// --- Email Collection Modal ---
const emailModal = document.getElementById('email-modal');
const closeModal = document.querySelector('.close-modal');
const emailSignupForm = document.getElementById('email-signup-form');
const signupEmail = document.getElementById('signup-email');

// Show modal after 30 seconds or when user decodes JWT
let modalShown = false;
setTimeout(() => {
    if (!modalShown) {
        emailModal.style.display = 'block';
        modalShown = true;
    }
}, 30000);

// Show modal on decode action
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
                source: 'jwt_tool',
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

// Attach modal trigger to decode button
btnDecode.addEventListener('click', () => showEmailModal('decode'));

if (jwtInput.value.trim()) {
    decodeJWT();
}
