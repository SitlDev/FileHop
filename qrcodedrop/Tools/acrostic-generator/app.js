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
            tag: 'acrostic_generator',
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

    const inputWord = document.getElementById('input-word');
    const outputAcrostic = document.getElementById('output-acrostic');

    if (!inputWord || !outputAcrostic) {
        console.error('❌ Missing DOM elements! Check HTML structure.');
        return;
    }

    // Sample words/phrases for each letter
    const starterPhrases = {
        'A': ['Adventurous and bold', 'Amazing and authentic', 'Ambitious and able'],
        'B': ['Brave and brilliant', 'Beautiful and bright', 'Bold and boundless'],
        'C': ['Creative and caring', 'Courageous and calm', 'Charming and clever'],
        'D': ['Dynamic and daring', 'Determined and dedicated', 'Devoted and dependable'],
        'E': ['Energetic and elegant', 'Excellent and evolving', 'Earnest and emphatic'],
        'F': ['Fearless and free', 'Faithful and friendly', 'Flexible and fun'],
        'G': ['Graceful and genuine', 'Glorious and giving', 'Generous and grand'],
        'H': ['Hopeful and humble', 'Honest and heroic', 'Happy and harmonious'],
        'I': ['Inspired and insightful', 'Intelligent and imaginative', 'Independent and innovative'],
        'J': ['Joyful and jubilant', 'Just and jubilant', 'Jolly and jumping'],
        'K': ['Kind and keen', 'Knowing and knowledgeable', 'Keeping and keeping'],
        'L': ['Lively and loyal', 'Luminous and loving', 'Laughing and light'],
        'M': ['Mighty and magnificent', 'Motivated and mindful', 'Marvelous and meaningful'],
        'N': ['Noble and nurturing', 'Nice and natural', 'Neat and notable'],
        'O': ['Optimistic and open', 'Outstanding and original', 'Organized and orderly'],
        'P': ['Passionate and peaceful', 'Playful and patient', 'Powerful and purposeful'],
        'Q': ['Quirky and quick', 'Quiet and quality', 'Questioning and quick-witted'],
        'R': ['Radiant and resilient', 'Resourceful and reliable', 'Remarkable and refined'],
        'S': ['Strong and serene', 'Smart and sensible', 'Spirited and sincere'],
        'T': ['Thoughtful and talented', 'Truthful and trustworthy', 'Tenacious and true'],
        'U': ['Unique and understanding', 'Uplifting and upbeat', 'Useful and ultimate'],
        'V': ['Vibrant and vivid', 'Valiant and virtuous', 'Vivacious and vital'],
        'W': ['Wise and warm', 'Wonderful and witty', 'Willing and whole'],
        'X': ['Xenial and exuberant', 'X-factor and exciting', 'Xeric and x-ray sharp'],
        'Y': ['Young and yearning', 'Yielding and youthful', 'Yarn-spinning and yearning'],
        'Z': ['Zealous and zesty', 'Zen and zealot', 'Zigzagging and zealous']
    };

    // Generate acrostic
    window.generateAcrostic = () => {
        const word = inputWord.value.trim().toUpperCase();

        if (word.length === 0) {
            outputAcrostic.textContent = 'Enter a word to generate your acrostic poem...';
            trackEvent('acrostic_generated', { wordLength: 0 });
            return;
        }

        // Track which phrase index to use for each letter
        const usedPhraseIndexes = {};

        // Generate acrostic with rotating phrases
        let acrostic = '';
        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const phrases = starterPhrases[letter] || [letter + ' - [Add your line here]'];
            
            // Get the next phrase for this letter, cycling through available options
            if (usedPhraseIndexes[letter] === undefined) {
                usedPhraseIndexes[letter] = 0;
            } else {
                usedPhraseIndexes[letter] = (usedPhraseIndexes[letter] + 1) % phrases.length;
            }
            
            const phrase = phrases[usedPhraseIndexes[letter]];
            acrostic += letter + '  ' + phrase + '\n';
        }

        outputAcrostic.textContent = acrostic;
        trackEvent('acrostic_generated', { wordLength: word.length, success: true });
    };

    // Clear results
    window.clearAcrostic = () => {
        inputWord.value = '';
        outputAcrostic.textContent = 'Enter a word to generate your acrostic poem...';
        inputWord.focus();
        trackEvent('acrostic_cleared');
    };

    // Allow generation on Enter key
    inputWord.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateAcrostic();
    });

    // Auto-generate on input for live preview
    inputWord.addEventListener('input', generateAcrostic);
});
