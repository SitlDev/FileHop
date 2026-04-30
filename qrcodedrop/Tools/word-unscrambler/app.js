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
            tag: 'word_unscrambler',
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

    // Common English words for unscrambling
    const wordList = ['a', 'i', 'an', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'car', 'cat', 'dog', 'eat', 'run', 'sit', 'act', 'art', 'ask', 'bad', 'bag', 'bat', 'bed', 'big', 'bit', 'box', 'bus', 'cut', 'end', 'far', 'fat', 'few', 'fix', 'fun', 'got', 'had', 'hat', 'hot', 'let', 'lot', 'man', 'men', 'put', 'red', 'sad', 'say', 'set', 'she', 'sun', 'yes', 'yet', 'that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'been', 'more', 'when', 'than', 'them', 'such', 'time', 'very', 'what', 'some', 'make', 'like', 'just', 'know', 'take', 'year', 'good', 'much', 'even', 'most', 'made', 'find', 'also', 'back', 'call', 'come', 'give', 'hand', 'here', 'home', 'keep', 'kind', 'last', 'long', 'look', 'must', 'name', 'need', 'next', 'only', 'over', 'part', 'same', 'seem', 'such', 'talk', 'tell', 'than', 'then', 'they', 'this', 'told', 'turn', 'want', 'well', 'were', 'work', 'year', 'able', 'area', 'away', 'baby', 'ball', 'band', 'bank', 'base', 'beat', 'been', 'best', 'bill', 'bird', 'blow', 'blue', 'boat', 'body', 'bone', 'book', 'born', 'both', 'bowl', 'busy', 'care', 'case', 'cash', 'cast', 'city', 'club', 'coal', 'coat', 'cold', 'cost', 'dark', 'data', 'dead', 'dear', 'deep', 'deny', 'desk', 'door', 'draw', 'drew', 'drop', 'each', 'east', 'easy', 'edge', 'else', 'ends', 'euro', 'fair', 'fall', 'fear', 'feel', 'file', 'fill', 'film', 'fire', 'firm', 'fish', 'flat', 'flew', 'flow', 'folk', 'food', 'foot', 'form', 'fort', 'four', 'free', 'full', 'game', 'gate', 'gear', 'girl', 'glad', 'glen', 'gold', 'golf', 'gone', 'gray', 'grew', 'grey', 'grid', 'grim', 'half', 'hall', 'hang', 'hard', 'harm', 'hate', 'have', 'head', 'hear', 'heat', 'heel', 'held', 'help', 'herb', 'herd', 'high', 'hill', 'hint', 'hire', 'hold', 'hole', 'holy', 'hope', 'horn', 'host', 'hour', 'huge', 'hung', 'hunt', 'hurt', 'idea', 'inch', 'into', 'iron', 'item', 'jail', 'join', 'joke', 'july', 'june', 'jury', 'king', 'knee', 'knew', 'knot', 'know', 'lack', 'lady', 'laid', 'lake', 'land', 'lane', 'late', 'lead', 'leaf', 'lean', 'leap', 'left', 'lend', 'less', 'liar', 'lied', 'life', 'lift', 'like', 'limb', 'lime', 'line', 'link', 'lion', 'list', 'live', 'load', 'loan', 'lock', 'loft', 'lone', 'loss', 'lost', 'loud', 'love', 'luck', 'lung', 'mail', 'main', 'male', 'mall', 'mark', 'mars', 'mass', 'math', 'meal', 'mean', 'meat', 'meet', 'menu', 'mess', 'mice', 'mild', 'mile', 'milk', 'mill', 'mind', 'mine', 'mint', 'miss', 'mist', 'mode', 'mood', 'moon', 'more', 'moss', 'moth', 'move', 'myth', 'nail', 'neat', 'neck', 'need', 'nest', 'news', 'next', 'nice', 'nine', 'node', 'none', 'noon', 'norm', 'nose', 'note', 'noun', 'oval', 'oven', 'pace', 'pack', 'page', 'paid', 'pain', 'pair', 'pale', 'palm', 'park', 'part', 'pass', 'past', 'path', 'pave', 'peak', 'peel', 'peer', 'pest', 'pick', 'pile', 'pine', 'pink', 'pipe', 'plan', 'play', 'plea', 'plot', 'plug', 'plus', 'poem', 'poet', 'pole', 'poll', 'pond', 'pool', 'poor', 'pope', 'pork', 'port', 'pose', 'post', 'pour', 'pray', 'prey', 'pull', 'pump', 'push', 'quit', 'quiz', 'race', 'rack', 'rage', 'raid', 'rail', 'rain', 'rank', 'rare', 'rate', 'rays', 'read', 'real', 'rear', 'rely', 'rent', 'rest', 'rice', 'rich', 'ride', 'ring', 'rise', 'risk', 'road', 'roam', 'roar', 'role', 'roll', 'roof', 'room', 'root', 'rope', 'rose', 'rule', 'rust', 'safe', 'sage', 'said', 'sail', 'sake', 'sale', 'salt', 'sand', 'sank', 'save', 'seal', 'seas', 'seat', 'seed', 'seek', 'seem', 'seen', 'self', 'sell', 'send', 'sent', 'sept', 'shed', 'ship', 'shop', 'shot', 'show', 'shut', 'sick', 'side', 'sift', 'sign', 'silk', 'sing', 'sink', 'site', 'size', 'skew', 'skip', 'slab', 'slam', 'slip', 'slow', 'snow', 'soap', 'soil', 'sold', 'sole', 'song', 'soon', 'sore', 'sort', 'soul', 'soup', 'spin', 'spot', 'stab', 'star', 'stay', 'stem', 'step', 'stew', 'stir', 'stop', 'stow', 'such', 'suit', 'sums', 'sure', 'surf', 'swam', 'swap', 'swim', 'tail', 'take', 'tale', 'talk', 'tall', 'tame', 'tank', 'tape', 'task', 'team', 'tear', 'teen', 'tell', 'tend', 'tent', 'term', 'test', 'text', 'than', 'that', 'them', 'then', 'they', 'thin', 'this', 'thou', 'tied', 'tier', 'tile', 'tilt', 'time', 'tiny', 'tire', 'toad', 'toes', 'tomb', 'tone', 'took', 'tool', 'tops', 'torn', 'tour', 'town', 'trap', 'tray', 'tree', 'trek', 'trim', 'trio', 'trip', 'trot', 'true', 'tsar', 'tuba', 'tube', 'tuna', 'tune', 'turn', 'tusk', 'type', 'unit', 'upon', 'used', 'user', 'uses', 'vain', 'vale', 'vane', 'vary', 'vase', 'vast', 'veal', 'veil', 'vein', 'verb', 'very', 'vest', 'vice', 'view', 'vine', 'void', 'vote', 'wage', 'wail', 'wait', 'wake', 'walk', 'wall', 'wand', 'want', 'ward', 'warm', 'warn', 'warp', 'wars', 'wash', 'wasp', 'wave', 'weak', 'wear', 'week', 'weep', 'west', 'what', 'when', 'whom', 'wick', 'wife', 'wild', 'will', 'wind', 'wine', 'wing', 'wire', 'wise', 'wish', 'with', 'woke', 'wolf', 'womb', 'wood', 'wool', 'word', 'wore', 'work', 'worm', 'worn', 'wrap', 'yard', 'yarn', 'yawn', 'yeah', 'year', 'yell', 'zero', 'zinc', 'zone', 'listen', 'silent', 'enlist', 'inlets', 'tinsel', 'python', 'house', 'mouse', 'horse', 'shore', 'store', 'shore', 'stone', 'notes', 'tones', 'steno', 'sternly', 'lastly', 'mostly', 'beast', 'beats', 'baste', 'boast', 'boats', 'toast', 'roast', 'boasts'];

    const inputLetters = document.getElementById('input-letters');
    const minLength = document.getElementById('min-length');
    const resultsContainer = document.getElementById('results-container');

    if (!inputLetters || !resultsContainer || !minLength) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Normalize letters
    function normalizeLetters(input) {
        return input.toLowerCase().replace(/[^a-z]/g, '').split('');
    }

    // Check if word can be made from letters
    function canMakeWord(word, letters) {
        const lettersCopy = [...letters];
        for (let char of word.toLowerCase().split('')) {
            const index = lettersCopy.indexOf(char);
            if (index === -1) return false;
            lettersCopy.splice(index, 1);
        }
        return true;
    }

    // Find words
    window.unscrambleWords = () => {
        const input = inputLetters.value.trim();
        const minLen = parseInt(minLength.value) || 2;

        if (input.length < minLen) {
            resultsContainer.innerHTML = '<div class="empty-state">Enter at least ' + minLen + ' letters to find words</div>';
            trackEvent('unscramble_search', { input: input, resultCount: 0, minLength: minLen });
            return;
        }

        const letters = normalizeLetters(input);

        if (letters.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">Please enter valid letters</div>';
            trackEvent('unscramble_search', { input: input, resultCount: 0, minLength: minLen });
            return;
        }

        const words = wordList.filter(word => 
            word.length >= minLen && 
            canMakeWord(word, letters)
        ).sort((a, b) => b.length - a.length);

        if (words.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">No words found for "' + input.toUpperCase() + '"</div>';
            trackEvent('unscramble_search', { input: input, resultCount: 0, minLength: minLen });
            return;
        }

        let html = '<div class="results-label">' + words.length + ' word' + (words.length !== 1 ? 's' : '') + ' found</div>';
        html += '<div class="results-grid">';
        words.forEach(word => {
            html += '<div class="result-pill" onclick="copyWord(\'' + word + '\')">' + word.toUpperCase() + '</div>';
        });
        html += '</div>';

        resultsContainer.innerHTML = html;
        trackEvent('unscramble_search', { input: input, resultCount: words.length, minLength: minLen });
    };

    // Copy word
    window.copyWord = (word) => {
        navigator.clipboard.writeText(word).then(() => {
            const pills = document.querySelectorAll('.result-pill');
            pills.forEach(pill => {
                if (pill.textContent.toUpperCase() === word.toUpperCase()) {
                    pill.classList.add('copied');
                    setTimeout(() => pill.classList.remove('copied'), 600);
                }
            });
            trackEvent('word_copied', { word: word });
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Clear results
    window.clearResults = () => {
        inputLetters.value = '';
        resultsContainer.innerHTML = '';
        inputLetters.focus();
        trackEvent('unscramble_cleared');
    };

    // Allow search on Enter key
    inputLetters.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') unscrambleWords();
    });
});
