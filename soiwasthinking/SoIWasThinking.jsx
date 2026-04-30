import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── GOOGLE FONTS ─────────────────────────────────────────────────────────────
const FontLink = () => (
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CONTEXTS = [
  { id: "scrolling",  label: "Scrolling",     emoji: "📱" },
  { id: "talking",    label: "Talking",        emoji: "💬" },
  { id: "working",    label: "Working",        emoji: "💼" },
  { id: "sleepy",     label: "Falling Asleep", emoji: "😴" },
  { id: "driving",    label: "Driving",        emoji: "🚗" },
  { id: "moving",     label: "Moving",         emoji: "🏃" },
  { id: "reading",    label: "Reading",        emoji: "📖" },
  { id: "shower",     label: "Shower",         emoji: "🚿" },
  { id: "eating",     label: "Eating",         emoji: "🍽️" },
  { id: "random",     label: "Nowhere Specific", emoji: "✨" },
];

const MOODS = [
  { id: "pumped",    label: "Pumped",   emoji: "🔥" },
  { id: "thinking",  label: "Thinking", emoji: "🧠" },
  { id: "calm",      label: "Calm",     emoji: "😌" },
  { id: "buzzing",   label: "Buzzing",  emoji: "⚡" },
  { id: "fuzzy",     label: "Fuzzy",    emoji: "🌀" },
];

const STORAGE_KEY = "siwt_v1";
const GRAVEYARD_KEY = "siwt_graveyard_seen_v1"; // tracks last-resurface timestamps per idea

// How many days before we resurface a buried idea
const RESURFACE_AFTER_DAYS = 7;

// ─── VOICE HOOK (MediaRecorder + Claude audio transcription) ─────────────────
function useVoice() {
  const [state, setState] = useState("idle"); // idle | requesting | recording | transcribing | error
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [levels, setLevels] = useState(new Array(20).fill(0)); // waveform bars

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);

  // Waveform animation
  const startWaveform = (stream) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        const bars = Array.from({ length: 20 }, (_, i) => {
          const idx = Math.floor((i / 20) * buf.length);
          return Math.round((buf[idx] / 255) * 100);
        });
        setLevels(bars);
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    } catch {}
  };

  const stopWaveform = () => {
    cancelAnimationFrame(animRef.current);
    setLevels(new Array(20).fill(0));
  };

  // Transcribe via Claude audio input
  const transcribeBlob = async (blob) => {
    setState("transcribing");
    try {
      const ab = await blob.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
      const mimeType = blob.type || "audio/webm";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcribe this voice recording exactly as spoken. Output only the transcribed text, nothing else — no labels, no quotation marks, no commentary.",
              },
              {
                type: "document",
                source: { type: "base64", media_type: mimeType, data: b64 },
              },
            ],
          }],
        }),
      });
      const data = await res.json();
      // Claude may reject audio — fallback gracefully
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.[0]?.text?.trim() || "";
      setTranscript(text);
      setState("idle");
      return text;
    } catch (e) {
      setErrorMsg("Couldn't transcribe. Try again or type it.");
      setState("error");
      return "";
    }
  };

  const start = useCallback(async () => {
    setErrorMsg("");
    setTranscript("");
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick best supported format
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
        .find(m => MediaRecorder.isTypeSupported(m)) || "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(200); // collect chunks every 200ms
      setState("recording");
      startWaveform(stream);
    } catch (e) {
      const msg = e.name === "NotAllowedError"
        ? "Microphone access denied. Please allow mic in your browser settings."
        : "Couldn't access microphone. Try again.";
      setErrorMsg(msg);
      setState("error");
    }
  }, []);

  const stop = useCallback(() => {
    stopWaveform();
    if (!mediaRef.current) return Promise.resolve("");
    return new Promise((resolve) => {
      mediaRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRef.current.mimeType || "audio/webm" });
        streamRef.current?.getTracks().forEach(t => t.stop());
        const text = await transcribeBlob(blob);
        resolve(text);
      };
      try { mediaRef.current.stop(); } catch {}
    });
  }, []);

  const reset = useCallback(() => {
    stopWaveform();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setState("idle");
    setTranscript("");
    setErrorMsg("");
    setLevels(new Array(20).fill(0));
  }, []);

  const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  return { state, transcript, errorMsg, levels, start, stop, reset, supported };
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const loadIdeas = async () => {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
};
const saveIdeas = async (ideas) => {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(ideas)); } catch {}
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const timeAgo = (ts) => {
  const s = Date.now() - ts;
  if (s < 60000) return "just now";
  if (s < 3600000) return `${Math.floor(s / 60000)}m ago`;
  if (s < 86400000) return `${Math.floor(s / 3600000)}h ago`;
  if (s < 172800000) return "yesterday";
  return `${Math.floor(s / 86400000)}d ago`;
};
const daysAgo = (ts) => Math.floor((Date.now() - ts) / 86400000);
const fmtMoney = (n) => {
  if (!n && n !== 0) return "—";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
};

// ─── CLAUDE API ───────────────────────────────────────────────────────────────
const callClaude = async (system, userMsg) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const data = await res.json();
  const raw = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
};

const aiSeed = (rawText, context, mood) => callClaude(
  `You expand raw idea captures into structured briefs. Return ONLY valid JSON, no markdown, no backticks:
{"title":"punchy 4-7 word title","summary":"2 sentence elevator pitch","problem":"the core problem solved","solution":"the key insight or mechanism","uniqueAngle":"what makes this different","tags":["tag1","tag2","tag3"],"excitement":7}`,
  `Raw idea: "${rawText}"\nContext: ${context}\nMood: ${mood}`
);

const aiExecutionPlan = (idea, hrsPerWeek = 10) => callClaude(
  `You build detailed, actionable startup execution roadmaps. Return ONLY valid JSON, no markdown, no backticks:
{
  "nextAction": "The single most important thing to do in the next 24 hours — specific and concrete",
  "totalTimeMonths": 6,
  "totalCostLow": 5000,
  "totalCostHigh": 20000,
  "criticalRisk": "the biggest single risk to success",
  "phases": [
    {
      "id": "phase-1",
      "name": "Phase name",
      "emoji": "🔍",
      "duration": "2 weeks",
      "costRange": "$0–$500",
      "goal": "one sentence — what success looks like at end of this phase",
      "tasks": [
        {
          "id": "t-1-1",
          "label": "Specific action-oriented task",
          "owner": "you",
          "skill": "research | design | code | marketing | sales | legal | finance | ops",
          "effort": "low | medium | high",
          "blocker": ""
        }
      ]
    }
  ]
}
Owner must be one of: "you", "hire", "outsource", "tool".
Include 3-5 phases, 3-6 tasks per phase. Make tasks genuinely specific to this idea.`,
  `Idea: ${idea.title}\nSummary: ${idea.summary}\nProblem: ${idea.problem}\nSolution: ${idea.solution}\nAvailable time: ${hrsPerWeek} hrs/week`
);

const aiRevenuePlan = (idea) => callClaude(
  `You model startup revenue potential. Return ONLY valid JSON, no markdown:
{"model":"SaaS/marketplace/product/service","year1":{"low":10000,"mid":50000,"high":200000},"year3":{"low":100000,"mid":500000,"high":2000000},"assumptions":["assumption1","assumption2","assumption3"],"monetizationStrategies":[{"name":"Strategy","description":"how it works","avgRevPerUser":"$X/mo"}],"timeToFirstRevenue":"3-6 months"}`,
  `Idea: ${idea.title}\nSummary: ${idea.summary}\nSolution: ${idea.solution}`
);

const aiCompScan = (idea) => callClaude(
  `You are a competitive intelligence analyst. Given a startup idea, identify real existing competitors and assess how differentiated the idea is. Return ONLY valid JSON, no markdown, no backticks:
{
  "differentiationScore": 7,
  "verdict": "one sentence plain-English verdict on whether this space is crowded or open",
  "crowdedness": "wide open | some competition | crowded | very crowded",
  "competitors": [
    {
      "name": "Company Name",
      "url": "website.com",
      "description": "what they do in one sentence",
      "fundingStage": "Bootstrapped / Seed / Series A / Series B+ / Public",
      "weakness": "the key gap or weakness vs your idea",
      "similarityScore": 7
    }
  ],
  "whitespace": "description of the gap or angle that competitors are NOT addressing",
  "yourEdge": "the single strongest reason someone would choose this idea over existing options",
  "threat": "low | medium | high",
  "recommendation": "go for it / proceed carefully / needs a sharper angle / very crowded — pivot or niche down"
}`,
  `Idea: ${idea.title}\nSummary: ${idea.summary}\nProblem: ${idea.problem}\nSolution: ${idea.solution}\nUnique angle: ${idea.uniqueAngle}`
);

const aiPatterns = (ideas) => callClaude(
  `You analyze idea patterns and surface insights. Return ONLY valid JSON, no markdown:
{"bestTimeOfDay":"description","bestContext":"most generative context","recurringThemes":["theme1","theme2","theme3"],"subconsciousPatterns":["pattern1","pattern2"],"cognitiveStyle":"description of thinking style","recommendation":"one actionable suggestion"}`,
  JSON.stringify(ideas.map(i => ({
    context: i.context, mood: i.mood,
    hour: new Date(i.createdAt).getHours(),
    rating: i.rating, tags: i.aiData?.tags, title: i.title
  })))
);

