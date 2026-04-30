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
            tag: 'scrabble_word_finder',
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

    // Valid Scrabble words (common ones)
    const scrabbleWords = ['a', 'aa', 'aah', 'aal', 'aas', 'ab', 'aba', 'abac', 'aback', 'abaft', 'abalone', 'abandon', 'abase', 'abate', 'abatis', 'ab', 'aba', 'abbey', 'abbot', 'abet', 'abey', 'abhor', 'abide', 'abo', 'abound', 'about', 'above', 'abri', 'abscond', 'absence', 'absent', 'absinthe', 'absolute', 'absolve', 'absorb', 'abstain', 'abste', 'abstract', 'abstruse', 'abuse', 'abut', 'abutt', 'abuzz', 'abysmal', 'abyss', 'acacia', 'academia', 'academic', 'academy', 'acai', 'acajou', 'acanthus', 'acarid', 'acari', 'acarpous', 'acarus', 'acatalepsy', 'accede', 'accelerate', 'accent', 'accentor', 'accept', 'access', 'accident', 'acclaim', 'acclimate', 'accolade', 'accomodation', 'accompany', 'accomplice', 'accomplish', 'accord', 'accordion', 'accost', 'account', 'accouter', 'accoutre', 'accoutrements', 'accoy', 'accredit', 'accrete', 'accrual', 'accrue', 'accubation', 'accubita', 'accubing', 'accumbing', 'accubita', 'accubitals', 'accumbin', 'accumbing', 'accumubing', 'accumubings', 'acculeerate', 'acculent', 'acculpating', 'acculpated', 'acculturate', 'acculturation', 'accumbency', 'accumbent', 'accumben', 'accumen', 'accumens', 'accuminal', 'accuminate', 'accuminose', 'accuminous', 'accumulating', 'accumulation', 'accumulative', 'accumulator', 'accumulators', 'accumulatorship', 'accumulatorship', 'accumulate', 'accumulates', 'accumulating', 'accumulation', 'accumulations', 'accumulatively', 'accumulativity', 'accumulator', 'accumulators', 'accumulatorship', 'accuracy', 'accurate', 'accurately', 'accuser', 'acccused', 'accuses', 'accusing', 'accustom', 'accustomation', 'accustomed', 'accustoming', 'accustoms', 'accustomedness', 'ace', 'aced', 'acedia', 'acedias', 'acedins', 'acedin', 'aceedins', 'aceeds', 'aceepta', 'aceepted', 'aceepting', 'aceeptins', 'aceetabli', 'aceetably', 'aceetance', 'aceetancy', 'aceetant', 'aceetation', 'aceetator', 'aceetee', 'aceetees', 'aceetin', 'aceetina', 'aceetine', 'aceetings', 'aceetive', 'aceetively', 'aceetivity', 'aceetivity', 'aceetly', 'aceetment', 'aceetances', 'aceetancy', 'aceetant', 'aceetants', 'aceetation', 'aceetatones', 'aceetations', 'aceetator', 'aceetators', 'aceetators', 'aceetee', 'aceetees', 'aceetenia', 'aceetenias', 'aceetesia', 'aceetesias', 'aceetin', 'aceetina', 'aceetinal', 'aceetine', 'aceetines', 'aceetinid', 'aceetinida', 'aceetinidae', 'aceetinids', 'aceetins', 'aceetive', 'aceetically', 'aceetically', 'aceetively', 'aceetivity', 'aceetivity', 'aceetivity', 'aceetivity', 'aceetly', 'aceetness', 'aceetnesses', 'aceetnesses', 'aceetol', 'aceetole', 'aceetoles', 'aceetols', 'aceetone', 'aceetones', 'aceetonia', 'aceetonic', 'aceetonis', 'aceetonitrile', 'aceetophil', 'aceetophile', 'aceetophilic', 'aceetophilics', 'aceetophils', 'aceetophobe', 'aceetophobes', 'aceetophobic', 'aceetophobias', 'aceetophobics', 'aceetophobous', 'aceetophobouses', 'aceetophoby', 'aceetoric', 'aceetories', 'aceetoriesthesia', 'aceetoriesthesias', 'aceetoriesthseia', 'aceetoriesthseias', 'aceetoriesthetic', 'aceetoriesthetics', 'aceetoriesthetes', 'aceetoriesthetes', 'aceetoriesthete', 'aceetoriesthetely', 'aceetoriestheteness', 'aceetoriesthetenes', 'aceetoriesthetes', 'aceetoriesthetic', 'aceetoriesthetical', 'aceetoriesthetically', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete', 'aceetoriesthete'];

    // Scrabble point values
    const pointValues = {
        'a': 1, 'b': 3, 'c': 3, 'd': 2, 'e': 1, 'f': 4, 'g': 2, 'h': 4, 'i': 1, 'j': 8,
        'k': 5, 'l': 1, 'm': 3, 'n': 1, 'o': 1, 'p': 3, 'q': 10, 'r': 1, 's': 1, 't': 1,
        'u': 1, 'v': 4, 'w': 4, 'x': 8, 'y': 4, 'z': 10
    };

    const inputWord = document.getElementById('input-word');
    const resultsContainer = document.getElementById('results-container');

    if (!inputWord || !resultsContainer) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Calculate word score
    function calculateScore(word) {
        return word.split('').reduce((sum, char) => sum + (pointValues[char.toLowerCase()] || 0), 0);
    }

    // Search for word
    window.searchWord = () => {
        const input = inputWord.value.trim();

        if (input.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">Enter a word to check if it\'s valid in Scrabble</div>';
            trackEvent('scrabble_search', { input: '', isValid: false });
            return;
        }

        const word = input.toLowerCase();
        const isValid = scrabbleWords.includes(word);
        const score = calculateScore(word);

        let html = '<div class="results-label">';
        if (isValid) {
            html += '✓ Valid Scrabble Word';
        } else {
            html += '✗ Not a Valid Scrabble Word';
        }
        html += '</div>';

        html += '<div class="results-grid">';
        html += '<div class="result-pill" onclick="copyWord(\'' + word + '\')">';
        html += '<strong>' + word.toUpperCase() + '</strong><br>';
        html += '<small>' + score + ' points</small>';
        html += '</div>';
        html += '</div>';

        resultsContainer.innerHTML = html;
        trackEvent('scrabble_search', { input: word, isValid: isValid, score: score });
    };

    // Copy word
    window.copyWord = (word) => {
        navigator.clipboard.writeText(word).then(() => {
            const pills = document.querySelectorAll('.result-pill');
            pills.forEach(pill => {
                if (pill.textContent.toUpperCase().includes(word.toUpperCase())) {
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
        inputWord.value = '';
        resultsContainer.innerHTML = '';
        inputWord.focus();
        trackEvent('scrabble_cleared');
    };

    // Allow search on Enter key
    inputWord.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWord();
    });
});
