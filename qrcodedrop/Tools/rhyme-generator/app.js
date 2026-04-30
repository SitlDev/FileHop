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
            tag: 'rhyme_generator',
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

    // Rhyme dictionary
    const rhymeDict = {
        'cat': ['bat', 'fat', 'hat', 'mat', 'rat', 'sat', 'vat', 'chat', 'flat', 'that', 'brat', 'spat', 'stat', 'scat'],
        'dog': ['bog', 'cog', 'fog', 'hog', 'jog', 'log', 'smog', 'clog', 'frog', 'slog'],
        'moon': ['boon', 'croon', 'goon', 'loon', 'noon', 'soon', 'spoon', 'swoon', 'tune', 'june', 'dune', 'prune'],
        'love': ['above', 'dove', 'glove', 'shove', 'thereof', 'hereof'],
        'heart': ['art', 'cart', 'dart', 'part', 'smart', 'start', 'apart', 'depart'],
        'night': ['bite', 'bright', 'fight', 'flight', 'height', 'kite', 'light', 'might', 'right', 'sight', 'tight', 'white', 'blight', 'fright', 'plight', 'slight', 'spite'],
        'day': ['bay', 'away', 'clay', 'gay', 'gray', 'hay', 'jay', 'lay', 'may', 'pay', 'play', 'pray', 'ray', 'say', 'stay', 'way', 'betray', 'decay', 'display', 'gray', 'relay', 'stray'],
        'time': ['chime', 'climb', 'crime', 'grime', 'prime', 'rhyme', 'slime', 'chyme', 'clime', 'sublime'],
        'star': ['afar', 'bar', 'car', 'far', 'jar', 'mar', 'par', 'scar', 'tar', 'char', 'czar', 'guitar'],
        'rain': ['brain', 'chain', 'drain', 'grain', 'main', 'pain', 'plain', 'reign', 'stain', 'strain', 'train', 'vain', 'wain', 'lane', 'mane', 'pane', 'sane'],
        'fire': ['admire', 'attire', 'brier', 'choir', 'desire', 'dire', 'empire', 'expire', 'hire', 'inspire', 'liar', 'mire', 'retire', 'spire', 'tire', 'wire'],
        'sea': ['be', 'bee', 'fee', 'flee', 'free', 'glee', 'knee', 'lea', 'pea', 'plea', 'spree', 'tea', 'three', 'tree'],
        'fly': ['by', 'buy', 'cry', 'die', 'dry', 'dye', 'eye', 'fry', 'guy', 'high', 'lie', 'my', 'pie', 'pry', 'rye', 'shy', 'sigh', 'sky', 'spy', 'sty', 'thigh', 'tie', 'try', 'why', 'apply', 'comply', 'defy', 'imply', 'reply', 'supply'],
        'spring': ['bring', 'cling', 'ding', 'fling', 'king', 'ring', 'sing', 'sling', 'sting', 'string', 'swing', 'thing', 'wing', 'wring'],
        'soul': ['bowl', 'coal', 'foal', 'goal', 'hole', 'mole', 'pole', 'role', 'scroll', 'stole', 'toll', 'whole', 'doll'],
        'home': ['chrome', 'come', 'dome', 'gnome', 'groom', 'loom', 'room', 'boom', 'broom', 'doom', 'gloom', 'groom', 'zoom', 'bloom', 'costume', 'assume'],
        'song': ['along', 'belong', 'dong', 'gong', 'long', 'pong', 'strong', 'throng', 'tong', 'wrong', 'among', 'prolong'],
        'dream': ['beam', 'cream', 'deem', 'esteem', 'extreme', 'gleam', 'scream', 'seam', 'seem', 'steam', 'stream', 'team', 'theme'],
        'light': ['bright', 'fight', 'flight', 'fright', 'height', 'kite', 'might', 'night', 'plight', 'right', 'sight', 'slight', 'tight', 'white', 'blight', 'delight', 'dynamic', 'excite', 'ignite', 'invite', 'polite', 'recite', 'require', 'reunite', 'uptight', 'unite'],
        'smile': ['aisle', 'bile', 'file', 'guile', 'isle', 'mile', 'mobile', 'pile', 'rile', 'stile', 'tile', 'trial', 'vile', 'while', 'wile', 'compile', 'defile', 'hostile', 'juvenile', 'profile', 'reconcile', 'textile']
    };

    const inputWord = document.getElementById('input-word');
    const resultsContainer = document.getElementById('results-container');

    if (!inputWord || !resultsContainer) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Generate rhymes based on phonetic ending
    function generateRhymes(word) {
        const lastChars = word.slice(-2);
        const allWords = Object.keys(rhymeDict).concat(...Object.values(rhymeDict));
        
        return allWords.filter(w => 
            w !== word && 
            w.slice(-2) === lastChars && 
            w.length > 2
        ).slice(0, 20);
    }

    // Find rhymes
    window.findRhymes = () => {
        const input = inputWord.value.trim().toLowerCase();

        if (input.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">Enter a word to find rhymes</div>';
            trackEvent('rhyme_search', { input: input, resultCount: 0 });
            return;
        }

        let rhymes = rhymeDict[input] || [];

        // Try to generate rhymes if not in dictionary
        if (rhymes.length === 0) {
            rhymes = generateRhymes(input);
        }

        if (rhymes.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">No rhymes found for "' + input.toUpperCase() + '"</div>';
            trackEvent('rhyme_search', { input: input, resultCount: 0 });
            return;
        }

        let html = '<div class="results-label">' + rhymes.length + ' rhyme' + (rhymes.length !== 1 ? 's' : '') + ' found</div>';
        html += '<div class="results-grid">';
        rhymes.forEach(word => {
            html += '<div class="result-pill" onclick="copyRhyme(\'' + word + '\')">' + word.toUpperCase() + '</div>';
        });
        html += '</div>';

        resultsContainer.innerHTML = html;
        trackEvent('rhyme_search', { input: input, resultCount: rhymes.length });
    };

    // Copy rhyme
    window.copyRhyme = (word) => {
        navigator.clipboard.writeText(word).then(() => {
            const pills = document.querySelectorAll('.result-pill');
            pills.forEach(pill => {
                if (pill.textContent.toUpperCase() === word.toUpperCase()) {
                    pill.classList.add('copied');
                    setTimeout(() => pill.classList.remove('copied'), 600);
                }
            });
            trackEvent('rhyme_copied', { word: word });
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Clear results
    window.clearResults = () => {
        inputWord.value = '';
        resultsContainer.innerHTML = '';
        inputWord.focus();
        trackEvent('rhyme_cleared');
    };

    // Allow search on Enter key
    inputWord.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') findRhymes();
    });
});
