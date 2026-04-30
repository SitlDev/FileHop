const tools = [
    // Generators
    { name: 'QR Code Generator', path: 'qrcode/', category: 'generator', desc: 'Generate QR codes for URLs, text, contact cards, and more.' },
    { name: 'UUID/GUID Generator', path: 'uuid/', category: 'generator', desc: 'Create unique identifiers for applications and databases.' },
    { name: 'Password Generator', path: 'password/', category: 'generator', desc: 'Generate secure passwords with customizable options.' },
    { name: 'Lorem Ipsum Generator', path: 'lorem/', category: 'generator', desc: 'Create placeholder text for designs and layouts.' },
    { name: 'Coupon Code Generator', path: 'coupon/', category: 'generator', desc: 'Generate random coupon codes in bulk.' },
    { name: 'Barcode Generator', path: 'barcode/', category: 'generator', desc: 'Create barcodes for products and inventory.' },

    // Converters
    { name: 'Unit Converter', path: 'unitconverter/', category: 'converter', desc: 'Convert between length, weight, temperature, volume, and speed.' },
    { name: 'Base Converter', path: 'baseconverter/', category: 'converter', desc: 'Convert numbers between binary, octal, decimal, and hex.' },
    { name: 'Timestamp Converter', path: 'timestamp/', category: 'converter', desc: 'Convert Unix timestamps to human-readable dates.' },
    { name: 'CSV to JSON', path: 'csvjson/', category: 'converter', desc: 'Convert CSV data to JSON format.' },
    { name: 'YAML to JSON', path: 'yamlconverter/', category: 'converter', desc: 'Convert YAML configuration to JSON.' },
    { name: 'Color Converter', path: 'color/', category: 'converter', desc: 'Convert between RGB, HEX, and HSL color formats.' },
    { name: 'Markdown to HTML', path: 'markdown/', category: 'converter', desc: 'Convert Markdown to HTML instantly.' },

    // Encoders & Decoders
    { name: 'Base64 Encoder/Decoder', path: 'base64/', category: 'encoder', desc: 'Encode text to Base64 or decode Base64 strings.' },
    { name: 'URL Encoder/Decoder', path: 'urlencoder/', category: 'encoder', desc: 'Encode and decode URLs and URI components.' },
    { name: 'HTML Entity Encoder', path: 'htmlencode/', category: 'encoder', desc: 'Convert text to HTML entities.' },
    { name: 'Text Encryption', path: 'encryption/', category: 'encoder', desc: 'Encrypt and decrypt text using Caesar cipher.' },

    // Formatters
    { name: 'JSON Formatter', path: 'json/', category: 'formatter', desc: 'Format, minify, and validate JSON code.' },
    { name: 'HTML/CSS Minifier', path: 'minifier/', category: 'formatter', desc: 'Minify HTML and CSS to reduce file sizes.' },
    { name: 'Text Case Converter', path: 'textcase/', category: 'formatter', desc: 'Convert text between different cases.' },
    { name: 'URL Slug Generator', path: 'slug/', category: 'formatter', desc: 'Generate URL-friendly slugs from text.' },

    // Other Tools
    { name: 'Regex Tester', path: 'regex/', category: 'other', desc: 'Test and debug regular expressions with instant feedback.' },
    { name: 'Hash Generator', path: 'hash/', category: 'other', desc: 'Generate SHA-256, SHA-512, and SHA-1 hashes.' },
    { name: 'Text Statistics', path: 'textstats/', category: 'other', desc: 'Analyze word count, characters, and readability.' },
    { name: 'Diff Checker', path: 'diff/', category: 'other', desc: 'Compare two texts and highlight differences.' },
    { name: 'Markdown Preview', path: 'markdownpreview/', category: 'other', desc: 'Live preview for Markdown as you type.' },
    { name: 'Gradient Generator', path: 'gradient/', category: 'other', desc: 'Create CSS gradients with visual preview.' },
    { name: 'JWT Debugger', path: 'jwt/', category: 'other', desc: 'Decode and debug JWT tokens.' },

    // Vocabulary & Word Tools
    { name: 'Anagram Solver', path: 'anagram/', category: 'vocabulary', desc: 'Find all possible anagrams from your letters.' },
    { name: 'Rhyme Generator', path: 'rhyme-generator/', category: 'vocabulary', desc: 'Find rhyming words for poetry, lyrics, and creative writing.' },
    { name: 'Word Unscrambler', path: 'word-unscrambler/', category: 'vocabulary', desc: 'Unscramble letters to find hidden words.' },
    { name: 'Synonym Finder', path: 'synonym-finder/', category: 'vocabulary', desc: 'Find synonyms and similar words to expand your vocabulary.' },
    { name: 'Antonym Finder', path: 'antonym-finder/', category: 'vocabulary', desc: 'Find opposite words and antonyms instantly.' },
    { name: 'Scrabble Word Finder', path: 'scrabble-word-finder/', category: 'vocabulary', desc: 'Find valid Scrabble words for high scores.' },
    { name: 'Homophones Finder', path: 'homophones-finder/', category: 'vocabulary', desc: 'Find words that sound the same but have different meanings.' },
    { name: 'Palindrome Checker', path: 'palindrome-checker/', category: 'vocabulary', desc: 'Check if words or phrases read the same forwards and backwards.' },
    { name: 'Acrostic Generator', path: 'acrostic-generator/', category: 'vocabulary', desc: 'Create acrostic poems and messages with ease.' },
    { name: 'Portmanteau Generator', path: 'portmanteau-generator/', category: 'vocabulary', desc: 'Create new words by blending two words together.' },

    // Additional Tools
    { name: 'Morse Code Converter', path: 'morse-code/', category: 'converter', desc: 'Convert text to Morse code and vice versa.' },
    { name: 'Analog Clock', path: 'analog-clock/', category: 'other', desc: 'Display time on an interactive analog clock face.' },
    { name: 'Chemical Equation Balancer', path: 'chemical-equation-balancer/', category: 'other', desc: 'Balance chemical equations instantly with detailed steps.' },
];

