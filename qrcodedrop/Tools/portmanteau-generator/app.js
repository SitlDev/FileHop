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
            tag: 'portmanteau_generator',
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

    const word1Input = document.getElementById('word1');
    const word2Input = document.getElementById('word2');
    const resultsContainer = document.getElementById('results-container');

    if (!word1Input || !word2Input || !resultsContainer) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Generate various blend combinations
    function generateBlends(word1, word2) {
        const blends = [];

        // Strategy 1: Beginning of word1 + end of word2
        for (let i = 1; i < Math.min(word1.length, 4); i++) {
            for (let j = Math.max(1, word2.length - 3); j < word2.length; j++) {
                const blend = word1.substring(0, i) + word2.substring(j);
                if (blend.length >= 4 && blend.length <= 12) {
                    blends.push({ portmanteau: blend, description: word1.substring(0, i) + ' + ' + word2.substring(j) });
                }
            }
        }

        // Strategy 2: Beginning of word2 + end of word1
        for (let i = 1; i < Math.min(word2.length, 4); i++) {
            for (let j = Math.max(1, word1.length - 3); j < word1.length; j++) {
                const blend = word2.substring(0, i) + word1.substring(j);
                if (blend.length >= 4 && blend.length <= 12) {
                    blends.push({ portmanteau: blend, description: word2.substring(0, i) + ' + ' + word1.substring(j) });
                }
            }
        }

        // Strategy 3: Overlapping letters
        for (let i = 1; i <= Math.min(word1.length, word2.length); i++) {
            if (word1.substring(word1.length - i) === word2.substring(0, i)) {
                const blend = word1 + word2.substring(i);
                if (blend.length >= 4 && blend.length <= 12) {
                    blends.push({ portmanteau: blend, description: 'overlap at "' + word1.substring(word1.length - i) + '"' });
                }
            }
        }

        // Strategy 4: Simple combinations
        const simple1 = word1.substring(0, Math.ceil(word1.length / 2)) + word2.substring(Math.ceil(word2.length / 2));
        if (simple1.length >= 4 && simple1.length <= 12) {
            blends.push({ portmanteau: simple1, description: 'first half + second half' });
        }

        const simple2 = word2.substring(0, Math.ceil(word2.length / 2)) + word1.substring(Math.ceil(word1.length / 2));
        if (simple2.length >= 4 && simple2.length <= 12) {
            blends.push({ portmanteau: simple2, description: 'first half + second half (reversed)' });
        }

        // Remove duplicates
        const unique = [];
        const seen = new Set();
        for (const blend of blends) {
            if (!seen.has(blend.portmanteau)) {
                seen.add(blend.portmanteau);
                unique.push(blend);
            }
        }

        return unique.slice(0, 12); // Return top 12 suggestions
    }

    // Generate portmanteau suggestions
    window.generatePortmanteau = () => {
        let word1 = word1Input.value.trim().toLowerCase();
        let word2 = word2Input.value.trim().toLowerCase();

        if (!word1 || !word2) {
            resultsContainer.innerHTML = '<div class="empty-state">Enter both words to generate blends</div>';
            trackEvent('portmanteau_generated', { success: false });
            return;
        }

        const suggestions = generateBlends(word1, word2);

        if (suggestions.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">Try different words for better blends</div>';
            trackEvent('portmanteau_generated', { word1, word2, success: false });
            return;
        }

        let html = '<div class="results-label">' + suggestions.length + ' blend' + (suggestions.length !== 1 ? 's' : '') + ' generated</div>';
        html += '<div class="results-grid">';
        suggestions.forEach(blend => {
            html += '<div class="result-pill" onclick="copyBlend(\'' + blend.portmanteau + '\')">' +
                    '<div class="word">' + blend.portmanteau.toUpperCase() + '</div>' +
                    '<div class="blend">(' + blend.description + ')</div>' +
                    '</div>';
        });
        html += '</div>';

        resultsContainer.innerHTML = html;
        trackEvent('portmanteau_generated', { word1, word2, count: suggestions.length, success: true });
    };

    // Copy blend
    window.copyBlend = (word) => {
        navigator.clipboard.writeText(word).then(() => {
            const pills = document.querySelectorAll('.result-pill');
            pills.forEach(pill => {
                if (pill.querySelector('.word').textContent.toUpperCase() === word.toUpperCase()) {
                    pill.classList.add('copied');
                    setTimeout(() => pill.classList.remove('copied'), 600);
                }
            });
            trackEvent('blend_copied', { word: word });
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Clear results
    window.clearResults = () => {
        word1Input.value = '';
        word2Input.value = '';
        resultsContainer.innerHTML = '';
        word1Input.focus();
        trackEvent('portmanteau_cleared');
    };

    // Allow generation on Enter key
    word2Input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generatePortmanteau();
    });
});
