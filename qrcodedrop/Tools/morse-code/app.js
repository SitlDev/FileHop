// Morse code dictionary
const morseDict = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
    "'": '.----.','"': '.-..-.', '!': '-.-.--', '/': '-..-.', '(': '-.--.-',
    ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
    '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-',
    '@': '.--.-.'
};

const reverseMorseDict = {};
for (const [char, morse] of Object.entries(morseDict)) {
    reverseMorseDict[morse] = char;
}

const textInput = document.getElementById('text-input');
const morseOutput = document.getElementById('morse-output');
const encodeBtn = document.getElementById('btn-encode-morse');
const clearBtn = document.getElementById('btn-clear-text');
const playBtn = document.getElementById('btn-play-morse');
const stopBtn = document.getElementById('btn-stop-morse');
const copyBtn = document.getElementById('btn-copy-morse');
const decodeBtn = document.getElementById('btn-decode-morse');
const morseInput = document.getElementById('morse-input');
const decodedOutput = document.getElementById('decoded-output');

const wpmSpeed = document.getElementById('wpm-speed');
const frequency = document.getElementById('frequency');
const volume = document.getElementById('volume');
const wpmDisplay = document.getElementById('wpm-display');
const freqDisplay = document.getElementById('freq-display');
const volDisplay = document.getElementById('vol-display');

const emailModal = document.getElementById('email-modal');
const emailForm = document.getElementById('email-signup-form');

let currentMorse = '';
let audioContext = null;
let isPlaying = false;

// Initialize audio context
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Update displays
wpmSpeed.addEventListener('change', (e) => {
    wpmDisplay.textContent = e.target.value;
    updateDuration();
});

frequency.addEventListener('change', (e) => {
    freqDisplay.textContent = e.target.value;
});

volume.addEventListener('change', (e) => {
    volDisplay.textContent = e.target.value + '%';
});

encodeBtn.addEventListener('click', () => {
    const text = textInput.value.toUpperCase();
    if (!text) {
        morseOutput.textContent = '(enter text to encode)';
        return;
    }
    
    currentMorse = textToMorse(text);
    morseOutput.textContent = currentMorse;
    morseOutput.style.color = '#ffc107';
    
    document.getElementById('morse-length').textContent = currentMorse.replace(/\s/g, '').length;
    updateDuration();
    
    trackEvent('feature_use', 'morse-code', { actionType: 'text_encoded', length: text.length });
});

clearBtn.addEventListener('click', () => {
    textInput.value = '';
    morseOutput.textContent = '(Morse code will appear here)';
    morseOutput.style.color = '#999';
    document.getElementById('morse-length').textContent = '0';
    document.getElementById('morse-duration').textContent = '0.00';
});

playBtn.addEventListener('click', () => {
    if (!currentMorse) {
        alert('Please encode text to Morse first');
        return;
    }
    playMorse(currentMorse);
});

stopBtn.addEventListener('click', () => {
    isPlaying = false;
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentMorse).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    });
});

decodeBtn.addEventListener('click', () => {
    const morse = morseInput.value.trim();
    if (!morse) {
        decodedOutput.textContent = '(enter Morse code to decode)';
        return;
    }
    
    const decoded = morseToText(morse);
    decodedOutput.innerHTML = `<strong>Decoded:</strong> ${decoded}`;
    decodedOutput.style.color = '#4caf50';
    
    trackEvent('feature_use', 'morse-code', { actionType: 'morse_decoded', length: morse.length });
});

function textToMorse(text) {
    return text.split('').map(char => {
        if (char === ' ') return ' / ';
        return morseDict[char] || '';
    }).join(' ').replace(/\s+/g, ' ').trim();
}

function morseToText(morse) {
    return morse.split(' / ').map(word => {
        return word.split(' ').map(letter => reverseMorseDict[letter] || '?').join('');
    }).join(' ');
}

function playMorse(morse) {
    if (isPlaying) return;
    isPlaying = true;
    playBtn.disabled = true;
    stopBtn.disabled = false;
    
    const ctx = getAudioContext();
    const freq = parseInt(frequency.value);
    const vol = parseInt(volume.value) / 100;
    const wpm = parseInt(wpmSpeed.value);
    
    // PARIS standard: dot duration
    const dotDuration = 1.2 / wpm;
    
    let time = ctx.currentTime;
    const symbols = morse.split('');
    
    for (const symbol of symbols) {
        if (!isPlaying) break;
        
        if (symbol === '.') {
            playTone(ctx, freq, vol, dotDuration, time);
            time += dotDuration;
        } else if (symbol === '-') {
            playTone(ctx, freq, vol, dotDuration * 3, time);
            time += dotDuration * 3;
        } else if (symbol === ' ') {
            time += dotDuration;
        }
        time += dotDuration; // gap between symbols
    }
    
    setTimeout(() => {
        isPlaying = false;
        playBtn.disabled = false;
        stopBtn.disabled = true;
    }, (time - ctx.currentTime) * 1000);
}

function playTone(ctx, frequency, volume, duration, startTime) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

function updateDuration() {
    if (!currentMorse) return;
    
    const wpm = parseInt(wpmSpeed.value);
    const dotDuration = 1.2 / wpm;
    
    let totalDuration = 0;
    const symbols = currentMorse.split('');
    
    for (const symbol of symbols) {
        if (symbol === '.') {
            totalDuration += dotDuration * 2;
        } else if (symbol === '-') {
            totalDuration += dotDuration * 4;
        } else if (symbol === ' ') {
            totalDuration += dotDuration;
        }
    }
    
    document.getElementById('morse-duration').textContent = totalDuration.toFixed(2);
    document.getElementById('morse-wpm').textContent = wpm;
}

// Build reference table
function buildReferenceTable() {
    const tbody = document.querySelector('.morse-table tbody');
    const chars = Object.keys(morseDict);
    
    for (let i = 0; i < chars.length; i += 2) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 600;">${chars[i]}</td>
            <td style="font-family: 'Courier New', monospace;">${morseDict[chars[i]]}</td>
            <td style="font-weight: 600;">${chars[i + 1] || ''}</td>
            <td style="font-family: 'Courier New', monospace;">${chars[i + 1] ? morseDict[chars[i + 1]] : ''}</td>
        `;
        tbody.appendChild(row);
    }
}

function trackEvent(eventType, tag, details = {}) {
    fetch('https://knotstranded.com/api/analytics.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: eventType,
            tag: tag,
            details: details,
            url: window.location.href
        })
    }).catch(() => {});
}

// Email modal
emailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    
    fetch('https://knotstranded.com/api/newsletter.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            source: 'morse-code',
            tag: 'morse-code'
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Successfully subscribed!');
        emailModal.style.display = 'none';
        localStorage.setItem('email_modal_closed_morse', 'true');
    })
    .catch(() => alert('Subscription failed. Please try again.'));
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    buildReferenceTable();
    stopBtn.disabled = true;
    
    if (!localStorage.getItem('email_modal_closed_morse')) {
        setTimeout(() => {
            emailModal.style.display = 'block';
        }, 3000);
    }
    
    document.querySelector('.close-modal').addEventListener('click', () => {
        emailModal.style.display = 'none';
        localStorage.setItem('email_modal_closed_morse', 'true');
    });
});
