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
            tag: 'antonym_finder',
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

    // Antonym dictionary
    const antonymDict = {
        'happy': ['sad', 'unhappy', 'miserable', 'depressed', 'sorrowful'],
        'sad': ['happy', 'joyful', 'cheerful', 'delighted', 'glad'],
        'fast': ['slow', 'sluggish', 'leisurely', 'gradual', 'unhurried'],
        'slow': ['fast', 'quick', 'swift', 'rapid', 'speedy'],
        'big': ['small', 'tiny', 'little', 'miniature', 'compact'],
        'small': ['big', 'large', 'huge', 'enormous', 'vast'],
        'beautiful': ['ugly', 'unattractive', 'unsightly', 'hideous', 'grotesque'],
        'ugly': ['beautiful', 'lovely', 'attractive', 'gorgeous', 'stunning'],
        'good': ['bad', 'poor', 'terrible', 'awful', 'horrible'],
        'bad': ['good', 'excellent', 'great', 'superb', 'fine'],
        'smart': ['stupid', 'dumb', 'foolish', 'ignorant', 'dim-witted'],
        'stupid': ['smart', 'intelligent', 'clever', 'bright', 'wise'],
        'strong': ['weak', 'feeble', 'fragile', 'delicate', 'frail'],
        'weak': ['strong', 'powerful', 'mighty', 'robust', 'sturdy'],
        'help': ['hinder', 'obstruct', 'block', 'impede', 'prevent'],
        'hurt': ['heal', 'soothe', 'comfort', 'ease', 'relieve'],
        'love': ['hate', 'despise', 'detest', 'loathe', 'abhor'],
        'hate': ['love', 'adore', 'cherish', 'treasure', 'like'],
        'like': ['dislike', 'hate', 'despise', 'detest', 'loathe'],
        'hot': ['cold', 'cool', 'chilly', 'frigid', 'frosty'],
        'cold': ['hot', 'warm', 'heated', 'sweltering', 'scorching'],
        'light': ['dark', 'dim', 'dull', 'murky', 'shadowy'],
        'dark': ['light', 'bright', 'luminous', 'radiant', 'glowing'],
        'hard': ['soft', 'tender', 'gentle', 'flexible', 'supple'],
        'soft': ['hard', 'rigid', 'stiff', 'solid', 'firm'],
        'easy': ['difficult', 'hard', 'challenging', 'tough', 'complicated'],
        'difficult': ['easy', 'simple', 'straightforward', 'effortless', 'plain'],
        'clean': ['dirty', 'unclean', 'filthy', 'messy', 'soiled'],
        'dirty': ['clean', 'pure', 'spotless', 'immaculate', 'pristine'],
        'rich': ['poor', 'broke', 'penniless', 'impoverished', 'destitute'],
        'poor': ['rich', 'wealthy', 'affluent', 'prosperous', 'flourishing'],
        'young': ['old', 'aged', 'elderly', 'ancient', 'senile'],
        'old': ['young', 'new', 'youthful', 'fresh', 'modern'],
        'new': ['old', 'ancient', 'aged', 'used', 'worn'],
        'start': ['end', 'finish', 'stop', 'conclude', 'terminate'],
        'end': ['start', 'begin', 'commence', 'initiate', 'launch'],
        'success': ['failure', 'defeat', 'fiasco', 'miscarriage', 'collapse'],
        'failure': ['success', 'triumph', 'victory', 'achievement', 'accomplishment'],
        'calm': ['agitated', 'excited', 'anxious', 'turbulent', 'restless'],
        'excited': ['calm', 'bored', 'apathetic', 'indifferent', 'uninterested'],
        'brave': ['cowardly', 'timid', 'fearful', 'craven', 'chickenhearted'],
        'cowardly': ['brave', 'courageous', 'valiant', 'intrepid', 'fearless'],
        'honest': ['dishonest', 'deceitful', 'deceptive', 'false', 'lying'],
        'dishonest': ['honest', 'truthful', 'sincere', 'candid', 'frank']
    };

    const inputWord = document.getElementById('input-word');
    const resultsContainer = document.getElementById('results-container');

    if (!inputWord || !resultsContainer) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Find antonyms
    window.findAntonyms = () => {
        const input = inputWord.value.trim().toLowerCase();

        if (input.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">Enter a word to find antonyms</div>';
            trackEvent('antonym_search', { input: input, resultCount: 0 });
            return;
        }

        let antonyms = antonymDict[input] || [];

        if (antonyms.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">No antonyms found for "' + input.toUpperCase() + '"</div>';
            trackEvent('antonym_search', { input: input, resultCount: 0 });
            return;
        }

        let html = '<div class="results-label">' + antonyms.length + ' antonym' + (antonyms.length !== 1 ? 's' : '') + ' found</div>';
        html += '<div class="results-grid">';
        antonyms.forEach(word => {
            html += '<div class="result-pill" onclick="copyAntonym(\'' + word + '\')">' + word.toUpperCase() + '</div>';
        });
        html += '</div>';

        resultsContainer.innerHTML = html;
        trackEvent('antonym_search', { input: input, resultCount: antonyms.length });
    };

    // Copy antonym
    window.copyAntonym = (word) => {
        navigator.clipboard.writeText(word).then(() => {
            const pills = document.querySelectorAll('.result-pill');
            pills.forEach(pill => {
                if (pill.textContent.toUpperCase() === word.toUpperCase()) {
                    pill.classList.add('copied');
                    setTimeout(() => pill.classList.remove('copied'), 600);
                }
            });
            trackEvent('antonym_copied', { word: word });
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Clear results
    window.clearResults = () => {
        inputWord.value = '';
        resultsContainer.innerHTML = '';
        inputWord.focus();
        trackEvent('antonym_cleared');
    };

    // Allow search on Enter key
    inputWord.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') findAntonyms();
    });
});