const gridEl = document.getElementById('tools-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryBtns = document.querySelectorAll('.category-btn');
const resultsInfo = document.getElementById('results-info');

// Category metadata with icons and descriptions
const categoryMetadata = {
    'generator': { 
        name: 'Generators',
        icon: '⚡',
        description: 'Generate unique codes, IDs, passwords, and creative content'
    },
    'converter': {
        name: 'Converters',
        icon: '🔄',
        description: 'Transform data between different formats and units'
    },
    'encoder': {
        name: 'Encoders & Decoders',
        icon: '🔐',
        description: 'Encode, decode, and encrypt your data securely'
    },
    'formatter': {
        name: 'Formatters',
        icon: '✨',
        description: 'Format and optimize code, text, and data'
    },
    'vocabulary': {
        name: 'Word & Language Tools',
        icon: '📚',
        description: 'Explore words, find synonyms, solve word puzzles'
    },
    'other': {
        name: 'Utilities',
        icon: '🛠️',
        description: 'Additional tools for testing, analysis, and development'
    }
};

let currentCategory = 'all';
let currentSearch = '';

// ===== Handle URL Category Parameters =====
// Map URL parameters from home page to dashboard categories
const categoryMapping = {
    'qrcode': 'generator',
    'encoding': 'encoder',
    'converters': 'converter',
    'formatters': 'formatter',
    'generators': 'generator',
    'all': 'all'
};

// Check URL for category parameter
const urlParams = new URLSearchParams(window.location.search);
const urlCategory = urlParams.get('category');
if (urlCategory && categoryMapping[urlCategory]) {
    currentCategory = categoryMapping[urlCategory];
}

// ===== Analytics Functions =====
async function loadAnalytics() {
    try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analytics timeout')), 3000)
        );
        
        const response = await Promise.race([
            fetch('https://knotstranded.com/api/analytics?summary=true'),
            timeoutPromise
        ]);
        const data = await response.json();
        
        // Display analytics
        document.getElementById('analytics-visits').textContent = (data.totalVisits || 0).toLocaleString();
        document.getElementById('analytics-events').textContent = (data.totalEvents || 0).toLocaleString();
        document.getElementById('analytics-subscribers').textContent = (data.subscribers || 0).toLocaleString();
        
        // Find and display most popular tool
        if (data.toolStats && Object.keys(data.toolStats).length > 0) {
            const mostPopular = Object.entries(data.toolStats).reduce((a, b) => a[1] > b[1] ? a : b);
            document.getElementById('analytics-popular').textContent = mostPopular[0] || 'QR Code Generator';
        } else {
            document.getElementById('analytics-popular').textContent = 'QR Code Generator';
        }
    } catch (error) {
        // Silently fail - use default values
        console.log('Analytics unavailable - using defaults');
        document.getElementById('analytics-visits').textContent = '—';
        document.getElementById('analytics-events').textContent = '—';
        document.getElementById('analytics-subscribers').textContent = '—';
        document.getElementById('analytics-popular').textContent = 'QR Code Generator';
    }
}

