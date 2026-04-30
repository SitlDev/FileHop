/**
 * Vercel Serverless Function — Prayer Generation
 * Proxies requests to Anthropic Claude, keeping the API key server-side.
 * Route: POST /api/pray
 */
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // CORS — same-origin from Vercel frontend, Capacitor Android/iOS
  const ALLOWED = [
    'capacitor://localhost',
    'ionic://localhost',
    'https://localhost',
    'http://localhost',
    'http://localhost:5173',
  ];
  const origin = req.headers.origin;
  if (!origin || ALLOWED.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  try {
    const { system, user, maxTokens = 1200 } = req.body;

    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_KEY,
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: maxTokens,
      system: system,
      messages: [{ role: "user", content: user }],
    });

    const text = msg.content[0].text;
    res.status(200).json({ text });
  } catch (err) {
    console.error('Prayer error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