const aiRevival = (idea, daysSince) => callClaude(
  `You are a creative strategist who finds new angles in dormant ideas. Return ONLY valid JSON, no markdown:
{
  "hook": "one punchy sentence — why this idea might actually hit differently today",
  "newAngle": "a fresh framing or market shift that makes this more viable now than when it was first captured",
  "quickWin": "the smallest possible first step someone could take in under an hour to test if this is worth pursuing",
  "verdict": "still buried | worth a second look | actually pretty good"
}`,
  `Original idea: "${idea.rawText}"\nTitle: ${idea.aiData?.title || idea.title}\nOriginal gut rating: ${idea.rating}/10\nDays since captured: ${daysSince}\nSummary: ${idea.aiData?.summary || ""}`
);

// ─── GRAVEYARD STORAGE ────────────────────────────────────────────────────────
const loadGraveyardSeen = async () => {
  try {
    const r = await window.storage.get(GRAVEYARD_KEY);
    return r ? JSON.parse(r.value) : {};
  } catch { return {}; }
};
const saveGraveyardSeen = async (seen) => {
  try { await window.storage.set(GRAVEYARD_KEY, JSON.stringify(seen)); } catch {}
};

// ─── COLORS / THEME ───────────────────────────────────────────────────────────
const C = {
  bg:       "#FAFAF7",
  surface:  "#FFFFFF",
  border:   "#EEEEE8",
  text:     "#1A1A2E",
  textMid:  "#6B6B80",
  textSoft: "#9999AA",
  accent:   "#FF6B6B",
  accentBg: "#FFF0F0",
  accentSoft:"rgba(255,107,107,0.12)",
  green:    "#2ECC71",
  greenBg:  "#F0FFF6",
  blue:     "#4A9EFF",
  blueBg:   "#F0F7FF",
  warn:     "#FF9500",
  warnBg:   "#FFF8F0",
};

// ─── BASE STYLES ──────────────────────────────────────────────────────────────
const base = {
  app: {
    fontFamily: "'Poppins', sans-serif",
    background: C.bg,
    color: C.text,
    minHeight: "100vh",
    maxWidth: 430,
    margin: "0 auto",
    position: "relative",
    overflowX: "hidden",
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "16px",
    marginBottom: 10,
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  },
  btn: {
    primary: {
      background: C.accent,
      color: "#fff",
      border: "none",
      borderRadius: 14,
      padding: "15px 24px",
      fontSize: 15,
      fontWeight: 700,
      fontFamily: "'Poppins', sans-serif",
      cursor: "pointer",
      width: "100%",
      letterSpacing: "0.01em",
      boxShadow: `0 4px 20px ${C.accentSoft}`,
      transition: "transform 0.1s, box-shadow 0.1s",
    },
    ghost: {
      background: "transparent",
      color: C.textMid,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "11px 20px",
      fontSize: 13,
      fontWeight: 500,
      fontFamily: "'Poppins', sans-serif",
      cursor: "pointer",
    },
    chip: (active) => ({
      background: active ? C.accentBg : C.surface,
      color: active ? C.accent : C.textMid,
      border: `1.5px solid ${active ? C.accent : C.border}`,
      borderRadius: 50,
      padding: "7px 14px",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      fontFamily: "'Poppins', sans-serif",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.15s",
    }),
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: C.textMid,
    marginBottom: 8,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  input: {
    width: "100%",
    background: C.bg,
    border: `1.5px solid ${C.border}`,
    borderRadius: 12,
    padding: "14px",
    fontSize: 15,
    fontFamily: "'Poppins', sans-serif",
    color: C.text,
    resize: "none",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.6,
    transition: "border-color 0.15s",
  },
  modal: {
    position: "fixed",
    inset: 0,
    zIndex: 300,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    background: "rgba(26,26,46,0.4)",
    backdropFilter: "blur(4px)",
  },
  sheet: {
    background: C.surface,
    borderRadius: "24px 24px 0 0",
    padding: "8px 20px 32px",
    maxHeight: "92vh",
    overflowY: "auto",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
    animation: "slideUp 0.25s ease",
  },
  divider: { height: 1, background: C.border, margin: "14px 0" },
  pill: (color = C.accent) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    background: color + "18",
    color: color,
    borderRadius: 50,
    fontSize: 11,
    fontWeight: 600,
    marginRight: 5,
    marginBottom: 4,
  }),
};

// ─── WELCOME SCREEN ───────────────────────────────────────────────────────────
function WelcomeScreen({ onStart }) {
  return (
    <div style={{
      ...base.app,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "40px 28px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 64, marginBottom: 20, animation: "float 3s ease-in-out infinite" }}>💡</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 10, lineHeight: 1.2 }}>
        So I Was Thinking...
      </div>
      <div style={{ fontSize: 16, color: C.accent, fontWeight: 600, marginBottom: 4 }}>
        Catch it before it's gone.
      </div>
      <div style={{ fontSize: 15, color: C.textMid, marginBottom: 48, lineHeight: 1.7, maxWidth: 280 }}>
        Capture sparks from anywhere — driving, showering, half-asleep — and let AI turn them into real plans.
      </div>
      <button
        style={{ ...base.btn.primary, fontSize: 17, padding: "18px 28px", borderRadius: 16 }}
        onClick={onStart}
      >
        Capture my first idea →
      </button>
      <div style={{ fontSize: 12, color: C.textSoft, marginTop: 16 }}>
        No sign-up. No email. Just ideas.
      </div>
      <style>{`
        @keyframes float {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)}
        }
        @keyframes slideUp {
          from{transform:translateY(100%)} to{transform:translateY(0)}
        }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)}
        }
        @keyframes pulse {
          0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,107,107,0.5)}
          50%{transform:scale(1.08);box-shadow:0 0 0 12px rgba(255,107,107,0)}
        }
        @keyframes ripple {
          0%{transform:scale(1);opacity:0.6}
          100%{transform:scale(2.4);opacity:0}
        }
      `}</style>
    </div>
  );
}

// ─── WAVEFORM DISPLAY ─────────────────────────────────────────────────────────
function Waveform({ levels, color = C.accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 32, justifyContent: "center" }}>
      {levels.map((l, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 3,
          height: Math.max(3, (l / 100) * 32),
          background: color,
          opacity: 0.4 + (l / 100) * 0.6,
          transition: "height 0.08s ease",
        }} />
      ))}
    </div>
  );
}

