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
            tag: 'anagram',
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

    const commonWords = ['a', 'i', 'an', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'car', 'cat', 'dog', 'eat', 'run', 'sit', 'act', 'art', 'ask', 'bad', 'bag', 'bat', 'bed', 'big', 'bit', 'box', 'bus', 'cut', 'end', 'far', 'fat', 'few', 'fix', 'fun', 'got', 'had', 'hat', 'hot', 'let', 'lot', 'man', 'men', 'put', 'red', 'sad', 'say', 'set', 'she', 'sun', 'yes', 'yet', 'that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'been', 'more', 'when', 'than', 'them', 'such', 'time', 'very', 'what', 'some', 'make', 'like', 'just', 'know', 'take', 'year', 'good', 'much', 'even', 'most', 'made', 'find', 'also', 'back', 'call', 'come', 'give', 'hand', 'here', 'home', 'keep', 'kind', 'last', 'long', 'look', 'must', 'name', 'need', 'next', 'only', 'over', 'part', 'same', 'seem', 'talk', 'tell', 'turn', 'want', 'well', 'were', 'work', 'able', 'area', 'away', 'baby', 'ball', 'band', 'bank', 'base', 'beat', 'best', 'bird', 'blue', 'boat', 'body', 'bone', 'book', 'born', 'both', 'busy', 'care', 'case', 'city', 'cold', 'dark', 'data', 'dead', 'dear', 'deep', 'desk', 'door', 'each', 'east', 'easy', 'edge', 'else', 'fail', 'fall', 'farm', 'fast', 'fear', 'feel', 'file', 'fine', 'fire', 'fish', 'five', 'flat', 'flow', 'food', 'foot', 'free', 'full', 'game', 'gate', 'gave', 'girl', 'give', 'glad', 'gold', 'gone', 'gray', 'grew', 'grey', 'hair', 'half', 'hall', 'hand', 'hang', 'hard', 'head', 'hear', 'heat', 'help', 'high', 'hill', 'hold', 'hole', 'home', 'hope', 'hour', 'huge', 'hung', 'hurt', 'idea', 'iron', 'join', 'joke', 'july', 'june', 'kept', 'kill', 'king', 'knew', 'know', 'lack', 'land', 'last', 'late', 'lead', 'left', 'lend', 'less', 'life', 'like', 'line', 'link', 'live', 'lost', 'love', 'made', 'make', 'male', 'mark', 'mass', 'mean', 'meat', 'meet', 'mind', 'mine', 'miss', 'mode', 'moon', 'more', 'most', 'move', 'must', 'near', 'neck', 'need', 'next', 'nice', 'nine', 'none', 'noon', 'nose', 'note', 'once', 'only', 'open', 'page', 'pain', 'pair', 'pale', 'palm', 'park', 'part', 'pass', 'past', 'path', 'peak', 'pick', 'pink', 'plan', 'play', 'plot', 'plus', 'poem', 'poet', 'pole', 'pool', 'poor', 'port', 'pray', 'pull', 'push', 'quit', 'race', 'rage', 'raid', 'rain', 'rank', 'rare', 'rate', 'read', 'real', 'rear', 'rest', 'rice', 'rich', 'ride', 'ring', 'rise', 'risk', 'road', 'rock', 'role', 'roll', 'roof', 'room', 'root', 'rose', 'rule', 'rush', 'safe', 'sage', 'said', 'sail', 'sale', 'salt', 'sand', 'save', 'seal', 'seat', 'seed', 'seek', 'seem', 'self', 'sell', 'send', 'sent', 'ship', 'shop', 'shot', 'show', 'shut', 'sick', 'side', 'sign', 'silk', 'sing', 'site', 'size', 'skin', 'slip', 'slow', 'snow', 'soap', 'soil', 'sold', 'sole', 'song', 'soon', 'sort', 'soul', 'spin', 'spot', 'star', 'stay', 'stem', 'step', 'stop', 'such', 'suit', 'sure', 'swim', 'tail', 'talk', 'tall', 'tank', 'task', 'team', 'tear', 'tell', 'tend', 'tent', 'term', 'test', 'than', 'that', 'them', 'then', 'they', 'thin', 'this', 'thus', 'tide', 'tied', 'till', 'time', 'tiny', 'tire', 'told', 'tone', 'took', 'tool', 'torn', 'tour', 'town', 'trap', 'tray', 'tree', 'trim', 'trip', 'true', 'tube', 'tune', 'turn', 'type', 'unit', 'upon', 'used', 'vain', 'vale', 'very', 'view', 'wage', 'wait', 'wake', 'walk', 'wall', 'want', 'ward', 'warm', 'warn', 'wash', 'wave', 'weak', 'wear', 'week', 'well', 'went', 'were', 'west', 'what', 'when', 'whom', 'wide', 'wife', 'wild', 'will', 'wind', 'wine', 'wing', 'wire', 'wise', 'wish', 'with', 'woke', 'wolf', 'wood', 'wool', 'word', 'wore', 'work', 'worn', 'wrap', 'yard', 'yarn', 'yeah', 'year', 'yell', 'zero', 'zone', 'silent', 'enlist', 'inlets', 'tinsel', 'listen', 'house', 'mouse', 'horse', 'stone', 'notes', 'tones'];

    const inputLetters = document.getElementById('input-letters');
    const resultsContainer = document.getElementById('results-container');

    if (!inputLetters || !resultsContainer) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Normalize letters
    function normalizeLetters(input) {
        return input.toLowerCase().replace(/[^a-z]/g, '').split('');
    }

    // Check if word is anagram
    function isAnagram(word, letters) {
        const wordLetters = word.toLowerCase().split('').sort();
        const sortedInput = [...letters].sort();
        return wordLetters.join('') === sortedInput.join('');
    }

    // Find anagrams
    window.findAnagrams = () => {
        const input = inputLetters.value.trim();

        if (input.length < 2) {
            resultsContainer.innerHTML = '<div class="empty-state">Enter at least 2 letters to find anagrams</div>';
            trackEvent('anagram_search', { input: input, resultCount: 0 });
            return;
        }

        const letters = normalizeLetters(input);

        if (letters.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">Please enter valid letters</div>';
            trackEvent('anagram_search', { input: input, resultCount: 0 });
            return;
        }

        const anagrams = commonWords.filter(word => 
            word.length >= 2 && 
            isAnagram(word, letters)
        ).sort((a, b) => b.length - a.length);

        if (anagrams.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">No anagrams found for "' + input.toUpperCase() + '"</div>';
            trackEvent('anagram_search', { input: input, resultCount: 0 });
            return;
        }

        let html = '<div class="results-label">' + anagrams.length + ' anagram' + (anagrams.length !== 1 ? 's' : '') + ' found</div>';
        html += '<div class="results-grid">';
        anagrams.forEach(word => {
            html += '<div class="result-pill" onclick="copyAnagram(\'' + word + '\')">' + word.toUpperCase() + '</div>';
        });
        html += '</div>';

        resultsContainer.innerHTML = html;
        trackEvent('anagram_search', { input: input, resultCount: anagrams.length });
    };

    // Copy anagram
    window.copyAnagram = (word) => {
        navigator.clipboard.writeText(word).then(() => {
            const pills = document.querySelectorAll('.result-pill');
            pills.forEach(pill => {
                if (pill.textContent.toUpperCase() === word.toUpperCase()) {
                    pill.classList.add('copied');
                    setTimeout(() => pill.classList.remove('copied'), 600);
                }
            });
            trackEvent('anagram_copied', { word: word });
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Clear results
    window.clearResults = () => {
        inputLetters.value = '';
        resultsContainer.innerHTML = '';
        inputLetters.focus();
        trackEvent('anagram_cleared');
    };

    // Allow search on Enter key
    inputLetters.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') findAnagrams();
    });
});
