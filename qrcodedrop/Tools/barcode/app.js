const barcodeValue = document.getElementById('barcode-value');
const barcodeFormat = document.getElementById('barcode-format');
const barcodeScale = document.getElementById('barcode-scale');
const barcodeScaleValue = document.getElementById('barcode-scale-value');
const barcodeHeight = document.getElementById('barcode-height');
const barcodeHeightValue = document.getElementById('barcode-height-value');
const generateButton = document.getElementById('btn-generate-barcode');
const downloadButton = document.getElementById('btn-download-barcode');
const barcodeError = document.getElementById('barcode-error');
const barcodeCanvas = document.getElementById('barcode-canvas');

// Wait for both DOM and scripts to load
window.addEventListener('load', function() {
    // Check if bwipjs is loaded, if not, wait a bit more
    if (typeof bwipjs === 'undefined') {
        setTimeout(function() {
            if (typeof bwipjs === 'undefined') {
                console.error('BWIPJS library failed to load');
                barcodeError.textContent = 'Barcode library failed to load. Please refresh the page.';
                return;
            }
            initializeBarcodeGenerator();
        }, 2000);
    } else {
        initializeBarcodeGenerator();
    }
});

function initializeBarcodeGenerator() {
    // Set up event listeners
    barcodeScale.addEventListener('input', () => {
        barcodeScaleValue.textContent = barcodeScale.value;
        renderBarcode();
    });

    barcodeHeight.addEventListener('input', () => {
        barcodeHeightValue.textContent = barcodeHeight.value;
        renderBarcode();
    });

    generateButton.addEventListener('click', renderBarcode);
    barcodeFormat.addEventListener('change', renderBarcode);
    barcodeValue.addEventListener('input', renderBarcode);
    downloadButton.addEventListener('click', downloadBarcode);

    // Initial render
    renderBarcode();
}

function renderBarcode() {
    // Check if bwipjs is loaded
    if (typeof bwipjs === 'undefined') {
        barcodeError.textContent = 'Barcode library is not loaded.';
        return;
    }

    const value = barcodeValue.value.trim();
    const format = barcodeFormat.value;
    const scale = parseInt(barcodeScale.value, 10);
    const height = parseInt(barcodeHeight.value, 10);
    barcodeError.textContent = '';

    try {
        bwipjs.toCanvas(barcodeCanvas, {
            bcid: format,
            text: value,
            scale: scale,
            height: height,
            includetext: true,
            textxalign: 'center',
            backgroundcolor: 'FFFFFF'
        });
    } catch (err) {
        console.error('BWIPJS error:', err);
        barcodeError.textContent = err.message || 'Unable to generate barcode for this value.';
    }
}

function downloadBarcode() {
    barcodeCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'barcode.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// --- Email Collection Modal ---
const emailModal = document.getElementById('email-modal');
const closeModal = document.querySelector('.close-modal');
const emailSignupForm = document.getElementById('email-signup-form');
const signupEmail = document.getElementById('signup-email');

// Show modal after 30 seconds or when user tries to download
let modalShown = false;
setTimeout(() => {
    if (!modalShown) {
        emailModal.style.display = 'block';
        modalShown = true;
    }
}, 30000);

// Show modal on download action
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
                source: 'barcode_tool',
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

// Attach modal trigger to download button
downloadButton.addEventListener('click', () => showEmailModal('download'));

renderBarcode();
