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
            tag: 'synonym_finder',
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

    // Synonym dictionary
    const synonymDict = {
        'happy': ['joyful', 'cheerful', 'delighted', 'glad', 'pleased', 'content', 'blissful', 'elated', 'merry', 'upbeat', 'jolly', 'grinning'],
        'sad': ['unhappy', 'sorrowful', 'depressed', 'miserable', 'gloomy', 'melancholy', 'doleful', 'downcast', 'dejected', 'morose'],
        'fast': ['quick', 'swift', 'rapid', 'speedy', 'hasty', 'brisk', 'fleet', 'meteoric', 'lightning-fast', 'accelerated'],
        'slow': ['sluggish', 'leisurely', 'gradual', 'unhurried', 'dawdling', 'lagging', 'plodding', 'lingering', 'snail-paced', 'torpid'],
        'big': ['large', 'huge', 'enormous', 'vast', 'gigantic', 'immense', 'massive', 'colossal', 'tremendous', 'whopping'],
        'small': ['tiny', 'little', 'miniature', 'compact', 'petite', 'minuscule', 'diminutive', 'undersized', 'puny', 'modest'],
        'beautiful': ['lovely', 'attractive', 'gorgeous', 'stunning', 'pretty', 'handsome', 'elegant', 'radiant', 'striking', 'fetching'],
        'ugly': ['unattractive', 'unsightly', 'hideous', 'grotesque', 'repulsive', 'disfigured', 'homely', 'plain', 'unpleasant', 'ghastly'],
        'good': ['excellent', 'great', 'superb', 'fine', 'wonderful', 'outstanding', 'exceptional', 'quality', 'admirable', 'splendid'],
        'bad': ['poor', 'terrible', 'awful', 'horrible', 'dreadful', 'abysmal', 'pathetic', 'mediocre', 'inferior', 'wretched'],
        'smart': ['intelligent', 'clever', 'bright', 'wise', 'knowledgeable', 'astute', 'shrewd', 'insightful', 'brilliant', 'keen'],
        'stupid': ['dumb', 'foolish', 'ignorant', 'dim-witted', 'silly', 'witless', 'dense', 'obtuse', 'idiotic', 'moronic'],
        'strong': ['powerful', 'mighty', 'robust', 'sturdy', 'muscular', 'vigorous', 'forceful', 'potent', 'resilient', 'stalwart'],
        'weak': ['feeble', 'fragile', 'delicate', 'frail', 'vulnerable', 'powerless', 'helpless', 'brittle', 'rickety', 'flimsy'],
        'help': ['assist', 'aid', 'support', 'facilitate', 'enable', 'benefit', 'serve', 'cooperate', 'contribute', 'promote'],
        'hurt': ['injure', 'harm', 'damage', 'wound', 'pain', 'ache', 'afflict', 'torment', 'distress', 'sting'],
        'love': ['adore', 'cherish', 'treasure', 'affection', 'devotion', 'fondness', 'care', 'passion', 'admiration', 'attachment'],
        'hate': ['despise', 'detest', 'loathe', 'abhor', 'dislike', 'resent', 'condemn', 'scorn', 'revile', 'execrate'],
        'like': ['enjoy', 'prefer', 'fancy', 'appreciate', 'favor', 'approve', 'admire', 'relish', 'savor', 'delight'],
        'see': ['observe', 'watch', 'view', 'witness', 'notice', 'spot', 'perceive', 'behold', 'look', 'gaze'],
        'think': ['believe', 'suppose', 'assume', 'consider', 'reflect', 'reason', 'contemplate', 'ponder', 'muse', 'speculate'],
        'say': ['speak', 'tell', 'utter', 'mention', 'state', 'declare', 'remark', 'express', 'comment', 'note'],
        'go': ['leave', 'depart', 'travel', 'move', 'proceed', 'advance', 'venture', 'traverse', 'journey', 'migrate'],
        'come': ['arrive', 'approach', 'enter', 'return', 'appear', 'materialize', 'show', 'visit', 'attend', 'join'],
        'give': ['provide', 'offer', 'grant', 'award', 'donate', 'contribute', 'present', 'bestow', 'hand', 'deliver'],
        'take': ['grab', 'seize', 'capture', 'obtain', 'acquire', 'receive', 'steal', 'claim', 'assume', 'require']
    };

    const inputWord = document.getElementById('input-word');
    const resultsContainer = document.getElementById('results-container');

    if (!inputWord || !resultsContainer) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Find synonyms
    window.findSynonyms = () => {
        const input = inputWord.value.trim().toLowerCase();

        if (input.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">Enter a word to find synonyms</div>';
            trackEvent('synonym_search', { input: input, resultCount: 0 });
            return;
        }

        let synonyms = synonymDict[input] || [];

        if (synonyms.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">No synonyms found for "' + input.toUpperCase() + '"</div>';
            trackEvent('synonym_search', { input: input, resultCount: 0 });
            return;
        }

        let html = '<div class="results-label">' + synonyms.length + ' synonym' + (synonyms.length !== 1 ? 's' : '') + ' found</div>';
        html += '<div class="results-grid">';
        synonyms.forEach(word => {
            html += '<div class="result-pill" onclick="copySynonym(\'' + word + '\')">' + word.toUpperCase() + '</div>';
        });
        html += '</div>';

        resultsContainer.innerHTML = html;
        trackEvent('synonym_search', { input: input, resultCount: synonyms.length });
    };

    // Copy synonym
    window.copySynonym = (word) => {
        navigator.clipboard.writeText(word).then(() => {
            const pills = document.querySelectorAll('.result-pill');
            pills.forEach(pill => {
                if (pill.textContent.toUpperCase() === word.toUpperCase()) {
                    pill.classList.add('copied');
                    setTimeout(() => pill.classList.remove('copied'), 600);
                }
            });
            trackEvent('synonym_copied', { word: word });
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Clear results
    window.clearResults = () => {
        inputWord.value = '';
        resultsContainer.innerHTML = '';
        inputWord.focus();
        trackEvent('synonym_cleared');
    };

    // Allow search on Enter key
    inputWord.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') findSynonyms();
    });
});
