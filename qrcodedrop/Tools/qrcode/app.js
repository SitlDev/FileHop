/**
 * QR Code Generator
 * Simple and clean QR code creation tool
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    try {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (e) {
        console.log('Lucide error (non-critical):', e);
    }

    // --- Analytics Tracking ---
    function trackEvent(eventType, details = {}) {
        const data = {
            timestamp: new Date().toISOString(),
            event: eventType,
            tag: 'qrcodegen',
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            details: details
        };

        fetch('https://knotstranded.com/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            // Don't wait for response to avoid blocking UI
            keepalive: true
        }).catch(err => console.log('Analytics error:', err));
    }

    // Track page load
    trackEvent('page_load');

    // --- QR-Code-Styling Instance ---
    const qrCode = new QRCodeStyling({
        width: 256,
        height: 256,
        type: "canvas",
        data: "https://example.com",
        dotsOptions: { color: "#000000", type: "square" },
        backgroundOptions: { color: "#ffffff" },
        imageOptions: { crossOrigin: "anonymous", margin: 10 }
    });

    // --- DOM Elements ---
    const qrTypeSelect = document.getElementById('qr-type-select');
    const urlForm = document.getElementById('url-form');
    const emailForm = document.getElementById('email-form');
    const phoneForm = document.getElementById('phone-form');
    const contactForm = document.getElementById('contact-form');
    const calendarForm = document.getElementById('calendar-form');
    const socialForm = document.getElementById('social-form');
    const dynamicForm = document.getElementById('dynamic-form');
    const wifiForm = document.getElementById('wifi-form');
    
    const inputUrl = document.getElementById('input-url');
    const inputEmail = document.getElementById('input-email');
    const inputEmailSubject = document.getElementById('input-email-subject');
    const inputEmailBody = document.getElementById('input-email-body');
    const inputPhone = document.getElementById('input-phone');
    const inputContactName = document.getElementById('input-contact-name');
    const inputContactPhone = document.getElementById('input-contact-phone');
    const inputContactEmail = document.getElementById('input-contact-email');
    const inputContactOrg = document.getElementById('input-contact-org');
    const inputContactUrl = document.getElementById('input-contact-url');
    const inputEventTitle = document.getElementById('input-event-title');
    const inputEventStart = document.getElementById('input-event-start');
    const inputEventEnd = document.getElementById('input-event-end');
    const inputEventLocation = document.getElementById('input-event-location');
    const inputEventDesc = document.getElementById('input-event-desc');
    const inputSocialPlatform = document.getElementById('input-social-platform');
    const inputSocialHandle = document.getElementById('input-social-handle');
    const inputSocialCustom = document.getElementById('input-social-custom');
    const inputDynamicData = document.getElementById('input-dynamic-data');
    const inputDynamicRedirect = document.getElementById('input-dynamic-redirect');
    const btnGenerateShareable = document.getElementById('btn-generate-shareable');
    const btnCopyShareable = document.getElementById('btn-copy-shareable');
    const shareableLinkContainer = document.getElementById('shareable-link-container');
    const shareableLinkOutput = document.getElementById('shareable-link-output');
    const inputSsid = document.getElementById('input-ssid');
    const inputPassword = document.getElementById('input-password');
    const inputEncryption = document.getElementById('input-encryption');
    
    const configFg = document.getElementById('config-fg');
    const configBg = document.getElementById('config-bg');
    const configSize = document.getElementById('config-size');
    const sizeVal = document.getElementById('size-val');
    const btnDownloadPng = document.getElementById('btn-download-png');
    const btnCopy = document.getElementById('btn-copy');
    const qrCanvasContainer = document.getElementById('code-output');

    // Append QR code to container
    qrCode.append(qrCanvasContainer);

    // --- Form Switching ---
    function showForm(type) {
        urlForm.style.display = 'none';
        emailForm.style.display = 'none';
        phoneForm.style.display = 'none';
        contactForm.style.display = 'none';
        calendarForm.style.display = 'none';
        socialForm.style.display = 'none';
        dynamicForm.style.display = 'none';
        wifiForm.style.display = 'none';
        
        switch(type) {
            case 'url':
                urlForm.style.display = 'block';
                break;
            case 'email':
                emailForm.style.display = 'block';
                break;
            case 'phone':
                phoneForm.style.display = 'block';
                break;
            case 'contact':
                contactForm.style.display = 'block';
                break;
            case 'calendar':
                calendarForm.style.display = 'block';
                break;
            case 'social':
                socialForm.style.display = 'block';
                break;
            case 'dynamic':
                dynamicForm.style.display = 'block';
                break;
            case 'wifi':
                wifiForm.style.display = 'block';
                break;
        }
    }
    
    qrTypeSelect.addEventListener('change', () => {
        const selectedType = qrTypeSelect.value;
        trackEvent('qr_type_change', { type: selectedType });
        showForm(selectedType);
        updateQRData();
    });

    // --- Event Listeners ---

    // Update QR data on input changes
    inputUrl.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'url', value: inputUrl.value });
    });
    
    inputEmail.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'email', value: inputEmail.value });
    });
    inputEmailSubject.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'email', field: 'subject' });
    });
    inputEmailBody.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'email', field: 'body' });
    });
    
    inputPhone.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'phone', value: inputPhone.value });
    });
    
    inputContactName.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'contact', field: 'name' });
    });
    inputContactPhone.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'contact', field: 'phone' });
    });
    inputContactEmail.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'contact', field: 'email' });
    });
    inputContactOrg.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'contact', field: 'org' });
    });
    inputContactUrl.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'contact', field: 'url' });
    });
    
    inputEventTitle.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'calendar', field: 'title' });
    });
    inputEventStart.addEventListener('change', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'calendar', field: 'start' });
    });
    inputEventEnd.addEventListener('change', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'calendar', field: 'end' });
    });
    inputEventLocation.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'calendar', field: 'location' });
    });
    inputEventDesc.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'calendar', field: 'description' });
    });
    
    inputSocialPlatform.addEventListener('change', () => {
        const platform = inputSocialPlatform.value;
        inputSocialCustom.style.display = platform === 'custom' ? 'block' : 'none';
        updateQRData();
        trackEvent('qr_data_change', { type: 'social', field: 'platform', value: platform });
    });
    
    inputSocialHandle.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'social', field: 'handle' });
    });
    
    inputSocialCustom.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'social', field: 'custom' });
    });
    
    inputDynamicData.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'dynamic', field: 'data' });
    });
    
    inputDynamicRedirect.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'dynamic', field: 'redirect' });
    });
    
    btnGenerateShareable.addEventListener('click', () => {
        const currentData = inputDynamicData.value;
        if (!currentData) {
            alert('Please enter content for the QR code first');
            return;
        }
        const encodedData = encodeURIComponent(currentData);
        const currentUrl = window.location.origin + window.location.pathname;
        const shareableUrl = `${currentUrl}?qrdata=${encodedData}`;
        shareableLinkOutput.value = shareableUrl;
        shareableLinkContainer.style.display = 'block';
        trackEvent('dynamic_qr_link_generated', { contentLength: currentData.length });
    });
    
    btnCopyShareable.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(shareableLinkOutput.value);
            alert('Shareable link copied to clipboard!');
            trackEvent('dynamic_qr_link_copied');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Copy failed. Try selecting and copying manually.');
        }
    });
    
    inputSsid.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'wifi', field: 'ssid', value: inputSsid.value });
    });
    inputPassword.addEventListener('input', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'wifi', field: 'password' });
    });
    inputEncryption.addEventListener('change', () => {
        updateQRData();
        trackEvent('qr_data_change', { type: 'wifi', field: 'encryption', value: inputEncryption.value });
    });

    // Update foreground color
    configFg.addEventListener('input', (e) => {
        qrCode.update({ dotsOptions: { color: e.target.value } });
        trackEvent('color_change', { type: 'foreground', color: e.target.value });
    });

    // Update background color
    configBg.addEventListener('input', (e) => {
        qrCode.update({ backgroundOptions: { color: e.target.value } });
        trackEvent('color_change', { type: 'background', color: e.target.value });
    });

    // Update size
    configSize.addEventListener('input', (e) => {
        const size = parseInt(e.target.value);
        sizeVal.textContent = size;
        qrCode.update({ width: size, height: size });
        trackEvent('size_change', { size: size });
    });

    // Download PNG
    btnDownloadPng.addEventListener('click', () => {
        qrCode.download({ name: "qr-code", extension: "png" });
    });

    // Copy to clipboard
    btnCopy.addEventListener('click', async () => {
        try {
            const canvas = qrCanvasContainer.querySelector('canvas');
            if (canvas) {
                canvas.toBlob(async (blob) => {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    alert('QR code copied to clipboard!');
                });
            }
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Copy failed. Try downloading instead.');
        }
    });

    // --- Functions ---
    
    // Generate vCard format for contact
    function generateVCard() {
        const name = inputContactName.value || 'Contact';
        const phone = inputContactPhone.value;
        const email = inputContactEmail.value;
        const org = inputContactOrg.value;
        const url = inputContactUrl.value;
        
        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        vcard += `FN:${name}\n`;
        if (phone) vcard += `TEL:${phone}\n`;
        if (email) vcard += `EMAIL:${email}\n`;
        if (org) vcard += `ORG:${org}\n`;
        if (url) vcard += `URL:${url}\n`;
        vcard += 'END:VCARD';
        
        return vcard;
    }
    
    // Generate iCal format for event
    function generateiCal() {
        const title = inputEventTitle.value || 'Event';
        const start = inputEventStart.value;
        const end = inputEventEnd.value;
        const location = inputEventLocation.value;
        const desc = inputEventDesc.value;
        
        // Convert datetime-local to UTC format (YYYYMMDDTHHMMSSZ)
        const formatDateTime = (dt) => {
            if (!dt) return '';
            return dt.replace(/[-:]/g, '').replace('T', 'T') + 'Z';
        };
        
        let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\n';
        ical += 'PRODID:-//QR Code Generator//EN\n';
        ical += 'BEGIN:VEVENT\n';
        ical += `SUMMARY:${title}\n`;
        if (start) ical += `DTSTART:${formatDateTime(start)}\n`;
        if (end) ical += `DTEND:${formatDateTime(end)}\n`;
        if (location) ical += `LOCATION:${location}\n`;
        if (desc) ical += `DESCRIPTION:${desc}\n`;
        ical += 'END:VEVENT\n';
        ical += 'END:VCALENDAR';
        
        return ical;
    }
    
    // Generate social media profile URL
    function generateSocialMediaURL() {
        const platform = inputSocialPlatform.value;
        let handle = inputSocialHandle.value.trim();
        
        if (platform === 'custom') {
            return inputSocialCustom.value || 'https://example.com';
        }
        
        // Remove @ symbol if present
        handle = handle.replace(/^@/, '');
        
        if (!handle) {
            return 'https://example.com';
        }
        
        const socialUrls = {
            'linkedin': `https://linkedin.com/in/${handle}`,
            'twitter': `https://twitter.com/${handle}`,
            'instagram': `https://instagram.com/${handle}`,
            'facebook': `https://facebook.com/${handle}`,
            'tiktok': `https://tiktok.com/@${handle}`,
            'youtube': `https://youtube.com/@${handle}`,
            'github': `https://github.com/${handle}`
        };
        
        return socialUrls[platform] || 'https://example.com';
    }
    
    function updateQRData() {
        const selectedType = qrTypeSelect.value;
        let data = '';
        
        if (selectedType === 'url') {
            data = inputUrl.value || "https://example.com";
        } else if (selectedType === 'email') {
            const email = inputEmail.value;
            if (!email) {
                data = "mailto:example@example.com";
            } else {
                const subject = inputEmailSubject.value;
                const body = inputEmailBody.value;
                data = `mailto:${email}`;
                if (subject || body) {
                    const params = [];
                    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                    if (body) params.push(`body=${encodeURIComponent(body)}`);
                    data += '?' + params.join('&');
                }
            }
        } else if (selectedType === 'phone') {
            const phone = inputPhone.value || '1234567890';
            // Remove non-digit characters except leading +
            const cleanPhone = phone.replace(/[^\d+]/g, '');
            data = `tel:${cleanPhone}`;
        } else if (selectedType === 'contact') {
            data = generateVCard();
        } else if (selectedType === 'calendar') {
            data = generateiCal();
        } else if (selectedType === 'social') {
            data = generateSocialMediaURL();
        } else if (selectedType === 'dynamic') {
            const dynamicData = inputDynamicData.value;
            const redirectUrl = inputDynamicRedirect.value;
            if (redirectUrl) {
                // If a redirect service is provided, encode the data as a query param
                data = `${redirectUrl}?target=${encodeURIComponent(dynamicData)}`;
            } else {
                // Otherwise, use the data directly
                data = dynamicData || 'https://example.com';
            }
        } else if (selectedType === 'wifi') {
            const ssid = inputSsid.value || "MyWiFi";
            const password = inputPassword.value;
            const encryption = inputEncryption.value;
            
            if (encryption === 'nopass') {
                data = `WIFI:S:${ssid};T:${encryption};;`;
            } else {
                data = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
            }
        }
        
        qrCode.update({ data: data });
    }

    // Initial render
    showForm('url');
    updateQRData();

    // --- Email Collection Modal ---
    const emailModal = document.getElementById('email-modal');
    const closeModal = document.querySelector('.close-modal');
    const emailSignupForm = document.getElementById('email-signup-form');
    const signupEmail = document.getElementById('signup-email');

    // Show modal after 30 seconds or when user tries to download/copy
    let modalShown = false;
    setTimeout(() => {
        if (!modalShown) {
            emailModal.style.display = 'block';
            modalShown = true;
            trackEvent('email_modal_shown', { trigger: 'timeout' });
        }
    }, 30000);

    // Show modal on first download/copy action
    function showEmailModal(trigger) {
        if (!modalShown && !localStorage.getItem('email_subscribed')) {
            emailModal.style.display = 'block';
            modalShown = true;
            trackEvent('email_modal_shown', { trigger: trigger });
        }
    }

    // Close modal
    closeModal.addEventListener('click', () => {
        emailModal.style.display = 'none';
        trackEvent('email_modal_closed', { method: 'close_button' });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === emailModal) {
            emailModal.style.display = 'none';
            trackEvent('email_modal_closed', { method: 'outside_click' });
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
                    source: 'qrcode_tool',
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                localStorage.setItem('email_subscribed', 'true');
                emailModal.style.display = 'none';
                alert('Thanks for subscribing! Check your email for confirmation.');
                trackEvent('email_subscribed', { source: 'qrcode_tool' });
            } else {
                alert('There was an error subscribing. Please try again.');
            }
        } catch (error) {
            console.error('Newsletter signup error:', error);
            alert('There was an error subscribing. Please try again.');
        }
    });

    // Attach modal trigger to download and copy buttons
    btnDownloadPng.addEventListener('click', () => showEmailModal('download'));
    btnCopy.addEventListener('click', () => showEmailModal('copy'));

    // --- Check for shareable QR code in URL ---
    function loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const qrData = params.get('qrdata');
        if (qrData) {
            // Auto-select dynamic QR type and populate the data
            qrTypeSelect.value = 'dynamic';
            inputDynamicData.value = decodeURIComponent(qrData);
            showForm('dynamic');
            updateQRData();
            trackEvent('qr_loaded_from_url', { dataLength: qrData.length });
        }
    }
    
    loadFromURL();
});
