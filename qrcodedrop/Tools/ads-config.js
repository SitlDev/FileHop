/**
 * Google Ads Configuration & Keyword Targeting
 * This file manages AdSense ad placements and keyword targeting across all tools
 */

const GOOGLE_ADSENSE_CONFIG = {
    client: 'ca-pub-XXXXXXXXXXXXXXXX',
    
    // Tool-specific keywords for ad targeting
    keywords: {
        'anagram': ['anagram solver', 'word games', 'scrabble', 'anagrams', 'word unscrambler', 'letters', 'puzzle games'],
        'rhyme-generator': ['rhyme generator', 'rhyming words', 'poetry', 'rap lyrics', 'songwriting', 'verse', 'poetry tools'],
        'word-unscrambler': ['word unscrambler', 'unscramble words', 'word solver', 'scrabble helper', 'word games'],
        'synonym-finder': ['synonym finder', 'synonyms', 'thesaurus', 'similar words', 'vocabulary builder', 'writing tools'],
        'antonym-finder': ['antonym finder', 'antonyms', 'opposite words', 'vocabulary', 'writing'],
        'scrabble-word-finder': ['scrabble words', 'scrabble helper', 'valid words', 'word game', 'scrabble score'],
        'homophones-finder': ['homophones', 'homophone list', 'sound alike words', 'homophones examples'],
        'palindrome-checker': ['palindrome', 'palindrome words', 'word checker', 'text analyzer'],
        'acrostic-generator': ['acrostic', 'acrostic poem', 'acrostic generator', 'poetry', 'creative writing'],
        'portmanteau-generator': ['portmanteau', 'word blender', 'word fusion', 'blended words', 'neologism'],
        'qrcode': ['QR code generator', 'QR code', 'QR code maker', 'barcode generator', 'QR scanner'],
        'uuid': ['UUID generator', 'GUID generator', 'unique ID', 'UUID', 'identifier'],
        'password': ['password generator', 'secure password', 'random password', 'password strength'],
        'json': ['JSON formatter', 'JSON validator', 'JSON editor', 'JSON parser'],
        'base64': ['base64 encoder', 'base64 decoder', 'encoding', 'decoding'],
        'url': ['URL encoder', 'URL decoder', 'URI', 'URL encoding'],
        'hash': ['hash generator', 'MD5', 'SHA256', 'SHA512', 'hash function'],
        'color': ['color converter', 'RGB', 'HEX', 'HSL', 'color picker'],
        'markdown': ['markdown to html', 'markdown editor', 'markdown formatter', 'markdown parser'],
        'regex': ['regex tester', 'regular expression', 'regex pattern', 'regex builder']
    },
    
    // Ad slot configurations
    adSlots: {
        header: {
            id: 'ad-header',
            horizontal: true,
            format: 'auto',
            responsive: true
        },
        sidebar: {
            id: 'ad-sidebar',
            horizontal: false,
            format: '300x250',
            responsive: true
        },
        footer: {
            id: 'ad-footer',
            horizontal: true,
            format: 'auto',
            responsive: true
        },
        inline: {
            id: 'ad-inline',
            horizontal: true,
            format: 'auto',
            responsive: true
        }
    }
};

/**
 * Initialize Google AdSense
 * Call this function in your HTML before </body>
 */
function initializeGoogleAds() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CONFIG.client}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    
    // Push ads after a delay to ensure proper loading
    setTimeout(() => {
        if (window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
    }, 500);
}

/**
 * Add Google Ads meta tags for better targeting
 * @param {string} toolName - Name of the tool
 * @param {array} customKeywords - Additional keywords for this tool
 */
function setAdsMetaTags(toolName, customKeywords = []) {
    const keywordList = [...(GOOGLE_ADSENSE_CONFIG.keywords[toolName] || []), ...customKeywords];
    
    // Set keywords meta tag
    let keywordMeta = document.querySelector('meta[name="keywords"]');
    if (!keywordMeta) {
        keywordMeta = document.createElement('meta');
        keywordMeta.name = 'keywords';
        document.head.appendChild(keywordMeta);
    }
    keywordMeta.content = keywordList.join(', ');
    
    // Set news_keywords for Google News
    let newsKeywordMeta = document.querySelector('meta[name="news_keywords"]');
    if (!newsKeywordMeta) {
        newsKeywordMeta = document.createElement('meta');
        newsKeywordMeta.name = 'news_keywords';
        document.head.appendChild(newsKeywordMeta);
    }
    newsKeywordMeta.content = keywordList.slice(0, 10).join(', ');
}

/**
 * Create responsive ad placeholder
 * @param {string} slotId - ID of the ad slot
 * @param {string} format - Ad format (e.g., '300x250', 'auto', '728x90')
 */
function createAdSlot(slotId, format = 'auto') {
    const adDiv = document.createElement('ins');
    adDiv.className = 'adsbygoogle';
    adDiv.style.display = 'block';
    adDiv.setAttribute('data-ad-client', GOOGLE_ADSENSE_CONFIG.client);
    adDiv.setAttribute('data-ad-slot', generateAdSlot(slotId));
    
    if (format === 'auto') {
        adDiv.setAttribute('data-ad-format', 'auto');
        adDiv.setAttribute('data-full-width-responsive', 'true');
    } else {
        adDiv.setAttribute('data-ad-format', format);
    }
    
    return adDiv;
}

/**
 * Generate consistent ad slot IDs based on position
 * @param {string} slotId - Slot identifier
 */
function generateAdSlot(slotId) {
    const slots = {
        'header': '1234567890',
        'sidebar': '1234567891',
        'footer': '1234567892',
        'inline': '1234567893'
    };
    
    return slots[slotId] || '1234567890';
}

/**
 * Refresh ads when content changes
 */
function refreshAds() {
    if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
}

/**
 * Track ad impressions and clicks
 */
function trackAdInteraction(slotId, action) {
    trackEvent('ad_' + action, {
        slot: slotId,
        timestamp: new Date().toISOString()
    });
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', initializeGoogleAds);
