/**
 * Vercel Serverless Function — ElevenLabs TTS
 * Proxies text-to-speech requests, keeping the API key server-side.
 * Route: POST /api/tts
 */

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

  const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVEN_KEY) {
    return res.status(503).json({ error: 'ElevenLabs API key not configured' });
  }

  try {
    const { text, voiceId, isKids = false } = req.body;

    // High stability + low style = slow, calm, measured delivery for kids
    const voice_settings = isKids
      ? { stability: 0.78, similarity_boost: 0.75, style: 0.08, use_speaker_boost: true }
      : { stability: 0.55, similarity_boost: 0.75, style: 0.3,  use_speaker_boost: true };

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVEN_KEY,
          'content-type': 'application/json',
          'accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings,
        }),
      }
    );

    if (!upstream.ok) {
      const err = await upstream.text();
      throw new Error(`ElevenLabs ${upstream.status}: ${err}`);
    }

    const audioBuf = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuf.byteLength);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(Buffer.from(audioBuf));
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