// ─── CAPTURE SHEET ────────────────────────────────────────────────────────────
function CaptureSheet({ onSave, onClose, initialText = "" }) {
  const [text, setText] = useState(initialText);
  const [context, setContext] = useState(initialText ? "driving" : "random");
  const [mood, setMood] = useState("pumped");
  const [rating, setRating] = useState(7);
  const [saving, setSaving] = useState(false);
  const taRef = useRef();
  const voice = useVoice();

  // When transcription completes, populate text field
  useEffect(() => {
    if (voice.transcript) setText(prev => prev ? prev + " " + voice.transcript : voice.transcript);
  }, [voice.transcript]);

  useEffect(() => {
    if (voice.state === "idle") setTimeout(() => taRef.current?.focus(), 200);
  }, [voice.state]);

  useEffect(() => () => voice.reset(), []);

  const handleMicTap = async () => {
    if (voice.state === "recording") {
      await voice.stop();
    } else if (voice.state === "idle" || voice.state === "error") {
      await voice.start();
    }
  };

  const handleSave = async () => {
    if (voice.state === "recording") await voice.stop();
    if (!text.trim()) return;
    setSaving(true);
    const ctx = CONTEXTS.find(c => c.id === context);
    const moodObj = MOODS.find(m => m.id === mood);
    const idea = {
      id: Date.now().toString(),
      rawText: text, title: text.slice(0, 55),
      context, mood, rating,
      createdAt: Date.now(),
      aiData: null, executionPlan: null, revenuePlan: null, compScan: null,
    };
    onSave(idea);
    setSaving(false);
    onClose();
    try {
      const aiResult = await aiSeed(text, ctx?.label, moodObj?.label);
      idea.aiData = aiResult;
      idea.title = aiResult.title || idea.title;
    } catch {}
  };

  const isRecording = voice.state === "recording";
  const isTranscribing = voice.state === "transcribing";
  const isRequesting = voice.state === "requesting";
  const ratingColor = rating >= 8 ? C.green : rating >= 5 ? C.accent : C.textMid;

  const micIcon = isRecording ? "⏹" : isTranscribing ? "⏳" : isRequesting ? "⏳" : "🎙️";
  const micLabel = isRecording ? "Tap to stop" : isTranscribing ? "Transcribing…" : isRequesting ? "Starting…" : "Voice";

  return (
    <div style={base.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={base.sheet}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 4, margin: "10px auto 18px" }} />
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>What's the idea? ✨</div>

        {/* Text input */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <textarea
            ref={taRef}
            style={{
              ...base.input, minHeight: 100,
              paddingRight: voice.supported ? 50 : 14,
              borderColor: isRecording ? C.accent : C.border,
              boxShadow: isRecording ? `0 0 0 3px ${C.accent}20` : "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            placeholder={isRecording ? "Recording… speak your idea" : "Type or use the mic below…"}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          {voice.supported && (
            <button onClick={handleMicTap} disabled={isTranscribing || isRequesting}
              style={{
                position: "absolute", top: 10, right: 10,
                width: 34, height: 34, borderRadius: "50%",
                background: isRecording ? C.accent : C.bg,
                border: `1.5px solid ${isRecording ? C.accent : C.border}`,
                fontSize: 15, cursor: isTranscribing ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: isRecording ? "pulse 1.4s ease-in-out infinite" : "none",
                transition: "all 0.2s", flexShrink: 0,
              }}>{micIcon}</button>
          )}
        </div>

        {/* Voice status bar */}
        {(isRecording || isTranscribing || isRequesting || voice.errorMsg) && (
          <div style={{
            borderRadius: 10, padding: "10px 14px", marginBottom: 12,
            background: voice.errorMsg ? "#FEF2F2" : C.accentBg,
            border: `1px solid ${voice.errorMsg ? "#FECACA" : C.accent + "30"}`,
          }}>
            {isRecording && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: "pulse 1s infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>Recording — tap ⏹ to stop</span>
                </div>
                <Waveform levels={voice.levels} />
              </div>
            )}
            {(isTranscribing || isRequesting) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>⏳</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textMid }}>
                  {isRequesting ? "Requesting mic access…" : "Transcribing your recording…"}
                </span>
              </div>
            )}
            {voice.errorMsg && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 12, color: "#DC2626", lineHeight: 1.5 }}>{voice.errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Big mic button when text is empty */}
        {!text && voice.supported && voice.state === "idle" && (
          <button onClick={handleMicTap} style={{
            width: "100%", padding: "14px", borderRadius: 12, marginBottom: 14,
            background: C.bg, border: `1.5px dashed ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            cursor: "pointer", fontFamily: "'Poppins',sans-serif",
          }}>
            <span style={{ fontSize: 22 }}>🎙️</span>
            <span style={{ fontSize: 14, color: C.textMid, fontWeight: 500 }}>Tap to speak instead</span>
          </button>
        )}

        <span style={base.label}>Where were you?</span>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 12, scrollbarWidth: "none" }}>
          {CONTEXTS.map(c => (
            <button key={c.id} style={base.btn.chip(context === c.id)} onClick={() => setContext(c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <span style={base.label}>How do you feel about it?</span>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {MOODS.map(m => (
            <button key={m.id} onClick={() => setMood(m.id)} style={{
              flex: 1, padding: "10px 4px",
              border: `1.5px solid ${mood === m.id ? C.accent : C.border}`,
              borderRadius: 12, background: mood === m.id ? C.accentBg : C.surface,
              fontSize: 20, cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3,
            }}>
              <span>{m.emoji}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: mood === m.id ? C.accent : C.textSoft, fontFamily: "'Poppins',sans-serif" }}>{m.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={base.label}>Gut feeling</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: ratingColor }}>{rating}<span style={{ fontSize: 13, color: C.textSoft, fontWeight: 500 }}>/10</span></span>
        </div>
        <input type="range" min={1} max={10} value={rating}
          onChange={e => setRating(Number(e.target.value))}
          style={{ width: "100%", accentColor: C.accent, height: 6, marginBottom: 24, cursor: "pointer" }} />

        <button style={base.btn.primary} onClick={handleSave}
          disabled={saving || (!text.trim() && !isRecording)}>
          {saving ? "Saving…" : "Save it →"}
        </button>
      </div>
    </div>
  );
}

// ─── IDEA CARD ────────────────────────────────────────────────────────────────
function IdeaCard({ idea, onClick }) {
  const ctx = CONTEXTS.find(c => c.id === idea.context);
  const dots = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div style={{ ...base.card, cursor: "pointer", animation: "fadeIn 0.3s ease" }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: C.textSoft }}>
          {ctx?.emoji} {ctx?.label} · {timeAgo(idea.createdAt)}
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {dots.map(d => (
            <div key={d} style={{
              width: 5, height: 5, borderRadius: "50%",
              background: d <= idea.rating ? C.accent : C.border,
              transition: "background 0.1s",
            }} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6, lineHeight: 1.4 }}>
        {idea.aiData?.title || idea.title}
      </div>
      {idea.aiData?.summary && (
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 8 }}>
          {idea.aiData.summary.length > 90 ? idea.aiData.summary.slice(0, 90) + "…" : idea.aiData.summary}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
        {idea.aiData?.tags?.slice(0, 3).map(t => (
          <span key={t} style={base.pill(C.blue)}>#{t}</span>
        ))}
        {!idea.aiData && <span style={{ ...base.pill(C.textSoft), fontSize: 10 }}>✦ AI thinking…</span>}
        {idea.executionPlan && (() => {
          const allTasks = idea.executionPlan.phases?.flatMap(p => p.tasks) || [];
          const done = allTasks.filter(t => (idea.checkedTasks || {})[t.id]).length;
          const pct = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;
          return <span style={base.pill(pct === 100 ? C.green : C.blue)}>{pct === 100 ? "✓ Done" : `${pct}% done`}</span>;
        })()}
        {idea.revenuePlan && <span style={base.pill(C.warn)}>$ Modeled</span>}
        {idea.compScan && <span style={base.pill(C.blue)}>🔍 Scanned</span>}
      </div>
    </div>
  );
}

// ─── IDEAS LIST ───────────────────────────────────────────────────────────────
function IdeasList({ ideas, onSelect, onCapture }) {
  const [filter, setFilter] = useState("all");
  const sorted = [...ideas].sort((a, b) => b.createdAt - a.createdAt);
  const filtered =
    filter === "top" ? sorted.filter(i => i.rating >= 8) :
    filter === "planned" ? sorted.filter(i => i.executionPlan) : sorted;

  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>So I Was Thinking 💡</div>
          <div style={{ fontSize: 13, color: C.textMid }}>{ideas.length} idea{ideas.length !== 1 ? "s" : ""} saved</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all", "All"], ["top", "⭐ Top"], ["planned", "✓ Planned"]].map(([v, l]) => (
          <button key={v} style={base.btn.chip(filter === v)} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.textSoft }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.textMid, marginBottom: 8 }}>
            {filter === "all" ? "No ideas yet!" : "Nothing here yet."}
          </div>
          <div style={{ fontSize: 14, marginBottom: 24 }}>
            {filter === "all" ? "Tap + to capture your first one." : "Keep capturing ideas!"}
          </div>
          {filter === "all" && (
            <button style={{ ...base.btn.primary, width: "auto", padding: "14px 28px" }} onClick={onCapture}>
              Capture an idea →
            </button>
          )}
        </div>
      )}
      {filtered.map(idea => (
        <IdeaCard key={idea.id} idea={idea} onClick={() => onSelect(idea)} />
      ))}
    </div>
  );
}

// ─── IDEA DETAIL ──────────────────────────────────────────────────────────────
function IdeaDetail({ idea, onUpdate, onClose, onBury, onRevive }) {
  const [tab, setTab] = useState("idea");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingRev, setLoadingRev] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [hrsPerWeek, setHrsPerWeek] = useState(10);
  const [checkedTasks, setCheckedTasks] = useState(() => idea.checkedTasks || {});
  const ctx = CONTEXTS.find(c => c.id === idea.context);
  const moodObj = MOODS.find(m => m.id === idea.mood);

  const buildPlan = async () => {
    setLoadingPlan(true);
    try {
      const plan = await aiExecutionPlan(
        idea.aiData || { title: idea.title, summary: idea.rawText, problem: "", solution: "" },
        hrsPerWeek
      );
      onUpdate({ ...idea, executionPlan: plan, checkedTasks: {} });
      setCheckedTasks({});
    } catch {}
    setLoadingPlan(false);
  };

  const toggleTask = (taskId) => {
    const next = { ...checkedTasks, [taskId]: !checkedTasks[taskId] };
    setCheckedTasks(next);
    onUpdate({ ...idea, checkedTasks: next });
  };

  const buildRevenue = async () => {
    setLoadingRev(true);
    try {
      const rev = await aiRevenuePlan(idea.aiData || { title: idea.title, summary: idea.rawText, solution: "" });
      onUpdate({ ...idea, revenuePlan: rev });
    } catch {}
    setLoadingRev(false);
  };

  const buildCompScan = async () => {
    setLoadingComp(true);
    try {
      const comp = await aiCompScan(idea.aiData || { title: idea.title, summary: idea.rawText, problem: "", solution: "", uniqueAngle: "" });
      onUpdate({ ...idea, compScan: comp });
    } catch {}
    setLoadingComp(false);
  };

  const tabs = [
    { id: "idea",  label: "The Idea" },
    { id: "plan",  label: "Make It Happen" },
    { id: "money", label: "The Money" },
    { id: "comp",  label: "Who Else?" },
  ];

  return (
    <div style={{ ...base.app, position: "fixed", inset: 0, zIndex: 200, overflowY: "auto", background: C.bg }}>
      {/* Header */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "16px 16px 0", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <button onClick={onClose} style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Poppins',sans-serif", color: C.textMid,
          }}>← Back</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.textSoft }}>
              {ctx?.emoji} {ctx?.label} · {moodObj?.emoji} {moodObj?.label} · {timeAgo(idea.createdAt)}
            </div>
          </div>
          {idea.buried ? (
            <button onClick={() => { onRevive(idea.id); onClose(); }} style={{
              background: C.greenBg, border: `1px solid ${C.green}44`, borderRadius: 10,
              padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Poppins',sans-serif", color: C.green,
            }}>↑ Revive</button>
          ) : (
            <button onClick={() => { onBury(idea.id); onClose(); }} style={{
              background: "#FAF8FF", border: "1px solid #E8E0F0", borderRadius: 10,
              padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Poppins',sans-serif", color: C.textSoft,
            }}>🪦 Shelve</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flexShrink: 0, padding: "10px 14px", background: "none", border: "none",
              borderBottom: tab === t.id ? `2.5px solid ${C.accent}` : "2.5px solid transparent",
              color: tab === t.id ? C.accent : C.textSoft,
              fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
              cursor: "pointer", fontFamily: "'Poppins',sans-serif",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 80px" }}>
        {/* ── THE IDEA TAB ── */}
        {tab === "idea" && (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 16, color: C.text }}>
              {idea.aiData?.title || idea.title}
            </div>

            <div style={base.card}>
              <span style={base.label}>What you captured</span>
              <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7 }}>{idea.rawText}</div>
            </div>

            {idea.aiData ? (
              <>
                <div style={base.card}>
                  <span style={base.label}>AI-expanded brief</span>
                  <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: 14, fontWeight: 500 }}>
                    {idea.aiData.summary}
                  </div>
                  <div style={base.divider} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div style={{ background: C.bg, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, letterSpacing: "0.07em", marginBottom: 4 }}>THE PROBLEM</div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{idea.aiData.problem}</div>
                    </div>
                    <div style={{ background: C.bg, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, letterSpacing: "0.07em", marginBottom: 4 }}>THE SOLUTION</div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{idea.aiData.solution}</div>
                    </div>
                  </div>
                  <div style={{ background: C.accentBg, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: "0.07em", marginBottom: 4 }}>WHAT MAKES IT DIFFERENT</div>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{idea.aiData.uniqueAngle}</div>
                  </div>
                  <div>{idea.aiData.tags?.map(t => <span key={t} style={base.pill(C.blue)}>#{t}</span>)}</div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>{idea.rating}<span style={{ fontSize: 14, color: C.textSoft, fontWeight: 500 }}>/10</span></div>
                    <div style={{ fontSize: 11, color: C.textSoft, fontWeight: 600 }}>YOUR GUT</div>
                  </div>
                  <div style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>{idea.aiData.excitement}<span style={{ fontSize: 14, color: C.textSoft, fontWeight: 500 }}>/10</span></div>
                    <div style={{ fontSize: 11, color: C.textSoft, fontWeight: 600 }}>AI SCORE</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ ...base.card, textAlign: "center", color: C.textSoft, padding: "24px" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✦</div>
                <div>AI is still thinking about this one…</div>
              </div>
            )}
          </>
        )}

        {/* ── MAKE IT HAPPEN TAB ── */}
        {tab === "plan" && (() => {
          const plan = idea.executionPlan;

          // Compute progress
          const allTasks = plan?.phases?.flatMap(p => p.tasks) || [];
          const doneCount = allTasks.filter(t => checkedTasks[t.id]).length;
          const pct = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;

          // Adjust timeline based on hrs/week vs plan's assumed hrs
          const adjustedMonths = plan
            ? Math.ceil((plan.totalTimeMonths * 10) / Math.max(hrsPerWeek, 1))
            : null;

          const ownerColor = { you: C.blue, hire: C.warn, outsource: C.accent, tool: C.green };
          const ownerLabel = { you: "You", hire: "Hire", outsource: "Outsource", tool: "Use a tool" };
          const effortDots = { low: 1, medium: 2, high: 3 };

          if (!plan) return (
            <div style={{ paddingTop: 20 }}>
              {/* Hours per week slider — shown before generating */}
              <div style={{ ...base.card, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>How many hours a week can you commit?</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>{hrsPerWeek}<span style={{ fontSize: 13, color: C.textSoft, fontWeight: 400 }}>h</span></span>
                </div>
                <input type="range" min={2} max={40} step={1} value={hrsPerWeek}
                  onChange={e => setHrsPerWeek(Number(e.target.value))}
                  style={{ width: "100%", accentColor: C.accent, cursor: "pointer" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSoft, marginTop: 4 }}>
                  <span>2h (side project)</span><span>40h (full-time)</span>
                </div>
              </div>

              <div style={{ textAlign: "center", padding: "24px 20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Let's map it out.</div>
                <div style={{ fontSize: 14, color: C.textMid, marginBottom: 28, lineHeight: 1.6 }}>
                  Get a phase-by-phase plan with specific tasks, who handles what, and how long it really takes at {hrsPerWeek}h/week.
                </div>
                <button style={base.btn.primary} onClick={buildPlan} disabled={loadingPlan}>
                  {loadingPlan ? "Building your plan…" : "Build my action plan →"}
                </button>
              </div>
            </div>
          );

          return (
            <div>
              {/* ── HEADER STATS ── */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center", padding: "12px 8px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>{pct}%</div>
                  <div style={{ fontSize: 10, color: C.textSoft, fontWeight: 600 }}>DONE</div>
                </div>
                <div style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center", padding: "12px 8px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.blue }}>{doneCount}/{allTasks.length}</div>
                  <div style={{ fontSize: 10, color: C.textSoft, fontWeight: 600 }}>TASKS</div>
                </div>
                <div style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center", padding: "12px 8px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>{adjustedMonths}mo</div>
                  <div style={{ fontSize: 10, color: C.textSoft, fontWeight: 600 }}>AT {hrsPerWeek}H/WK</div>
                </div>
              </div>

              {/* ── PROGRESS BAR ── */}
              <div style={{ ...base.card, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Overall Progress</span>
                  <span style={{ fontSize: 12, color: pct === 100 ? C.green : C.textMid, fontWeight: 600 }}>
                    {pct === 100 ? "🎉 Complete!" : `${doneCount} of ${allTasks.length} tasks done`}
                  </span>
                </div>
                <div style={{ height: 10, background: C.border, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: pct === 100 ? C.green : C.accent,
                    borderRadius: 10, transition: "width 0.4s ease",
                  }} />
                </div>
              </div>

              {/* ── NEXT ACTION ── */}
              {plan.nextAction && (
                <div style={{ ...base.card, background: C.accentBg, borderColor: C.accent + "40", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "0.08em", marginBottom: 6 }}>⚡ DO THIS NEXT</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.5 }}>{plan.nextAction}</div>
                </div>
              )}

              {/* ── HRS/WEEK ADJUSTER ── */}
              <div style={{ ...base.card, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Hours per week</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>{hrsPerWeek}h<span style={{ fontSize: 11, color: C.textSoft, fontWeight: 400 }}>/wk → {adjustedMonths} months</span></span>
                </div>
                <input type="range" min={2} max={40} step={1} value={hrsPerWeek}
                  onChange={e => setHrsPerWeek(Number(e.target.value))}
                  style={{ width: "100%", accentColor: C.blue, cursor: "pointer" }} />
              </div>

              {/* ── PHASE CARDS ── */}
              {plan.phases?.map((phase, pi) => {
                const phaseDone = phase.tasks.filter(t => checkedTasks[t.id]).length;
                const phaseTotal = phase.tasks.length;
                const phasePct = phaseTotal ? Math.round((phaseDone / phaseTotal) * 100) : 0;
                const phaseComplete = phasePct === 100;

                return (
                  <div key={phase.id} style={{
                    ...base.card,
                    borderColor: phaseComplete ? C.green + "60" : C.border,
                    marginBottom: 12,
                  }}>
                    {/* Phase header */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: phaseComplete ? C.greenBg : C.bg,
                        border: `1.5px solid ${phaseComplete ? C.green + "60" : C.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                      }}>{phaseComplete ? "✓" : phase.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: C.accent, marginRight: 6 }}>#{pi + 1}</span>
                            {phase.name}
                          </div>
                          <div style={{ fontSize: 11, color: C.textSoft }}>{phase.duration}</div>
                        </div>
                        <div style={{ fontSize: 11, color: C.textMid, marginTop: 2 }}>{phase.goal}</div>
                      </div>
                    </div>

                    {/* Phase progress mini-bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${phasePct}%`, background: phaseComplete ? C.green : C.accent, borderRadius: 10, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontSize: 10, color: C.textSoft, minWidth: 36 }}>{phaseDone}/{phaseTotal}</div>
                      <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, minWidth: 36 }}>{phase.costRange}</div>
                    </div>

                    {/* Tasks */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {phase.tasks.map((task) => {
                        const done = !!checkedTasks[task.id];
                        const dotCount = effortDots[task.effort] || 1;
                        return (
                          <div
                            key={task.id}
                            onClick={() => toggleTask(task.id)}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: 10,
                              padding: "10px 12px", borderRadius: 10,
                              background: done ? C.greenBg : C.bg,
                              border: `1px solid ${done ? C.green + "50" : C.border}`,
                              cursor: "pointer", transition: "all 0.15s",
                            }}
                          >
                            {/* Checkbox */}
                            <div style={{
                              width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                              background: done ? C.green : C.surface,
                              border: `2px solid ${done ? C.green : C.border}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, color: "#fff", transition: "all 0.15s",
                              marginTop: 1,
                            }}>{done ? "✓" : ""}</div>

                            {/* Task content */}
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: 13, fontWeight: 500,
                                color: done ? C.textSoft : C.text,
                                textDecoration: done ? "line-through" : "none",
                                lineHeight: 1.4,
                              }}>{task.label}</div>
                              <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                                {/* Owner badge */}
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 50,
                                  background: (ownerColor[task.owner] || C.blue) + "18",
                                  color: ownerColor[task.owner] || C.blue,
                                }}>
                                  {ownerLabel[task.owner] || task.owner}
                                </span>
                                {/* Skill badge */}
                                <span style={{
                                  fontSize: 10, padding: "2px 7px", borderRadius: 50,
                                  background: C.bg, border: `1px solid ${C.border}`,
                                  color: C.textSoft,
                                }}>{task.skill}</span>
                                {/* Effort dots */}
                                <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  {[1,2,3].map(d => (
                                    <div key={d} style={{
                                      width: 5, height: 5, borderRadius: "50%",
                                      background: d <= dotCount ? C.warn : C.border,
                                    }} />
                                  ))}
                                </span>
                                {/* Blocker */}
                                {task.blocker && (
                                  <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 600 }}>⚠ {task.blocker}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* ── SUMMARY FOOTER ── */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center", padding: "12px 8px" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                    {fmtMoney(plan.totalCostLow)}–{fmtMoney(plan.totalCostHigh)}
                  </div>
                  <div style={{ fontSize: 10, color: C.textSoft }}>TOTAL BUDGET</div>
                </div>
                <div style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center", padding: "12px 8px" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{plan.totalTimeMonths}mo</div>
                  <div style={{ fontSize: 10, color: C.textSoft }}>BASE TIMELINE</div>
                </div>
              </div>

              {/* Critical risk */}
              {plan.criticalRisk && (
                <div style={{ ...base.card, background: C.warnBg, borderColor: C.warn + "44", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.warn, marginBottom: 4 }}>⚠️ Biggest Risk</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{plan.criticalRisk}</div>
                </div>
              )}

              {/* Rebuild button */}
              <button style={{ ...base.btn.ghost, width: "100%", marginBottom: 8 }}
                onClick={buildPlan} disabled={loadingPlan}>
                {loadingPlan ? "Rebuilding…" : "↺ Rebuild plan"}
              </button>
            </div>
          );
        })()}

        {/* ── THE MONEY TAB ── */}
        {tab === "money" && (
          <>
            {!idea.revenuePlan ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>What could this make?</div>
                <div style={{ fontSize: 14, color: C.textMid, marginBottom: 28, lineHeight: 1.6 }}>
                  See realistic, mid, and best-case revenue projections if you actually built this.
                </div>
                <button style={base.btn.primary} onClick={buildRevenue} disabled={loadingRev}>
                  {loadingRev ? "Running the numbers..." : "Show me the money →"}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Revenue Potential 💰</div>
                  <div style={{ ...base.pill(C.green), fontSize: 12 }}>First $ in {idea.revenuePlan.timeToFirstRevenue}</div>
                </div>

                {[["Year 1", idea.revenuePlan.year1], ["Year 3", idea.revenuePlan.year3]].map(([yr, data]) => (
                  <div key={yr} style={base.card}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{yr} Projection</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[["Realistic", data?.low, C.textMid], ["Middle", data?.mid, C.blue], ["Best Case", data?.high, C.green]].map(([l, v, c]) => (
                        <div key={l} style={{ flex: 1, textAlign: "center", background: C.bg, borderRadius: 10, padding: "10px 4px" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: C.textSoft, letterSpacing: "0.06em", marginBottom: 4 }}>{l.toUpperCase()}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{fmtMoney(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 10px" }}>How You'd Make Money</div>
                {idea.revenuePlan.monetizationStrategies?.map((s, i) => (
                  <div key={i} style={base.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>{s.avgRevPerUser}</div>
                    </div>
                    <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{s.description}</div>
                  </div>
                ))}

                <div style={base.card}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Key Assumptions</div>
                  {idea.revenuePlan.assumptions?.map((a, i) => (
                    <div key={i} style={{ fontSize: 13, color: C.textMid, padding: "4px 0", display: "flex", gap: 8 }}>
                      <span>·</span>{a}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {/* ── WHO ELSE? TAB ── */}
        {tab === "comp" && (
          <>
            {!idea.compScan ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Who's already doing this?</div>
                <div style={{ fontSize: 14, color: C.textMid, marginBottom: 28, lineHeight: 1.6 }}>
                  See who's out there, how crowded the space is, and whether your angle is actually different.
                </div>
                <button style={base.btn.primary} onClick={buildCompScan} disabled={loadingComp}>
                  {loadingComp ? "Scanning the competition..." : "Scan the competition →"}
                </button>
              </div>
            ) : (() => {
              const cs = idea.compScan;
              const scoreColor = cs.differentiationScore >= 7 ? C.green : cs.differentiationScore >= 4 ? C.warn : C.accent;
              const threatColor = cs.threat === "low" ? C.green : cs.threat === "medium" ? C.warn : "#EF4444";
              const crowdBg = cs.crowdedness === "wide open" ? C.greenBg : cs.crowdedness === "some competition" ? C.blueBg : cs.crowdedness === "crowded" ? C.warnBg : "#FEF2F2";
              const crowdColor = cs.crowdedness === "wide open" ? C.green : cs.crowdedness === "some competition" ? C.blue : cs.crowdedness === "crowded" ? C.warn : "#EF4444";
              const recEmoji = cs.recommendation?.startsWith("go") ? "🟢" : cs.recommendation?.startsWith("proceed") ? "🟡" : cs.recommendation?.startsWith("needs") ? "🟠" : "🔴";
              return (
                <>
                  {/* Hero score row */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center" }}>
                      <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor }}>{cs.differentiationScore}<span style={{ fontSize: 14, color: C.textSoft, fontWeight: 500 }}>/10</span></div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSoft, letterSpacing: "0.05em" }}>HOW DIFFERENT</div>
                    </div>
                    <div style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center" }}>
                      <div style={{ fontSize: 22, marginBottom: 2 }}>{cs.threat === "low" ? "😌" : cs.threat === "medium" ? "😐" : "😬"}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: threatColor, textTransform: "capitalize" }}>{cs.threat} Threat</div>
                      <div style={{ fontSize: 10, color: C.textSoft, fontWeight: 600 }}>COMPETITIVE</div>
                    </div>
                  </div>

                  {/* Crowdedness badge */}
                  <div style={{ background: crowdBg, borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 20 }}>
                      {cs.crowdedness === "wide open" ? "🌅" : cs.crowdedness === "some competition" ? "🌤️" : cs.crowdedness === "crowded" ? "⛅" : "🌧️"}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: crowdColor, textTransform: "capitalize", marginBottom: 2 }}>{cs.crowdedness}</div>
                      <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{cs.verdict}</div>
                    </div>
                  </div>

                  {/* Competitors */}
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                    Who's out there ({cs.competitors?.length || 0} found)
                  </div>
                  {cs.competitors?.map((comp, i) => (
                    <div key={i} style={base.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{comp.name}</div>
                          <div style={{ fontSize: 11, color: C.textSoft }}>{comp.url} · {comp.fundingStage}</div>
                        </div>
                        {/* Similarity bar */}
                        <div style={{ textAlign: "center", minWidth: 44 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: comp.similarityScore >= 7 ? "#EF4444" : comp.similarityScore >= 4 ? C.warn : C.green }}>
                            {comp.similarityScore}/10
                          </div>
                          <div style={{ fontSize: 9, color: C.textSoft, fontWeight: 600 }}>SIMILAR</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: C.textMid, marginBottom: 8, lineHeight: 1.5 }}>{comp.description}</div>
                      <div style={{ background: C.greenBg, borderRadius: 8, padding: "8px 10px", display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 12 }}>💪</span>
                        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}><strong>Their gap:</strong> {comp.weakness}</div>
                      </div>
                    </div>
                  ))}

                  {/* Whitespace */}
                  <div style={{ ...base.card, background: C.accentBg, borderColor: C.accent + "33" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 6 }}>🎯 The gap nobody's filling</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{cs.whitespace}</div>
                  </div>

                  {/* Your edge */}
                  <div style={{ ...base.card, background: C.greenBg, borderColor: C.green + "33" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 6 }}>⚡ Your strongest angle</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{cs.yourEdge}</div>
                  </div>

                  {/* Verdict */}
                  <div style={{ ...base.card, borderColor: C.border }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>Bottom line</div>
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600, lineHeight: 1.5 }}>
                      {recEmoji} {cs.recommendation}
                    </div>
                  </div>

                  <button style={{ ...base.btn.ghost, width: "100%", marginTop: 4 }} onClick={buildCompScan} disabled={loadingComp}>
                    {loadingComp ? "Rescanning..." : "Rescan →"}
                  </button>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
function PatternsView({ ideas }) {
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try { setPatterns(await aiPatterns(ideas)); } catch {}
    setLoading(false);
  };

  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
    h, count: ideas.filter(i => new Date(i.createdAt).getHours() === h).length,
  }));
  const maxCount = Math.max(...hourBuckets.map(b => b.count), 1);

  const ctxStats = CONTEXTS.map(c => ({
    ...c,
    count: ideas.filter(i => i.context === c.id).length,
    avg: ideas.filter(i => i.context === c.id).reduce((s, i) => s + i.rating, 0) /
         (ideas.filter(i => i.context === c.id).length || 1),
  })).filter(c => c.count > 0).sort((a, b) => b.avg - a.avg);

  const topIdeas = [...ideas].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const avgRating = ideas.length ? (ideas.reduce((s, i) => s + i.rating, 0) / ideas.length).toFixed(1) : "—";

  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Your Patterns ✦</div>
      <div style={{ fontSize: 13, color: C.textMid, marginBottom: 20 }}>When and how you think best.</div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          [ideas.length, "Ideas"],
          [avgRating, "Avg Rating"],
          [ideas.filter(i => i.executionPlan).length, "Planned"],
        ].map(([v, l]) => (
          <div key={l} style={{ ...base.card, flex: 1, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.accent }}>{v}</div>
            <div style={{ fontSize: 11, color: C.textSoft, fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={base.card}>
        <span style={base.label}>When ideas hit you</span>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 48, marginBottom: 8 }}>
          {hourBuckets.map(b => (
            <div key={b.h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
              <div style={{
                width: "100%", borderRadius: "3px 3px 0 0",
                height: b.count > 0 ? Math.max(4, (b.count / maxCount) * 44) : 3,
                background: b.count > 0 ? `rgba(255,107,107,${0.25 + (b.count / maxCount) * 0.75})` : C.border,
                transition: "height 0.3s",
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textSoft }}>
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
        </div>
      </div>

      {ctxStats.length > 0 && (
        <div style={base.card}>
          <span style={base.label}>Best situations for ideas</span>
          {ctxStats.slice(0, 6).map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 14 }}>{c.emoji}</div>
              <div style={{ fontSize: 12, width: 80, color: C.textMid }}>{c.label}</div>
              <div style={{ flex: 1, height: 7, background: C.border, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(c.avg / 10) * 100}%`, background: C.accent, borderRadius: 10, transition: "width 0.5s" }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, width: 28 }}>{c.avg.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: C.textSoft }}>×{c.count}</div>
            </div>
          ))}
        </div>
      )}

      {topIdeas.length > 0 && (
        <div style={base.card}>
          <span style={base.label}>Your top rated ideas</span>
          {topIdeas.map((idea, i) => (
            <div key={idea.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < topIdeas.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.accent, width: 20 }}>#{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 500 }}>{idea.aiData?.title || idea.title}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{idea.rating}/10</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>What do your ideas say about you?</div>
      {!patterns ? (
        <button
          style={base.btn.primary}
          onClick={analyze}
          disabled={loading || ideas.length < 3}
        >
          {loading ? "Analyzing your patterns..." : ideas.length < 3 ? "Save 3+ ideas to unlock" : "Find my patterns →"}
        </button>
      ) : (
        <div style={base.card}>
          {[
            ["⏰ Peak idea time", patterns.bestTimeOfDay],
            ["📍 Best situation", patterns.bestContext],
            ["🧠 How you think", patterns.cognitiveStyle],
          ].map(([label, val]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{val}</div>
            </div>
          ))}
          <div style={base.divider} />
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>🔄 Recurring themes</div>
            <div>{patterns.recurringThemes?.map(t => <span key={t} style={base.pill(C.blue)}>#{t}</span>)}</div>
          </div>
          {patterns.subconsciousPatterns?.length > 0 && (
            <div style={{ background: C.warnBg, borderRadius: 10, padding: "12px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.warn, marginBottom: 6 }}>🌀 Things your subconscious keeps returning to</div>
              {patterns.subconsciousPatterns.map((p, i) => (
                <div key={i} style={{ fontSize: 13, color: C.text, padding: "2px 0" }}>· {p}</div>
              ))}
            </div>
          )}
          <div style={{ background: C.greenBg, borderRadius: 10, padding: "12px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 4 }}>💡 One thing to try</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{patterns.recommendation}</div>
          </div>
          <button style={{ ...base.btn.ghost, width: "100%", marginTop: 12 }} onClick={analyze}>Re-analyze →</button>
        </div>
      )}
    </div>
  );
}

// ─── GRAVEYARD MODAL (resurface prompt) ───────────────────────────────────────
function GraveyardModal({ ideas, onClose, onRevive, onKeepBuried, onDelete }) {
  const [idx, setIdx] = useState(0);
  const [revival, setRevival] = useState(null);
  const [loadingRevival, setLoadingRevival] = useState(false);
  const [exiting, setExiting] = useState(false);

  const idea = ideas[idx];
  if (!idea) { onClose(); return null; }

  const days = daysAgo(idea.buriedAt || idea.createdAt);
  const timeLabel = days < 7 ? `${days} days ago`
    : days < 30 ? `${Math.round(days / 7)} weeks ago`
    : days < 365 ? `${Math.round(days / 30)} months ago`
    : `${Math.round(days / 365)} year${days >= 730 ? "s" : ""} ago`;

  const fetchRevival = async () => {
    setLoadingRevival(true);
    try {
      const r = await aiRevival(idea, days);
      setRevival(r);
    } catch {}
    setLoadingRevival(false);
  };

  const advance = (action) => {
    setExiting(true);
    setTimeout(() => {
      setRevival(null);
      setExiting(false);
      if (idx + 1 >= ideas.length) { action(); onClose(); }
      else { action(); setIdx(i => i + 1); }
    }, 220);
  };

  const verdictColor = {
    "still buried": C.textSoft,
    "worth a second look": C.warn,
    "actually pretty good": C.green,
  }[revival?.verdict] || C.textSoft;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(10,8,20,0.88)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px 20px",
      fontFamily: "'Poppins', sans-serif",
      maxWidth: 430, left: "50%", transform: "translateX(-50%)",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🪦</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>From the Graveyard</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
          You shelved this {timeLabel} — still feel that way?
        </div>
        {ideas.length > 1 && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
            {idx + 1} of {ideas.length} ideas waiting
          </div>
        )}
      </div>

      {/* Idea card */}
      <div style={{
        width: "100%", background: "#16121e", borderRadius: 20,
        padding: "20px", marginBottom: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        opacity: exiting ? 0 : 1,
        transform: exiting ? "translateY(12px)" : "translateY(0)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}>
        {/* Original rating */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
            CAPTURED {timeLabel.toUpperCase()}
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: i < idea.rating ? C.accent : "rgba(255,255,255,0.1)",
              }} />
            ))}
          </div>
        </div>

        <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: 8 }}>
          {idea.aiData?.title || idea.title}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 12 }}>
          {idea.aiData?.summary || idea.rawText?.slice(0, 120)}
        </div>

        {/* AI Revival section */}
        {!revival && !loadingRevival && (
          <button onClick={fetchRevival} style={{
            width: "100%", padding: "10px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            ✦ Get a fresh take on this idea
          </button>
        )}

        {loadingRevival && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "rgba(255,255,255,0.3)",
                animation: `drivePulse 0.8s ease ${i * 0.15}s infinite`,
              }} />
            ))}
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Thinking…</span>
          </div>
        )}

        {revival && (
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px",
            borderLeft: `3px solid ${verdictColor}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: verdictColor, marginBottom: 6 }}>
              {revival.verdict === "still buried" ? "😴 Still nah" :
               revival.verdict === "worth a second look" ? "🤔 Hold on…" : "💥 Wait, actually"}
            </div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 8, lineHeight: 1.5 }}>
              {revival.hook}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 8 }}>
              {revival.newAngle}
            </div>
            <div style={{
              background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 10px",
              fontSize: 12, color: "rgba(255,255,255,0.7)",
            }}>
              <span style={{ fontWeight: 700 }}>Quick win:</span> {revival.quickWin}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        <button onClick={() => advance(() => onRevive(idea.id))} style={{
          padding: "16px", borderRadius: 14,
          background: C.accent, border: "none",
          color: "#fff", fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: `0 4px 20px ${C.accent}44`,
        }}>
          ✦ Actually, I want to build this
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => advance(() => onKeepBuried(idea.id))} style={{
            flex: 1, padding: "14px", borderRadius: 12,
            background: "rgba(255,255,255,0.08)", border: "none",
            color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            😴 Still not it
          </button>
          <button onClick={() => advance(() => onDelete(idea.id))} style={{
            flex: 1, padding: "14px", borderRadius: 12,
            background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.15)",
            color: "rgba(255,100,100,0.7)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            🗑 Delete forever
          </button>
        </div>

        <button onClick={onClose} style={{
          padding: "12px", background: "none", border: "none",
          color: "rgba(255,255,255,0.25)", fontSize: 12,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          Remind me later
        </button>
      </div>
    </div>
  );
}

// ─── GRAVEYARD VIEW (browse all buried ideas) ─────────────────────────────────
function GraveyardView({ ideas, onRevive, onDelete, onSelectIdea }) {
  const buried = ideas
    .filter(i => i.buried)
    .sort((a, b) => (b.buriedAt || b.createdAt) - (a.buriedAt || a.createdAt));

  if (buried.length === 0) return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>Graveyard's empty</div>
      <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.6 }}>
        Ideas you shelve or rate 1–3 will rest here until you're ready to look at them again.
      </div>
    </div>
  );

  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Graveyard 🪦</div>
      <div style={{ fontSize: 13, color: C.textMid, marginBottom: 20 }}>
        {buried.length} idea{buried.length !== 1 ? "s" : ""} resting here. Maybe one deserves a second chance.
      </div>

      {buried.map(idea => {
        const days = daysAgo(idea.buriedAt || idea.createdAt);
        const ctx = CONTEXTS.find(c => c.id === idea.context);
        return (
          <div key={idea.id} style={{
            ...base.card,
            borderColor: "#E8E0F0",
            background: "#FAF8FF",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Faded diagonal stripe pattern for "buried" feel */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.03,
              backgroundImage: "repeating-linear-gradient(-45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
              backgroundSize: "12px 12px",
              pointerEvents: "none",
            }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, position: "relative" }}>
              <div style={{ fontSize: 11, color: C.textSoft }}>
                {ctx?.emoji} {ctx?.label} · buried {days < 1 ? "today" : days < 7 ? `${days}d ago` : days < 30 ? `${Math.round(days/7)}wk ago` : `${Math.round(days/30)}mo ago`}
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: "50%",
                    background: i < idea.rating ? "#C9B8DC" : C.border,
                  }} />
                ))}
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6, lineHeight: 1.4, position: "relative" }}>
              {idea.aiData?.title || idea.title}
            </div>

            {idea.aiData?.summary && (
              <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6, marginBottom: 10, position: "relative" }}>
                {idea.aiData.summary.slice(0, 100)}…
              </div>
            )}

            <div style={{ display: "flex", gap: 8, position: "relative" }}>
              <button onClick={() => onRevive(idea.id)} style={{
                flex: 2, padding: "9px 12px", borderRadius: 10,
                background: C.accent, border: "none",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>↑ Revive</button>
              <button onClick={() => onSelectIdea(idea)} style={{
                flex: 2, padding: "9px 12px", borderRadius: 10,
                background: C.bg, border: `1px solid ${C.border}`,
                color: C.textMid, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>View →</button>
              <button onClick={() => onDelete(idea.id)} style={{
                flex: 1, padding: "9px", borderRadius: 10,
                background: "#FFF0F0", border: `1px solid #FFD0D0`,
                color: "#E05555", fontSize: 14,
                cursor: "pointer", fontFamily: "inherit",
              }}>🗑</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DRIVING MODE ─────────────────────────────────────────────────────────────
