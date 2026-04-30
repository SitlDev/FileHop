try { require('dotenv').config(); } catch(e) { console.warn('dotenv not found, using env only'); }
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// fetch needs polyfill if node < 18
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => globalThis.fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('uploads/audio')) fs.mkdirSync('uploads/audio', { recursive: true });

// ==========================================
//  ELEVENLABS (TTS) ENDPOINT
// ==========================================
app.post('/api/tts', async (req, res) => {
    const { text, voiceId, key } = req.body;
    const apiKey = key || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'No ElevenLabs key' });

    try {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                'accept': 'audio/mpeg'
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_turbo_v2',
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail && err.detail.message || 'ElevenLabs failed');
        }

        const buffer = await response.buffer();
        const fileName = `voice-${Date.now()}.mp3`;
        const filePath = path.join(__dirname, 'uploads/audio', fileName);
        fs.writeFileSync(filePath, buffer);

        res.json({ url: `${req.protocol}://${req.get('host')}/uploads/audio/${fileName}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
//  EXISTING ANTHROPIC/GOOGLE ENDPOINTS (UNCHANGED)
// ==========================================
app.post('/api/analyze', async (req, res) => {
    const { url, key } = req.body;
    const apiKey = key || process.env.ANTHROPIC_API_KEY;
    try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify(req.body.body)
        });
        const d = await r.json(); res.status(r.status).json(d);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/generate-script', async (req, res) => {
    const { key } = req.body;
    const apiKey = key || process.env.ANTHROPIC_API_KEY;
    try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify(req.body.body)
        });
        const d = await r.json(); res.status(r.status).json(d);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/veo/create', async (req, res) => {
    const { key, model, body } = req.body;
    const apiKey = key || process.env.GEMINI_API_KEY;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateVideo?key=${apiKey}`;
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const d = await r.json(); res.status(r.status).json(d);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/veo/status/:opId', async (req, res) => {
    const key = req.query.key || process.env.GEMINI_API_KEY;
    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${req.params.opId}?key=${key}`);
        const d = await r.json(); res.status(r.status).json(d);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/upload', upload.array('photos', 10), (req, res) => {
    if (!req.files) return res.status(400).json({ error: 'No files uploaded' });
    const urls = req.files.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`);
    res.json({ urls });
});

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
