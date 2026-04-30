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
            tag: 'homophones_finder',
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

    // Homophones dictionary
    const homophonesDict = {
        'to': ['too', 'two'],
        'too': ['to', 'two'],
        'two': ['to', 'too'],
        'be': ['bee'],
        'bee': ['be'],
        'right': ['write'],
        'write': ['right'],
        'knight': ['night'],
        'night': ['knight'],
        'see': ['sea'],
        'sea': ['see'],
        'red': ['read'],
        'read': ['red'],
        'sun': ['son'],
        'son': ['sun'],
        'hear': ['here'],
        'here': ['hear'],
        'one': ['won'],
        'won': ['one'],
        'for': ['four', 'fore'],
        'four': ['for', 'fore'],
        'fore': ['for', 'four'],
        'made': ['maid'],
        'maid': ['made'],
        'not': ['knot'],
        'knot': ['not'],
        'break': ['brake'],
        'brake': ['break'],
        'know': ['no'],
        'no': ['know'],
        'blue': ['blew'],
        'blew': ['blue'],
        'wear': ['where'],
        'where': ['wear'],
        'buy': ['by', 'bye'],
        'by': ['buy', 'bye'],
        'bye': ['buy', 'by'],
        'mail': ['male'],
        'male': ['mail'],
        'pear': ['pair', 'pare'],
        'pair': ['pear', 'pare'],
        'pare': ['pear', 'pair'],
        'piece': ['peace'],
        'peace': ['piece'],
        'plane': ['plain'],
        'plain': ['plane'],
        'road': ['rode', 'rowed'],
        'rode': ['road', 'rowed'],
        'rowed': ['road', 'rode'],
        'steel': ['steal'],
        'steal': ['steel'],
        'tail': ['tale'],
        'tale': ['tail'],
        'there': ['their', 'they\'re'],
        'their': ['there', 'they\'re'],
        'they\'re': ['there', 'their'],
        'threw': ['through'],
        'through': ['threw'],
        'time': ['thyme'],
        'thyme': ['time'],
        'waste': ['waist'],
        'waist': ['waste'],
        'weather': ['whether'],
        'whether': ['weather'],
        'would': ['wood'],
        'wood': ['would'],
        'you': ['ewe', 'yew'],
        'ewe': ['you', 'yew'],
        'yew': ['you', 'ewe']
    };

    const inputWord = document.getElementById('input-word');
    const resultsContainer = document.getElementById('results-container');

    if (!inputWord || !resultsContainer) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Find homophones
    window.findHomophones = () => {
        const input = inputWord.value.trim().toLowerCase();

        if (input.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">Enter a word to find homophones</div>';
            trackEvent('homophones_search', { input: input, resultCount: 0 });
            return;
        }

        let homophones = homophonesDict[input] || [];

        if (homophones.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">No homophones found for "' + input.toUpperCase() + '"</div>';
            trackEvent('homophones_search', { input: input, resultCount: 0 });
            return;
        }

        let html = '<div class="results-label">' + homophones.length + ' homophone' + (homophones.length !== 1 ? 's' : '') + ' found</div>';
        html += '<div class="results-grid">';
        homophones.forEach(word => {
            html += '<div class="result-pill" onclick="copyHomophone(\'' + word + '\')">' + word.toUpperCase() + '</div>';
        });
        html += '</div>';

        resultsContainer.innerHTML = html;
        trackEvent('homophones_search', { input: input, resultCount: homophones.length });
    };

    // Copy homophone
    window.copyHomophone = (word) => {
        navigator.clipboard.writeText(word).then(() => {
            const pills = document.querySelectorAll('.result-pill');
            pills.forEach(pill => {
                if (pill.textContent.toUpperCase() === word.toUpperCase()) {
                    pill.classList.add('copied');
                    setTimeout(() => pill.classList.remove('copied'), 600);
                }
            });
            trackEvent('homophones_copied', { word: word });
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Clear results
    window.clearResults = () => {
        inputWord.value = '';
        resultsContainer.innerHTML = '';
        inputWord.focus();
        trackEvent('homophones_cleared');
    };

    // Allow search on Enter key
    inputWord.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') findHomophones();
    });
});
