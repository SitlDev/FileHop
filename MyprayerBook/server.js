#!/usr/bin/env node
/**
 * Local dev backend for My Prayer Book
 * Reads ANTHROPIC_API_KEY from .env.local and proxies requests to Claude.
 *
 * Start: node server.js
 * The Vite dev server proxies /api → http://localhost:3001
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv(file) {
  try {
    const lines = fs.readFileSync(path.join(__dirname, file), "utf8").split("\n");
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv(".env.local");
loadEnv(".env");

const PORT = 3001;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
const ELEVEN_KEY    = process.env.ELEVENLABS_API_KEY;

if (!ANTHROPIC_KEY) {
  console.error("❌  No ANTHROPIC_API_KEY found in .env.local");
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_KEY,
});

// ── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS — allow local dev, Capacitor Android & iOS origins
  const ALLOWED_ORIGINS = [
    'http://localhost:5173',      // Vite dev server
    'http://localhost:3000',      // alternative dev port
    'capacitor://localhost',      // Capacitor Android
    'ionic://localhost',          // Capacitor iOS fallback
    'https://localhost',          // Capacitor iOS WKWebView
    'http://localhost',           // Capacitor Android http fallback
  ];
  const origin = req.headers.origin;
  const allowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === "POST" && req.url === "/api/pray") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const { system, user, maxTokens = 1200 } = JSON.parse(body);

        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-latest",
          max_tokens: maxTokens,
          system: system,
          messages: [{ role: "user", content: user }],
        });

        const text = msg.content[0].text;

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ text }));
      } catch (err) {
        console.error("Prayer error:", err.message);
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/tts") {
    if (!ELEVEN_KEY) {
      res.writeHead(503, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "ElevenLabs API key not configured" }));
      return;
    }
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const { text, voiceId, isKids = false } = JSON.parse(body);
        const voice_settings = isKids
          ? { stability: 0.78, similarity_boost: 0.75, style: 0.08, use_speaker_boost: true }
          : { stability: 0.55, similarity_boost: 0.75, style: 0.3,  use_speaker_boost: true };

        const upstream = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVEN_KEY,
              "content-type": "application/json",
              "accept": "audio/mpeg",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings,
            }),
          }
        );

        if (!upstream.ok) {
          const err = await upstream.text();
          throw new Error(`ElevenLabs ${upstream.status}: ${err}`);
        }

        const audioBuf = await upstream.arrayBuffer();
        res.writeHead(200, {
          "content-type": "audio/mpeg",
          "content-length": audioBuf.byteLength,
          "cache-control": "no-store",
        });
        res.end(Buffer.from(audioBuf));
      } catch (err) {
        console.error("TTS error:", err.message);
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`✅  Prayer backend running → http://localhost:${PORT}`);
  console.log(`    Mode: Anthropic (Claude 3.5 Sonnet)`);
});
