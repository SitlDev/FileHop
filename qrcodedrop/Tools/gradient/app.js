const gradientType = document.getElementById('gradient-type');
const gradientDirection = document.getElementById('gradient-direction');
const gradientColor1 = document.getElementById('gradient-color1');
const gradientColor2 = document.getElementById('gradient-color2');
const gradientPreview = document.getElementById('gradient-preview');
const gradientCssOutput = document.getElementById('gradient-css');
const copyGradientButton = document.getElementById('btn-copy-gradient');

function buildGradient() {
    const type = gradientType.value;
    const direction = gradientDirection.value;
    const color1 = gradientColor1.value;
    const color2 = gradientColor2.value;
    let gradientValue = '';

    if (type === 'linear') {
        gradientValue = `linear-gradient(${direction}, ${color1}, ${color2})`;
    } else {
        gradientValue = `radial-gradient(circle, ${color1}, ${color2})`;
    }

    gradientPreview.style.background = gradientValue;
    gradientCssOutput.textContent = `background: ${gradientValue};`;
}

function copyGradientCss() {
    navigator.clipboard.writeText(gradientCssOutput.textContent);
}

gradientType.addEventListener('change', buildGradient);
gradientDirection.addEventListener('change', buildGradient);
gradientColor1.addEventListener('input', buildGradient);
gradientColor2.addEventListener('input', buildGradient);
copyGradientButton.addEventListener('click', copyGradientCss);

// --- Email Collection Modal ---
const emailModal = document.getElementById('email-modal');
const closeModal = document.querySelector('.close-modal');
const emailSignupForm = document.getElementById('email-signup-form');
const signupEmail = document.getElementById('signup-email');

// Show modal after 30 seconds or when user copies gradient
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
                source: 'gradient_tool',
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
copyGradientButton.addEventListener('click', () => showEmailModal('copy'));

buildGradient();