// ===== Category Color Mapping =====
function getDisplayCategory(dbCategory) {
    const categoryMap = {
        'generator': 'generator',
        'converter': 'converter',
        'encoder': 'encoding',
        'formatter': 'formatter',
        'vocabulary': 'vocabulary',
        'other': 'utility'
    };
    return categoryMap[dbCategory] || 'utility';
}

// Map QR tools to 'qr' category for special coloring
function getCategoryForColor(tool) {
    if (tool.name.includes('QR') || tool.name.includes('Barcode')) {
        return 'qr';
    }
    return getDisplayCategory(tool.category);
}

// ===== Tool Rendering =====
function renderTools(filtered) {
    gridEl.innerHTML = '';
    
    // Group tools by category
    const grouped = {};
    filtered.forEach(tool => {
        if (!grouped[tool.category]) {
            grouped[tool.category] = [];
        }
        grouped[tool.category].push(tool);
    });
    
    // Sort categories in a logical order
    const categoryOrder = ['generator', 'converter', 'encoder', 'formatter', 'vocabulary', 'other'];
    const sortedCategories = categoryOrder.filter(cat => grouped[cat]);
    
    let totalTools = 0;
    
    sortedCategories.forEach(categoryKey => {
        const tools = grouped[categoryKey];
        const meta = categoryMetadata[categoryKey];
        
        totalTools += tools.length;
        
        // Create category section
        const section = document.createElement('div');
        section.className = 'category-section';
        
        // Category header
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <span class="icon">${meta.icon}</span>
            <h2>${meta.name}</h2>
        `;
        section.appendChild(header);
        
        // Category description
        const desc = document.createElement('div');
        desc.className = 'category-description';
        desc.textContent = meta.description;
        section.appendChild(desc);
        
        // Tools grid for this category
        const toolsGrid = document.createElement('div');
        toolsGrid.className = 'category-tools';
        
        tools.forEach(tool => {
            const card = document.createElement('a');
            card.href = tool.path;
            card.className = 'tool-card';
            const colorCategory = getCategoryForColor(tool);
            card.setAttribute('data-category', colorCategory);
            card.innerHTML = `
                <h3>${tool.name}</h3>
                <p>${tool.desc}</p>
                <span class="badge">${getDisplayCategory(tool.category)}</span>
            `;
            toolsGrid.appendChild(card);
        });
        
        section.appendChild(toolsGrid);
        gridEl.appendChild(section);
    });

    resultsInfo.textContent = `Showing ${totalTools} of ${tools.length} tools`;
}

function filterTools() {
    let filtered = tools;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(t => t.category === currentCategory);
    }

    if (currentSearch.trim()) {
        const search = currentSearch.toLowerCase();
        filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(search) || 
            t.desc.toLowerCase().includes(search)
        );
    }

    renderTools(filtered);
}

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filterTools();
    });
});

searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    filterTools();
});

searchBtn.addEventListener('click', () => {
    filterTools();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') filterTools();
});

// Track dashboard view (disabled by default - enable with production analytics endpoint)
// To enable: set VITE_ANALYTICS_API environment variable
// const analyticsApi = process.env.VITE_ANALYTICS_API || null;
// if (analyticsApi) {
//     fetch(analyticsApi, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             timestamp: new Date().toISOString(),
//             event: 'dashboard_view',
//             tag: 'dashboard',
//             userAgent: navigator.userAgent,
//             url: window.location.href,
//             referrer: document.referrer,
//             details: {}
//         }),
//         keepalive: true
//     }).catch(err => console.log('Analytics not available'));
// }

// Initial render with URL parameter support
if (currentCategory !== 'all') {
    // Set the active category button based on URL parameter
    categoryBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === currentCategory) {
            btn.classList.add('active');
        }
    });
    filterTools();
} else {
    renderTools(tools);
}
loadAnalytics();