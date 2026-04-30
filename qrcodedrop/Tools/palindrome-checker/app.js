document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (e) {
        console.log('Lucide error (non-critical):', e);
    }

    // Analytics tracking
    function trackEvent(eventType, details = {}) {
        const data = {
            timestamp: new Date().toISOString(),
            event: eventType,
            tag: 'palindrome_checker',
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            details: details
        };

        fetch('https://knotstranded.com/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true
        }).catch(err => console.log('Analytics error:', err));
    }

    trackEvent('page_load');

    const inputText = document.getElementById('input-text');
    const resultsContainer = document.getElementById('results-container');

    if (!inputText || !resultsContainer) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Check if palindrome
    window.checkPalindrome = () => {
        const input = inputText.value.trim();

        if (input.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">Enter text to check if it\'s a palindrome</div>';
            trackEvent('palindrome_check', { input: '', isPalindrome: false });
            return;
        }

        // Remove spaces and special characters, convert to lowercase
        const clean = input.toLowerCase().replace(/[^a-z0-9]/g, '');
        const reversed = clean.split('').reverse().join('');
        const isPalindrome = clean === reversed;

        let html = '<div class="result-box">';
        if (isPalindrome) {
            html += '<div class="result-status yes">✓ YES!</div>';
            html += '<div class="result-text">"' + input + '" is a palindrome</div>';
        } else {
            html += '<div class="result-status no">✗ NO</div>';
            html += '<div class="result-text">"' + input + '" is not a palindrome</div>';
        }
        html += '<div class="result-reversed"><strong>Clean text:</strong> ' + clean + '<br><strong>Reversed:</strong> ' + reversed + '</div>';
        html += '</div>';

        resultsContainer.innerHTML = html;
        trackEvent('palindrome_check', { input: input, isPalindrome: isPalindrome, length: clean.length });
    };

    // Clear results
    window.clearResults = () => {
        inputText.value = '';
        resultsContainer.innerHTML = '';
        inputText.focus();
        trackEvent('palindrome_cleared');
    };

    // Allow check on Enter key
    inputText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPalindrome();
    });

    // Auto-check on input for instant feedback
    inputText.addEventListener('input', checkPalindrome);
});
