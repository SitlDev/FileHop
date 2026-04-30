const uuidFormat = document.getElementById('uuid-format');
const uuidCount = document.getElementById('uuid-count');
const uuidUppercase = document.getElementById('uuid-uppercase');
const uuidBrackets = document.getElementById('uuid-brackets');
const generateButton = document.getElementById('btn-generate-uuid');
const copyButton = document.getElementById('btn-copy-uuid');
const uuidOutput = document.getElementById('uuid-output');

// Generate UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Generate GUID (same as UUID v4)
function generateGUID() {
    return generateUUID();
}

function generateUUIDs() {
    const format = uuidFormat.value;
    const count = Math.min(Math.max(parseInt(uuidCount.value, 10) || 1, 1), 100);
    const uppercase = uuidUppercase.checked;
    const brackets = uuidBrackets.checked;

    const ids = [];

    for (let i = 0; i < count; i++) {
        let id = format === 'guid' ? generateGUID() : generateUUID();

        if (uppercase) {
            id = id.toUpperCase();
        }

        if (brackets) {
            id = `{${id}}`;
        }

        ids.push(id);
    }

    uuidOutput.value = ids.join('\n');
}

function copyUUIDs() {
    const text = uuidOutput.value.trim();
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
generateButton.addEventListener('click', generateUUIDs);
copyButton.addEventListener('click', copyUUIDs);
uuidFormat.addEventListener('change', generateUUIDs);
uuidCount.addEventListener('input', generateUUIDs);
uuidUppercase.addEventListener('change', generateUUIDs);
uuidBrackets.addEventListener('change', generateUUIDs);

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
                source: 'uuid_tool',
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
generateUUIDs();