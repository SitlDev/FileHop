const hexInput = document.getElementById('color-hex');
const rgbInput = document.getElementById('color-rgb');
const hslInput = document.getElementById('color-hsl');
const preview = document.getElementById('color-preview');
const copyButton = document.getElementById('btn-copy-css');
const feedback = document.getElementById('copy-feedback');

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function padHex(value) {
    return value.length === 1 ? `0${value}` : value;
}

function rgbToHex(r, g, b) {
    return `#${padHex(r.toString(16))}${padHex(g.toString(16))}${padHex(b.toString(16))}`;
}

function hexToRgb(hex) {
    const cleaned = hex.replace('#', '');
    if (cleaned.length !== 6) return null;
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function parseRgb(value) {
    const parts = value.split(',').map(part => parseInt(part.trim(), 10));
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return {
        r: clamp(parts[0], 0, 255),
        g: clamp(parts[1], 0, 255),
        b: clamp(parts[2], 0, 255)
    };
}

function parseHsl(value) {
    const parts = value.split(',').map(part => part.trim().replace('%', ''));
    if (parts.length !== 3) return null;
    const h = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    const l = parseInt(parts[2], 10);
    if (isNaN(h) || isNaN(s) || isNaN(l)) return null;
    return {
        h: ((h % 360) + 360) % 360,
        s: clamp(s, 0, 100),
        l: clamp(l, 0, 100)
    };
}

function updateFromHex() {
    const hex = hexInput.value.trim();
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    rgbInput.value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    hslInput.value = `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;
    preview.style.background = hex;
}

function updateFromRgb() {
    const rgb = parseRgb(rgbInput.value);
    if (!rgb) return;
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hexInput.value = hex;
    hslInput.value = `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;
    preview.style.background = hex;
}

function updateFromHsl() {
    const hsl = parseHsl(hslInput.value);
    if (!hsl) return;
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    hexInput.value = hex;
    rgbInput.value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    preview.style.background = hex;
}

function copyCss() {
    const css = `background-color: ${hexInput.value.trim()};`;
    navigator.clipboard.writeText(css).then(() => {
        feedback.textContent = 'CSS copied to clipboard!';
        setTimeout(() => { feedback.textContent = ''; }, 2000);
    });
}

hexInput.addEventListener('input', updateFromHex);
rgbInput.addEventListener('input', updateFromRgb);
hslInput.addEventListener('input', updateFromHsl);
copyButton.addEventListener('click', copyCss);

// --- Email Collection Modal ---
const emailModal = document.getElementById('email-modal');
const closeModal = document.querySelector('.close-modal');
const emailSignupForm = document.getElementById('email-signup-form');
const signupEmail = document.getElementById('signup-email');

// Show modal after 30 seconds or when user copies CSS
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
                source: 'color_tool',
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

updateFromHex();