function DrivingMode({ onDone, onCancel }) {
  const voice = useVoice();
  const [phase, setPhase] = useState("ready"); // ready | recording | transcribing | done | error

  // Auto-start recording as soon as the screen opens
  useEffect(() => {
    const go = async () => {
      setPhase("recording");
      await voice.start();
    };
    go();
    return () => { voice.reset(); };
  }, []);

  // Track voice state changes
  useEffect(() => {
    if (voice.state === "transcribing") setPhase("transcribing");
    if (voice.state === "error") setPhase("error");
    if (voice.state === "idle" && phase === "transcribing") setPhase("done");
  }, [voice.state]);

  const handleStop = async () => {
    if (voice.state !== "recording") return;
    setPhase("transcribing");
    const text = await voice.stop();
    setPhase(text ? "done" : "error");
  };

  const handleUse = () => {
    onDone(voice.transcript || "");
  };

  const handleRetry = async () => {
    voice.reset();
    setPhase("recording");
    await voice.start();
  };

  // Colors per phase
  const bgColor = {
    ready: "#1A1A2E",
    recording: "#C0392B",
    transcribing: "#1A1A2E",
    done: "#1A5E38",
    error: "#7B1010",
  }[phase] || "#1A1A2E";

  const isRecording = phase === "recording";
  const isTranscribing = phase === "transcribing";
  const isDone = phase === "done";
  const isError = phase === "error";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: bgColor,
      display: "flex", flexDirection: "column",
      maxWidth: 430, left: "50%", transform: "translateX(-50%)",
      transition: "background 0.5s ease",
      fontFamily: "'Poppins', sans-serif",
      userSelect: "none",
    }}>
      <style>{`
        @keyframes driveRipple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes drivePulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Top safe area — cancel */}
      <div style={{
        padding: "56px 32px 0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <button onClick={onCancel} style={{
          background: "rgba(255,255,255,0.1)", border: "none",
          borderRadius: 50, padding: "10px 20px",
          color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>✕ Cancel</button>

        {/* Mode label */}
        <div style={{
          background: "rgba(255,255,255,0.1)", borderRadius: 50,
          padding: "8px 16px", fontSize: 12, fontWeight: 700,
          color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>🚗 Driving Mode</div>
      </div>

      {/* Center zone — status + waveform */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 32px",
      }}>

        {/* Status label */}
        <div style={{
          fontSize: 16, fontWeight: 700,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.05em", textTransform: "uppercase",
          marginBottom: 20, textAlign: "center",
          animation: "fadeSlideUp 0.3s ease",
        }}>
          {isRecording && "Listening…"}
          {isTranscribing && "Transcribing your idea…"}
          {isDone && "Got it! ✓"}
          {isError && (voice.errorMsg || "Something went wrong")}
          {phase === "ready" && "Starting mic…"}
        </div>

        {/* Waveform — only while recording */}
        {isRecording && (
          <div style={{ width: "100%", marginBottom: 28, animation: "fadeSlideUp 0.3s ease" }}>
            <Waveform levels={voice.levels} color="rgba(255,255,255,0.85)" />
          </div>
        )}

        {/* Transcribing spinner */}
        {isTranscribing && (
          <div style={{
            display: "flex", gap: 8, marginBottom: 28,
            animation: "fadeSlideUp 0.3s ease",
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "rgba(255,255,255,0.5)",
                animation: `drivePulse 1s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}

        {/* Transcript preview */}
        {(isDone || isTranscribing) && voice.transcript && (
          <div style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "20px 24px",
            marginBottom: 24, width: "100%",
            animation: "fadeSlideUp 0.4s ease",
          }}>
            <div style={{
              fontSize: 22, fontWeight: 700, color: "#fff",
              lineHeight: 1.5, textAlign: "center",
            }}>{voice.transcript}</div>
          </div>
        )}

        {/* Error details */}
        {isError && (
          <div style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "16px 20px",
            marginBottom: 24, textAlign: "center",
            animation: "fadeSlideUp 0.3s ease",
          }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
              {voice.errorMsg || "Couldn't get the recording. Tap retry."}
            </div>
          </div>
        )}

        {/* THE BIG BUTTON */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          {/* Ripple rings — only while recording */}
          {isRecording && [1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.3)",
              animation: `driveRipple 2s ease-out ${i * 0.7}s infinite`,
            }} />
          ))}

          <button
            onClick={isRecording ? handleStop : isError ? handleRetry : undefined}
            disabled={isTranscribing || phase === "ready"}
            style={{
              width: 140, height: 140, borderRadius: "50%",
              background: isRecording
                ? "#fff"
                : isDone
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.12)",
              border: isRecording ? "none" : "3px solid rgba(255,255,255,0.25)",
              fontSize: isRecording ? 44 : 36,
              cursor: isTranscribing || phase === "ready" ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: isRecording ? "drivePulse 1.8s ease-in-out infinite" : "none",
              transition: "all 0.4s ease",
              flexShrink: 0,
              WebkitTapHighlightColor: "transparent",
            }}>
            {isRecording ? "⏹" : isTranscribing ? "⏳" : isDone ? "✓" : isError ? "↺" : "🎙️"}
          </button>
        </div>

        {/* Instruction under button */}
        <div style={{
          fontSize: 13, color: "rgba(255,255,255,0.4)",
          textAlign: "center", fontWeight: 500,
        }}>
          {isRecording && "Tap to stop recording"}
          {isTranscribing && "One moment…"}
          {isDone && "Your idea was captured"}
          {isError && "Tap ↺ to try again"}
        </div>
      </div>

      {/* Bottom action area */}
      <div style={{ padding: "0 32px 52px" }}>
        {isDone && voice.transcript && (
          <button onClick={handleUse} style={{
            width: "100%", padding: "20px",
            background: "#fff", border: "none", borderRadius: 18,
            color: "#C0392B", fontSize: 18, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            animation: "fadeSlideUp 0.4s ease",
            WebkitTapHighlightColor: "transparent",
          }}>
            Save this idea →
          </button>
        )}

        {isDone && !voice.transcript && (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleRetry} style={{
              flex: 1, padding: "18px",
              background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 16,
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>↺ Try again</button>
            <button onClick={onCancel} style={{
              flex: 1, padding: "18px",
              background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 16,
              color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>Dismiss</button>
          </div>
        )}

        {isError && (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleRetry} style={{
              flex: 2, padding: "18px",
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 16,
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>↺ Try again</button>
            <button onClick={onCancel} style={{
              flex: 1, padding: "18px",
              background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 16,
              color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>Cancel</button>
          </div>
        )}

        {isRecording && (
          <div style={{
            textAlign: "center", fontSize: 12,
            color: "rgba(255,255,255,0.3)", marginTop: 8,
          }}>
            Keep your eyes on the road
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function SoIWasThinking() {
  const [ideas, setIdeas] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("ideas");
  const [showCapture, setShowCapture] = useState(false);
  const [captureInitialText, setCaptureInitialText] = useState("");
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [startCapture, setStartCapture] = useState(false);
  const [showDriving, setShowDriving] = useState(false);
  const [graveyardQueue, setGraveyardQueue] = useState([]); // ideas to resurface
  const [showGraveyardModal, setShowGraveyardModal] = useState(false);

  const handleDrivingDone = (text) => {
    setShowDriving(false);
    if (text.trim()) {
      setCaptureInitialText(text.trim());
      setShowCapture(true);
    }
  };
  const handleDrivingCancel = () => setShowDriving(false);

  useEffect(() => {
    const init = async () => {
      const data = await loadIdeas();
      setIdeas(data);
      setLoaded(true);
      if (data.length === 0) { setIsFirstTime(true); return; }

      // Check graveyard resurface
      const seen = await loadGraveyardSeen();
      const now = Date.now();
      const toResurface = data.filter(idea => {
        if (!idea.buried) return false;
        if (idea.deleted) return false;
        const lastSeen = seen[idea.id] || 0;
        const daysSinceSeen = (now - lastSeen) / 86400000;
        const daysSinceBuried = (now - (idea.buriedAt || idea.createdAt)) / 86400000;
        return daysSinceBuried >= RESURFACE_AFTER_DAYS && daysSinceSeen >= RESURFACE_AFTER_DAYS;
      });

      if (toResurface.length > 0) {
        // Mark as seen now
        const updatedSeen = { ...seen };
        toResurface.forEach(i => { updatedSeen[i.id] = now; });
        await saveGraveyardSeen(updatedSeen);
        setGraveyardQueue(toResurface.slice(0, 5)); // max 5 at once
        setShowGraveyardModal(true);
      }
    };
    init();
  }, []);

  const handleSave = useCallback(async (idea) => {
    const updated = [idea, ...ideas];
    setIdeas(updated);
    await saveIdeas(updated);
    setIsFirstTime(false);
    try {
      const ctx = CONTEXTS.find(c => c.id === idea.context);
      const moodObj = MOODS.find(m => m.id === idea.mood);
      const aiResult = await aiSeed(idea.rawText, ctx?.label, moodObj?.label);
      const seeded = { ...idea, aiData: aiResult, title: aiResult.title || idea.title };
      // Auto-bury if gut rating is very low
      if (seeded.rating <= 3) {
        seeded.buried = true;
        seeded.buriedAt = Date.now();
        seeded.buriedReason = "low-rating";
      }
      const refreshed = [seeded, ...ideas];
      setIdeas(refreshed);
      await saveIdeas(refreshed);
    } catch {}
  }, [ideas]);

  const handleUpdate = useCallback(async (updated) => {
    const newList = ideas.map(i => i.id === updated.id ? updated : i);
    setIdeas(newList);
    setSelectedIdea(updated);
    await saveIdeas(newList);
  }, [ideas]);

  // Bury an idea manually
  const handleBury = useCallback(async (ideaId) => {
    const newList = ideas.map(i => i.id === ideaId
      ? { ...i, buried: true, buriedAt: Date.now(), buriedReason: "manual" }
      : i
    );
    setIdeas(newList);
    await saveIdeas(newList);
  }, [ideas]);

  // Revive a buried idea
  const handleRevive = useCallback(async (ideaId) => {
    const newList = ideas.map(i => i.id === ideaId
      ? { ...i, buried: false, revivedAt: Date.now() }
      : i
    );
    setIdeas(newList);
    if (selectedIdea?.id === ideaId) setSelectedIdea(newList.find(i => i.id === ideaId));
    await saveIdeas(newList);
  }, [ideas, selectedIdea]);

  // Keep buried (just dismiss the modal card — storage already updated via seen tracker)
  const handleKeepBuried = useCallback(() => {}, []);

  // Permanently delete
  const handleDelete = useCallback(async (ideaId) => {
    const newList = ideas.filter(i => i.id !== ideaId);
    setIdeas(newList);
    if (selectedIdea?.id === ideaId) setSelectedIdea(null);
    await saveIdeas(newList);
  }, [ideas, selectedIdea]);

  if (!loaded) {
    return (
      <div style={{ ...base.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <FontLink />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
          <div style={{ fontSize: 14, color: C.textMid }}>Loading…</div>
        </div>
      </div>
    );
  }

  // First-time welcome
  if (isFirstTime && !startCapture) {
    return (
      <>
        <FontLink />
        <WelcomeScreen onStart={() => { setStartCapture(true); setIsFirstTime(false); setShowCapture(true); }} />
      </>
    );
  }

  const showPatterns = ideas.length >= 3;
  const buriedCount = ideas.filter(i => i.buried).length;
  const activeIdeas = ideas.filter(i => !i.buried);

  return (
    <div style={base.app}>
      <FontLink />
      <style>{`
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes drivePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        *{-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {/* Content */}
      <div style={{ overflowY: "auto", height: "100vh", paddingBottom: 80 }}>
        {tab === "ideas" && <IdeasList ideas={activeIdeas} onSelect={setSelectedIdea} onCapture={() => setShowCapture(true)} />}
        {tab === "patterns" && <PatternsView ideas={activeIdeas} />}
        {tab === "graveyard" && (
          <GraveyardView
            ideas={ideas}
            onRevive={handleRevive}
            onDelete={handleDelete}
            onSelectIdea={(idea) => setSelectedIdea(idea)}
          />
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: C.surface, borderTop: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "8px 16px 20px", zIndex: 100,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        <button onClick={() => setTab("ideas")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 10px",
        }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: tab === "ideas" ? C.accent : C.textSoft, fontFamily: "'Poppins',sans-serif" }}>Ideas</span>
        </button>

        {/* FAB cluster */}
        <div style={{ display: "flex", gap: 10, transform: "translateY(-10px)", alignItems: "center" }}>
          <button onClick={() => setShowDriving(true)}
            style={{
              width: 46, height: 46, borderRadius: "50%",
              background: C.bg, border: `2px solid ${C.border}`,
              fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}>🎙️</button>
          <button onClick={() => { setCaptureInitialText(""); setShowCapture(true); }}
            style={{
              width: 58, height: 58, borderRadius: "50%",
              background: C.accent, border: "none", fontSize: 26, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 20px rgba(255,107,107,0.45)`,
              color: "#fff", fontWeight: 700,
            }}>+</button>
        </div>

        {/* Right nav — patterns or graveyard */}
        <div style={{ display: "flex", gap: 2 }}>
          {showPatterns && (
            <button onClick={() => setTab("patterns")} style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px",
            }}>
              <span style={{ fontSize: 20 }}>✦</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: tab === "patterns" ? C.accent : C.textSoft, fontFamily: "'Poppins',sans-serif" }}>Patterns</span>
            </button>
          )}
          <button onClick={() => setTab("graveyard")} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px",
            position: "relative",
          }}>
            <span style={{ fontSize: 20 }}>🪦</span>
            {buriedCount > 0 && (
              <div style={{
                position: "absolute", top: 0, right: 4,
                width: 16, height: 16, borderRadius: "50%",
                background: C.accent, color: "#fff",
                fontSize: 9, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{buriedCount > 9 ? "9+" : buriedCount}</div>
            )}
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === "graveyard" ? C.accent : C.textSoft, fontFamily: "'Poppins',sans-serif" }}>Graveyard</span>
          </button>
        </div>
      </div>

      {/* Graveyard resurface modal */}
      {showGraveyardModal && graveyardQueue.length > 0 && (
        <GraveyardModal
          ideas={graveyardQueue}
          onClose={() => setShowGraveyardModal(false)}
          onRevive={(id) => { handleRevive(id); }}
          onKeepBuried={handleKeepBuried}
          onDelete={(id) => { handleDelete(id); }}
        />
      )}

      {/* Driving Mode */}
      {showDriving && (
        <DrivingMode onDone={handleDrivingDone} onCancel={handleDrivingCancel} />
      )}

      {/* Capture sheet */}
      {showCapture && (
        <CaptureSheet
          onSave={handleSave}
          onClose={() => { setShowCapture(false); setCaptureInitialText(""); }}
          initialText={captureInitialText}
        />
      )}

      {/* Idea detail */}
      {selectedIdea && (
        <IdeaDetail
          idea={selectedIdea}
          onUpdate={handleUpdate}
          onClose={() => setSelectedIdea(null)}
          onBury={handleBury}
          onRevive={handleRevive}
        />
      )}
    </div>
  );
}
