require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 8080;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 60_000, max: 60, message: { error: 'Too many requests' } });
app.use('/api/', limiter);

// ─── Claude helper ───────────────────────────────────────────────────────────
async function callClaude(system, userMsg) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });
  const raw = (msg.content[0]?.text || '').replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

// ─── Seed idea ────────────────────────────────────────────────────────────────
app.post('/api/seed', async (req, res) => {
  try {
    const { rawText, context, mood } = req.body;
    const result = await callClaude(
      `You expand raw idea captures into structured briefs. Return ONLY valid JSON, no markdown, no backticks:
{"title":"punchy 4-7 word title","summary":"2 sentence elevator pitch","problem":"the core problem solved","solution":"the key insight or mechanism","uniqueAngle":"what makes this different","tags":["tag1","tag2","tag3"],"excitement":7}`,
      `Raw idea: "${rawText}"\nContext: ${context}\nMood: ${mood}`
    );
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Execution plan ───────────────────────────────────────────────────────────
app.post('/api/execution-plan', async (req, res) => {
  try {
    const { idea, hoursPerWeek = 10 } = req.body;
    const result = await callClaude(
      `You build detailed, actionable startup execution roadmaps. Return ONLY valid JSON, no markdown:
{"nextAction":"The single most important thing to do in the next 24 hours","totalTimeMonths":6,"totalCostLow":5000,"totalCostHigh":20000,"criticalRisk":"biggest single risk","phases":[{"id":"phase-1","name":"Phase name","emoji":"🔍","duration":"2 weeks","costRange":"$0–$500","goal":"success looks like...","tasks":[{"id":"t-1-1","label":"Specific task","owner":"you","skill":"research","effort":"low","blocker":""}]}]}
Owner: "you"|"hire"|"outsource"|"tool". Include 3-5 phases, 3-6 tasks each. Be specific to this idea.`,
      `Idea: ${idea.title}\nSummary: ${idea.summary}\nProblem: ${idea.problem}\nSolution: ${idea.solution}\nAvailable time: ${hoursPerWeek} hrs/week`
    );
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Revenue plan ─────────────────────────────────────────────────────────────
app.post('/api/revenue-plan', async (req, res) => {
  try {
    const { idea } = req.body;
    const result = await callClaude(
      `You model startup revenue potential. Return ONLY valid JSON, no markdown:
{"model":"SaaS/marketplace/product/service","year1":{"low":10000,"mid":50000,"high":200000},"year3":{"low":100000,"mid":500000,"high":2000000},"assumptions":["a1","a2","a3"],"monetizationStrategies":[{"name":"Strategy","description":"how it works","avgRevPerUser":"$X/mo"}],"timeToFirstRevenue":"3-6 months"}`,
      `Idea: ${idea.title}\nSummary: ${idea.summary}\nSolution: ${idea.solution}`
    );
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Competitive scan ─────────────────────────────────────────────────────────
app.post('/api/comp-scan', async (req, res) => {
  try {
    const { idea } = req.body;
    const result = await callClaude(
      `You are a competitive intelligence analyst. Return ONLY valid JSON, no markdown:
{"differentiationScore":7,"verdict":"one sentence verdict","crowdedness":"wide open|some competition|crowded|very crowded","competitors":[{"name":"Co","url":"co.com","description":"what they do","fundingStage":"Seed","weakness":"gap vs your idea","similarityScore":7}],"whitespace":"gap competitors miss","yourEdge":"strongest reason to choose this","threat":"low|medium|high","recommendation":"go for it|proceed carefully|needs a sharper angle|very crowded"}`,
      `Idea: ${idea.title}\nSummary: ${idea.summary}\nProblem: ${idea.problem}\nSolution: ${idea.solution}\nUnique angle: ${idea.uniqueAngle}`
    );
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Patterns ─────────────────────────────────────────────────────────────────
app.post('/api/patterns', async (req, res) => {
  try {
    const { ideas } = req.body;
    const result = await callClaude(
      `You analyze idea patterns and surface insights. Return ONLY valid JSON, no markdown:
{"bestTimeOfDay":"description","bestContext":"most generative context","recurringThemes":["t1","t2","t3"],"subconsciousPatterns":["p1","p2"],"cognitiveStyle":"thinking style description","recommendation":"one actionable suggestion"}`,
      JSON.stringify(ideas.map(i => ({ context: i.context, mood: i.mood, hour: new Date(i.createdAt).getHours(), rating: i.rating, tags: i.aiData?.tags, title: i.title })))
    );
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Revival ──────────────────────────────────────────────────────────────────
app.post('/api/revival', async (req, res) => {
  try {
    const { idea, daysSince } = req.body;
    const result = await callClaude(
      `You are a creative strategist who finds new angles in dormant ideas. Return ONLY valid JSON, no markdown:
{"hook":"why this hits differently today","newAngle":"fresh framing or market shift","quickWin":"smallest first step in under an hour","verdict":"still buried|worth a second look|actually pretty good"}`,
      `Original idea: "${idea.rawText}"\nTitle: ${idea.aiData?.title || idea.title}\nOriginal gut rating: ${idea.rating}/10\nDays since captured: ${daysSince}\nSummary: ${idea.aiData?.summary || ''}`
    );
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
