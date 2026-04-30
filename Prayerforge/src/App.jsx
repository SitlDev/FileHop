import { useState, useCallback, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const PRAYER_TYPES = [
  { value: "confession",   label: "Confession & Repentance" },
  { value: "forgiveness",  label: "Seeking Forgiveness" },
  { value: "deliverance",  label: "Deliverance from Sin" },
  { value: "healing",      label: "Healing & Restoration" },
  { value: "gratitude",    label: "Gratitude After Forgiveness" },
  { value: "intercession", label: "Intercession (Praying for Another)" },
  { value: "praise",       label: "Praise & Worship" },
];

const DEPTH_LEVELS = [
  { value: "brief",    label: "Brief",    words: "100–150 words", desc: "A short, focused plea. One breath before God." },
  { value: "standard", label: "Standard", words: "300–400 words", desc: "A full structured prayer for daily use." },
  { value: "deep",     label: "Deep",     words: "600–800 words", desc: "An immersive multi-movement prayer for serious repentance." },
];

const RELATED_SINS = {
  pride:["envy","arrogance","self-righteousness","vanity"],
  lust:["pornography","adultery","objectification","impurity"],
  anger:["bitterness","resentment","unforgiveness","violence"],
  envy:["covetousness","jealousy","discontentment","greed"],
  greed:["covetousness","stinginess","materialism","dishonesty"],
  sloth:["procrastination","apathy","spiritual laziness","neglect of prayer"],
  lie:["deceit","manipulation","false witness","gossip"],
  gossip:["slander","backbiting","tale-bearing","malice"],
  addiction:["substance abuse","compulsion","idolatry","escapism"],
  fear:["anxiety","unbelief","faithlessness","worry"],
  doubt:["unbelief","faithlessness","skepticism","wavering"],
  default:["ungratefulness","pride","selfishness","idolatry"],
};
function getRelated(o) {
  const lo = o.toLowerCase();
  for (const [k,v] of Object.entries(RELATED_SINS)) { if (k!=="default" && lo.includes(k)) return v; }
  return RELATED_SINS.default;
}

const TABS = ["Forge","Journal","Verses","Streak"];
const VARIATION_SEEDS = ["morning mist","broken vessel","prodigal road","desert wilderness","refiner's fire","still waters","the potter's hand","valley of shadows"];
const DEPTH_COLORS = { brief:"#6b8a5a", standard:"#C9963A", deep:"#a04040" };

// ─── Storage ──────────────────────────────────────────────────────────────────
const load = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } };
const save = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };
const getStoredStreak = () => {
  const last=load("pf_last_prayed",null); const s=load("pf_streak",0);
  if (!last) return 0;
  return Math.floor((new Date()-new Date(last))/86400000)>1?0:s;
};

// ─── Share URL helpers ────────────────────────────────────────────────────────
function encodePrayer(offense, prayerType, depth, result) {
  try {
    const data = { o:offense, t:prayerType, d:depth, p:result.prayerText, v:result.verses };
    return btoa(encodeURIComponent(JSON.stringify(data)));
  } catch { return null; }
}
function decodePrayer(hash) {
  try { return JSON.parse(decodeURIComponent(atob(hash))); } catch { return null; }
}

// ─── Parse API response ───────────────────────────────────────────────────────
function parseResponse(text) {
  const markers = ["Bible Verses","Scripture","Supporting Verses","Scriptures","Relevant Verses"];
  let prayerText=text, versesRaw="";
  for (const m of markers) { const i=text.indexOf(m); if(i!==-1){prayerText=text.slice(0,i).trim();versesRaw=text.slice(i).trim();break;} }
  const verses=[]; let cur=null;
  if (versesRaw) {
    for (const line of versesRaw.split("\n").filter(l=>l.trim())) {
      const rm=line.match(/^[\d\-\*•]+\.?\s*([1-3]?\s?[A-Z][a-zA-Z]+\s+\d+:\d+[\-\d]*)/);
      if(rm){if(cur)verses.push(cur);cur={ref:rm[1].trim(),text:"",context:""};const rest=line.slice(line.indexOf(rm[1])+rm[1].length).replace(/^[\s\-–—:]+/,"");if(rest)cur.text=rest;}
      else if(cur){if(!cur.text)cur.text=line.trim();else cur.context+=(cur.context?" ":"")+line.trim();}
    }
    if(cur)verses.push(cur);
  }
  return { prayerText, verses };
}

// ─── Build system prompt ──────────────────────────────────────────────────────
function buildPrompt(offense,prayerType,depth,isVariation,seed) {
  const label=PRAYER_TYPES.find(p=>p.value===prayerType)?.label||prayerType;
  const dObj=DEPTH_LEVELS.find(d=>d.value===depth);
  const depthInstr={
    brief:`Write a SHORT concentrated prayer of ${dObj.words}. Single movement: address God, acknowledge briefly, one core petition, brief close. Only 2–3 Bible verses.`,
    standard:`Write a full structured prayer of ${dObj.words}: opening address, acknowledgment, scripture invocation, earnest petition, closing doxology. Provide 4–5 Bible verses.`,
    deep:`Write a deep multi-movement prayer of ${dObj.words}: (1) extended opening meditating on God's nature, (2) thorough confession, (3) multiple scriptures woven in, (4) sustained petition, (5) surrender, (6) solemn doxology. Provide 6–7 Bible verses with richer notes.`,
  };
  const extras=[
    isVariation?`VARIATION — do NOT reuse phrases/metaphors. Seed theme: "${seed}". Fresh language only.`:"",
    prayerType==="intercession"?"Frame as intercession: standing in the gap for another, lifting them before God.":"",
    prayerType==="praise"?"Frame as praise/adoration — celebrate God's nature in relation to this topic, not confession.":"",
  ].filter(Boolean).join(" ");
  return {
    system:`You are a compassionate Christian prayer writer grounded in Scripture. ${depthInstr[depth]} Write as if the person stands trembling before God. Be specific, never generic. Avoid clichés. Always illuminate grace. ${extras} After the prayer, write a section titled "Bible Verses" with full verse text, reference, and one sentence of spiritual context per verse.`,
    user:`Sin/Offense/Topic: ${offense}\nPrayer Type: ${label}\nDepth: ${dObj.label}${isVariation?`\nSeed: ${seed}`:""}`,
  };
}

// ─── Ambient Audio Engine ─────────────────────────────────────────────────────
function useAmbientAudio() {
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);
  const [playing, setPlaying] = useState(false);

  const stop = useCallback(() => {
    nodesRef.current.forEach(n => { try { n.stop(); } catch {} });
    nodesRef.current = [];
    if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    if (playing) { stop(); return; }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const master = ctx.createGain(); master.gain.value = 0.18; master.connect(ctx.destination);

      // Drone — low fundamental
      const createTone = (freq, gainVal, type="sine") => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = type; osc.frequency.value = freq;
        g.gain.value = gainVal;
        // Gentle LFO tremolo
        const lfo = ctx.createOscillator(); const lfoG = ctx.createGain();
        lfo.frequency.value = 0.15 + Math.random()*0.1; lfoG.gain.value = gainVal*0.08;
        lfo.connect(lfoG); lfoG.connect(g.gain);
        lfo.start(); osc.connect(g); g.connect(master); osc.start();
        nodesRef.current.push(osc, lfo);
      };

      // Organ-like chord — D minor feel (D2, A2, D3, F3, A3)
      [[73.4,0.9],[110,0.6],[146.8,0.7],[174.6,0.4],[220,0.35]].forEach(([f,v]) => createTone(f,v,"sine"));
      // Subtle overtones
      [[293.6,0.12],[349.2,0.08]].forEach(([f,v]) => createTone(f,v,"sine"));

      // Soft noise "room" — white noise filtered
      const bufSize = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i=0;i<bufSize;i++) data[i]=(Math.random()*2-1)*0.012;
      const noise = ctx.createBufferSource(); noise.buffer=buf; noise.loop=true;
      const lp = ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=400;
      noise.connect(lp); lp.connect(master); noise.start();
      nodesRef.current.push(noise);

      setPlaying(true);
    } catch(e) { console.error(e); }
  }, [playing, stop]);

  useEffect(() => () => stop(), [stop]);
  return { playing, toggle: start };
}

// ─── TTS ──────────────────────────────────────────────────────────────────────
function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => "speechSynthesis" in window);

  const speak = useCallback((text) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    if (speaking) { setSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.82; utt.pitch = 0.95; utt.volume = 1;
    // Pick a calm voice if available
    const voices = window.speechSynthesis.getVoices();
    const pick = voices.find(v => /Daniel|Samantha|Karen|Moira|en-GB|en-AU/i.test(v.name+v.lang))
      || voices.find(v => /en/i.test(v.lang));
    if (pick) utt.voice = pick;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [speaking, supported]);

  const stop = useCallback(() => { window.speechSynthesis.cancel(); setSpeaking(false); }, []);
  useEffect(() => () => stop(), [stop]);
  return { speaking, supported, speak, stop };
}

// ─── SVGs ─────────────────────────────────────────────────────────────────────
function CrossSVG() {
  return <svg width="52" height="62" viewBox="0 0 60 70" fill="none"><rect x="25" y="0" width="10" height="70" rx="2" fill="#C9963A" opacity="0.7"/><rect x="0" y="18" width="60" height="10" rx="2" fill="#C9963A" opacity="0.7"/><rect x="27" y="2" width="6" height="66" rx="1" fill="#C9963A" opacity="0.3"/><rect x="2" y="20" width="56" height="6" rx="1" fill="#C9963A" opacity="0.3"/></svg>;
}
function SpinnerSVG() {
  return <svg width="36" height="36" viewBox="0 0 40 40" fill="none" style={{animation:"spin 1.5s linear infinite"}}><circle cx="20" cy="20" r="16" stroke="rgba(201,150,58,0.2)" strokeWidth="3"/><path d="M20 4 A16 16 0 0 1 36 20" stroke="#C9963A" strokeWidth="3" strokeLinecap="round"/></svg>;
}
function FlameIcon({lit}) {
  return <svg width="18" height="22" viewBox="0 0 18 22" fill="none"><path d="M9 1C9 1 14 6 14 11C14 14.3 11.8 17 9 17C6.2 17 4 14.3 4 11C4 8 6 5 6 5C6 5 6.5 8 9 9C9 9 7 6 9 1Z" fill={lit?"#C9963A":"rgba(201,150,58,0.18)"}/><path d="M9 13C9 13 11 12 11 10.5C11 10.5 10 11.5 9 11.5C8 11.5 7 10.5 7 10.5C7 12 9 13 9 13Z" fill={lit?"#fff8e7":"rgba(255,255,255,0.08)"}/></svg>;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionDivider({children,dark=true}) {
  const c = dark ? "rgba(201,150,58,0.2)" : "rgba(139,105,20,0.3)";
  return (
    <div style={{display:"flex",alignItems:"center",gap:"12px",fontFamily:"'Cinzel',serif",fontSize:"0.76rem",letterSpacing:"0.16em",color:dark?"#C9963A":"#8B6914",textTransform:"uppercase",marginBottom:"22px"}}>
      <span style={{flex:1,height:"1px",background:c}}/>{children}<span style={{flex:1,height:"1px",background:c}}/>
    </div>
  );
}
function GhostBtn({onClick,children,active,disabled,small}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{background:active?"rgba(201,150,58,0.12)":"transparent",border:`1px solid ${active?"#C9963A":"rgba(201,150,58,0.28)"}`,borderRadius:"3px",color:disabled?"#3a2810":"#C9963A",fontFamily:"'Cinzel',serif",fontSize:small?"0.62rem":"0.7rem",letterSpacing:"0.1em",textTransform:"uppercase",padding:small?"5px 10px":"7px 14px",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,whiteSpace:"nowrap"}}>
      {children}
    </button>
  );
}

// ─── Drop Cap Prayer Text ─────────────────────────────────────────────────────
function PrayerWithDropCap({text, isDark}) {
  if (!text) return null;
  const firstChar = text.charAt(0);
  const rest = text.slice(1);
  const textColor = isDark ? "#e8d5b0" : "#2C1810";
  const dropColor = isDark ? "#C9963A" : "#8B6914";
  return (
    <p style={{fontSize:"1.1rem",lineHeight:"2",color:textColor,whiteSpace:"pre-wrap",fontStyle:"italic",margin:0}}>
      <span style={{float:"left",fontFamily:"'Cinzel',serif",fontSize:"4.2rem",lineHeight:"0.75",paddingRight:"8px",paddingTop:"6px",color:dropColor,fontWeight:"700",fontStyle:"normal",textShadow:`0 0 20px ${dropColor}44`}}>
        {firstChar}
      </span>
      {rest}
    </p>
  );
}

// ─── Depth Selector ───────────────────────────────────────────────────────────
function DepthSelector({value,onChange,isDark}) {
  const border = isDark ? "rgba(201,150,58,0.15)" : "rgba(139,105,20,0.2)";
  const activeBg = isDark ? "rgba(201,150,58,0.14)" : "rgba(201,150,58,0.1)";
  const inactiveBg = isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.04)";
  const labelC = isDark ? "#C9963A" : "#8B6914";
  const mutedC = isDark ? "#7a6040" : "#a8906e";
  return (
    <div>
      <label style={{display:"block",fontFamily:"'Cinzel',serif",fontSize:"0.74rem",letterSpacing:"0.15em",color:labelC,textTransform:"uppercase",marginBottom:"12px"}}>Prayer Depth</label>
      <div style={{display:"flex",gap:"8px"}}>
        {DEPTH_LEVELS.map(d=>(
          <button key={d.value} onClick={()=>onChange(d.value)} style={{flex:1,padding:"12px 8px",background:value===d.value?activeBg:inactiveBg,border:`1px solid ${value===d.value?"#C9963A":border}`,borderRadius:"3px",cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.78rem",letterSpacing:"0.1em",color:value===d.value?"#C9963A":mutedC,textTransform:"uppercase",marginBottom:"4px"}}>{d.label}</div>
            <div style={{fontSize:"0.68rem",color:value===d.value?"#a8906e":"#4a3520",lineHeight:"1.4"}}>{d.words}</div>
          </button>
        ))}
      </div>
      <p style={{fontSize:"0.82rem",color:isDark?"#6b5535":"#a8906e",fontStyle:"italic",margin:"8px 0 0",lineHeight:"1.4"}}>{DEPTH_LEVELS.find(d=>d.value===value)?.desc}</p>
    </div>
  );
}

// ─── Related Chips ────────────────────────────────────────────────────────────
function RelatedChips({offense,onSelect,isDark}) {
  const chips = getRelated(offense);
  return (
    <div style={{marginTop:"10px"}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.68rem",letterSpacing:"0.12em",color:isDark?"#5a4525":"#a8906e",textTransform:"uppercase",marginBottom:"8px"}}>Related struggles</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
        {chips.map(c=>(
          <button key={c} onClick={()=>onSelect(c)}
            style={{background:isDark?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.04)",border:`1px solid ${isDark?"rgba(201,150,58,0.15)":"rgba(139,105,20,0.2)"}`,borderRadius:"20px",padding:"5px 12px",color:isDark?"#a8906e":"#8B6914",fontFamily:"'EB Garamond',serif",fontSize:"0.85rem",cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.target.style.borderColor="rgba(201,150,58,0.45)";e.target.style.color="#C9963A";}}
            onMouseLeave={e=>{e.target.style.borderColor=isDark?"rgba(201,150,58,0.15)":"rgba(139,105,20,0.2)";e.target.style.color=isDark?"#a8906e":"#8B6914";}}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Flashcards ───────────────────────────────────────────────────────────────
function VerseFlashcards({allVerses,isDark}) {
  const [idx,setIdx]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [mastered,setMastered]=useState(()=>load("pf_mastered",[]));
  const card0 = {background:isDark?"linear-gradient(145deg,#271509,#1c0e05)":"#f9f2e3",border:`1px solid ${isDark?"rgba(201,150,58,0.22)":"rgba(201,150,58,0.3)"}`,borderRadius:"4px",padding:"36px",textAlign:"center"};
  if (!allVerses.length) return <div style={card0}><p style={{color:isDark?"#6b5535":"#a8906e",fontStyle:"italic",margin:0}}>No verses yet. Generate and save prayers to build your verse library.</p></div>;
  const card=allVerses[idx]; const isMastered=mastered.includes(idx); const pct=Math.round(((idx+1)/allVerses.length)*100);
  const mark=()=>{const n=isMastered?mastered.filter(m=>m!==idx):[...mastered,idx];setMastered(n);save("pf_mastered",n);};
  const go=dir=>{setIdx((idx+dir+allVerses.length)%allVerses.length);setRevealed(false);};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.7rem",letterSpacing:"0.1em",color:isDark?"#6b5535":"#a8906e",textTransform:"uppercase"}}>{idx+1} of {allVerses.length}</span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.7rem",letterSpacing:"0.1em",color:"#C9963A",textTransform:"uppercase"}}>{mastered.length} mastered</span>
      </div>
      <div style={{height:"3px",background:"rgba(201,150,58,0.12)",borderRadius:"2px",marginBottom:"18px"}}>
        <div style={{height:"100%",width:`${pct}%`,background:"#C9963A",borderRadius:"2px",transition:"width 0.4s"}}/>
      </div>
      <div onClick={()=>setRevealed(!revealed)} style={{background:"linear-gradient(160deg,#f5ecd7,#ede0c4)",border:"1px solid #C9963A",borderRadius:"4px",padding:"44px 36px",color:"#2C1810",textAlign:"center",minHeight:"200px",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",boxShadow:"0 8px 40px rgba(0,0,0,0.4)",cursor:"pointer",animation:"fadeInUp 0.4s ease forwards"}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.82rem",letterSpacing:"0.15em",color:"#8B6914",textTransform:"uppercase",marginBottom:"16px"}}>{card.ref}</div>
        {revealed?<div style={{fontSize:"1.12rem",lineHeight:"1.85",fontStyle:"italic",color:"#2C1810"}}>"{card.text}"</div>:<div style={{fontSize:"0.92rem",color:"#8B6914",fontFamily:"'Cinzel',serif",letterSpacing:"0.08em"}}>Tap to reveal verse</div>}
        {card.context&&revealed&&<div style={{fontSize:"0.8rem",color:"#a8906e",marginTop:"14px"}}>{card.context}</div>}
        <div style={{fontSize:"0.72rem",color:"#a8906e",marginTop:"18px",fontFamily:"'Cinzel',serif",letterSpacing:"0.08em"}}>{revealed?"Tap to hide":"Tap to reveal"}</div>
      </div>
      <div style={{display:"flex",gap:"10px",justifyContent:"center",marginTop:"14px"}}>
        <GhostBtn onClick={()=>go(-1)}>← Prev</GhostBtn>
        <GhostBtn onClick={mark} active={isMastered}>{isMastered?"✓ Mastered":"Mark Mastered"}</GhostBtn>
        <GhostBtn onClick={()=>go(1)}>Next →</GhostBtn>
      </div>
    </div>
  );
}

// ─── Journal ──────────────────────────────────────────────────────────────────
function JournalTab({journal,onOpen,isDark}) {
  const emptyCard={background:isDark?"linear-gradient(145deg,#271509,#1c0e05)":"#f9f2e3",border:`1px solid ${isDark?"rgba(201,150,58,0.22)":"rgba(201,150,58,0.3)"}`,borderRadius:"4px",padding:"36px",textAlign:"center"};
  if (!journal.length) return <div style={emptyCard}><p style={{color:isDark?"#6b5535":"#a8906e",fontStyle:"italic",margin:0}}>No prayers saved yet. Generate a prayer and save it to your journal.</p></div>;
  return (
    <div>
      {[...journal].reverse().map((e,i)=>(
        <div key={i} onClick={()=>onOpen(e)}
          style={{background:isDark?"rgba(0,0,0,0.25)":"rgba(255,255,255,0.7)",border:`1px solid ${isDark?"rgba(201,150,58,0.15)":"rgba(201,150,58,0.25)"}`,borderRadius:"3px",padding:"18px 22px",marginBottom:"12px",cursor:"pointer",transition:"border-color 0.2s"}}
          onMouseEnter={el=>el.currentTarget.style.borderColor="rgba(201,150,58,0.45)"}
          onMouseLeave={el=>el.currentTarget.style.borderColor=isDark?"rgba(201,150,58,0.15)":"rgba(201,150,58,0.25)"}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.7rem",letterSpacing:"0.12em",color:"#C9963A",textTransform:"uppercase",marginBottom:"5px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
            <span>{e.type}</span>
            {e.depth&&<span style={{background:"rgba(201,150,58,0.1)",borderRadius:"10px",padding:"1px 8px",fontSize:"0.6rem"}}>{e.depth}</span>}
            <span style={{marginLeft:"auto",color:isDark?"#5a4525":"#a8906e"}}>{new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
          </div>
          <div style={{fontSize:"0.78rem",color:isDark?"#7a6040":"#a8906e",fontFamily:"'Cinzel',serif",letterSpacing:"0.07em",marginBottom:"7px",textTransform:"uppercase"}}>{e.offense?.slice(0,65)}{e.offense?.length>65?"…":""}</div>
          <div style={{fontSize:"0.93rem",color:isDark?"#c4a87a":"#6b4e2a",fontStyle:"italic",lineHeight:"1.55",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{e.prayerText}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Journal Modal ────────────────────────────────────────────────────────────
function JournalModal({entry,onClose,tts}) {
  if (!entry) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1000,overflowY:"auto",padding:"36px 16px"}}>
      <div style={{maxWidth:"680px",margin:"0 auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"linear-gradient(160deg,#f5ecd7,#ede0c4)",border:"1px solid #C9963A",borderRadius:"4px",padding:"44px 40px",color:"#2C1810",position:"relative",boxShadow:"0 12px 60px rgba(0,0,0,0.7)",marginBottom:"14px"}}>
          <span style={{position:"absolute",top:"14px",left:"18px",color:"#C9963A",fontSize:"1.2rem",opacity:0.55}}>✦</span>
          <span style={{position:"absolute",top:"14px",right:"18px",color:"#C9963A",fontSize:"1.2rem",opacity:0.55}}>✦</span>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.88rem",letterSpacing:"0.18em",color:"#8B6914",textTransform:"uppercase",textAlign:"center",marginBottom:"6px"}}>{entry.type}</div>
          {entry.depth&&<div style={{fontFamily:"'Cinzel',serif",fontSize:"0.65rem",letterSpacing:"0.12em",color:"#a8906e",textTransform:"uppercase",textAlign:"center",marginBottom:"6px"}}>{entry.depth} depth</div>}
          <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.68rem",letterSpacing:"0.1em",color:"#8B6914",textAlign:"center",marginBottom:"22px",textTransform:"uppercase"}}>{new Date(entry.date).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
          <PrayerWithDropCap text={entry.prayerText} isDark={false}/>
          <div style={{display:"flex",gap:"8px",justifyContent:"flex-end",marginTop:"20px",flexWrap:"wrap"}}>
            {tts.supported && <GhostBtn onClick={()=>tts.speak(entry.prayerText)} active={tts.speaking}>{tts.speaking?"◼ Stop":"▶ Read Aloud"}</GhostBtn>}
          </div>
        </div>
        {entry.verses?.length>0&&(
          <div style={{background:"linear-gradient(145deg,#1e1005,#130b04)",border:"1px solid rgba(201,150,58,0.18)",borderRadius:"4px",padding:"28px 32px",marginBottom:"14px"}}>
            <SectionDivider>Scripture</SectionDivider>
            {entry.verses.map((v,i)=>(
              <div key={i} style={{borderLeft:"3px solid #C9963A",paddingLeft:"16px",marginBottom:"18px"}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.75rem",letterSpacing:"0.12em",color:"#C9963A",marginBottom:"5px",textTransform:"uppercase"}}>{v.ref}</div>
                <div style={{fontSize:"1rem",lineHeight:"1.7",color:"#e8d5b0",fontStyle:"italic",marginBottom:"4px"}}>"{v.text}"</div>
                {v.context&&<div style={{fontSize:"0.83rem",color:"#a8906e"}}>{v.context}</div>}
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#8B6914,#C9963A,#8B6914)",backgroundSize:"200% 100%",border:"none",borderRadius:"3px",color:"#1a0f07",fontFamily:"'Cinzel',serif",fontSize:"0.88rem",fontWeight:"700",letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer"}}>✕ Close</button>
      </div>
    </div>
  );
}

// ─── Streak Tab ───────────────────────────────────────────────────────────────
function StreakTab({streak,journal,isDark}) {
  const days=["S","M","T","W","T","F","S"]; const today=new Date().getDay();
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return journal.some(e=>new Date(e.date).toDateString()===d.toDateString());});
  const msg=streak===0?"Begin your journey. Pray today to start your streak.":streak===1?"A single candle lit. Return tomorrow to keep it burning.":streak<7?`${streak} days of faithfulness. Keep the flame alive.`:streak<30?"A week of devotion. God sees your perseverance.":"Thirty days before the Lord. You walk in steadfast grace.";
  const cardBg = isDark?"linear-gradient(145deg,#271509,#1c0e05)":"linear-gradient(145deg,#fdf5e4,#f5e8cc)";
  const cardBorder = isDark?"rgba(201,150,58,0.22)":"rgba(201,150,58,0.35)";
  return (
    <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"4px",padding:"40px 36px",boxShadow:"0 8px 40px rgba(0,0,0,0.3)"}}>
      <SectionDivider dark={isDark}>Prayer Streak</SectionDivider>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"5.5rem",fontWeight:"700",color:"#C9963A",textAlign:"center",lineHeight:1,textShadow:"0 0 60px rgba(201,150,58,0.4)"}}>{streak}</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.8rem",letterSpacing:"0.2em",color:"#a8906e",textAlign:"center",textTransform:"uppercase",marginTop:"8px",marginBottom:"28px"}}>Day{streak!==1?"s":""} in a Row</div>
      <div style={{display:"flex",justifyContent:"center",gap:"8px",marginBottom:"28px"}}>
        {last7.map((lit,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"5px"}}>
            <FlameIcon lit={lit}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.58rem",color:lit?"#C9963A":isDark?"#3a2810":"#c4a87a",letterSpacing:"0.05em"}}>{days[(today-6+i+7)%7]}</span>
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",marginBottom:"36px"}}><p style={{color:isDark?"#6b5535":"#a8906e",fontStyle:"italic",fontSize:"0.95rem",margin:0}}>{msg}</p></div>
      <SectionDivider dark={isDark}>Your Numbers</SectionDivider>
      <div style={{display:"flex",justifyContent:"center",gap:"32px",textAlign:"center",flexWrap:"wrap"}}>
        {[{num:journal.length,label:"Prayers Forged"},{num:[...new Set(journal.map(e=>e.type))].length,label:"Prayer Types"},{num:journal.reduce((a,e)=>a+(e.verses?.length||0),0),label:"Verses Saved"},{num:journal.filter(e=>e.depth==="deep").length,label:"Deep Prayers"}].map((s,i)=>(
          <div key={i}><div style={{fontFamily:"'Cinzel',serif",fontSize:"2.2rem",color:"#C9963A"}}>{s.num}</div><div style={{fontFamily:"'Cinzel',serif",fontSize:"0.63rem",letterSpacing:"0.12em",color:isDark?"#6b5535":"#a8906e",textTransform:"uppercase",marginTop:"4px"}}>{s.label}</div></div>
        ))}
      </div>
    </div>
  );
}

// ─── Print Styles ─────────────────────────────────────────────────────────────
const PRINT_CSS = `
@media print {
  body { background: white !important; color: #1a0a00 !important; }
  .no-print { display: none !important; }
  .print-card {
    background: white !important; border: 2px solid #C9963A !important;
    box-shadow: none !important; page-break-inside: avoid;
    padding: 32px !important; margin: 0 !important;
    color: #1a0a00 !important;
  }
  .print-verses {
    background: white !important; border: 1px solid #ddd !important;
    box-shadow: none !important; page-break-inside: avoid;
    padding: 24px !important; margin-top: 20px !important;
  }
  .prayer-text { color: #1a0a00 !important; font-size: 12pt !important; line-height: 1.9 !important; }
  .verse-text { color: #333 !important; }
  .verse-ref { color: #8B6914 !important; }
  .verse-context { color: #666 !important; }
  @page { margin: 0.75in; }
}
`;

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function PrayerForge() {
  const [tab, setTab] = useState("Forge");
  const [offense, setOffense] = useState("");
  const [prayerType, setPrayerType] = useState("confession");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copiedPrayer, setCopiedPrayer] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [variationCount, setVariationCount] = useState(0);
  const [journal, setJournal] = useState(() => load("pf_journal", []));
  const [streak, setStreak] = useState(() => getStoredStreak());
  const [modalEntry, setModalEntry] = useState(null);
  const [isDark, setIsDark] = useState(true);
  // loaded-from-share
  const [sharedOffense, setSharedOffense] = useState("");
  const [sharedType, setSharedType] = useState("");
  const [sharedDepth, setSharedDepth] = useState("");

  const ambient = useAmbientAudio();
  const tts = useTTS();
  const allVerses = journal.flatMap(e => e.verses || []);
  const maxTokens = depth==="brief"?600:depth==="deep"?2000:1200;

  // Check for shared prayer in URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decoded = decodePrayer(hash);
      if (decoded) {
        setResult({ prayerText: decoded.p, verses: decoded.v });
        setOffense(decoded.o); setPrayerType(decoded.t); setDepth(decoded.d);
        setSharedOffense(decoded.o); setSharedType(decoded.t); setSharedDepth(decoded.d);
      }
    }
  }, []);

  const recordPrayer = useCallback(() => {
    const last=load("pf_last_prayed",null); const cur=load("pf_streak",0); const now=new Date();
    let next=cur;
    if(!last)next=1;
    else{const diff=Math.floor((now-new Date(last))/86400000);next=diff===0?cur:diff===1?cur+1:1;}
    save("pf_last_prayed",now.toString()); save("pf_streak",next); setStreak(next);
  }, []);

  const callAPI = async (isVariation=false) => {
    if (!offense.trim()) return;
    setLoading(true); setError("");
    if (!isVariation){setResult(null);setSaved(false);setVariationCount(0);}
    const seed = VARIATION_SEEDS[(variationCount+(isVariation?1:0))%VARIATION_SEEDS.length];
    const {system,user} = buildPrompt(offense,prayerType,depth,isVariation,seed);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "", // Using env var
          "anthropic-version": "2023-06-01",
          "dangerously-allow-browser": "true" 
        },
        body:JSON.stringify({
          model:"claude-3-5-sonnet-20240620", 
          max_tokens:maxTokens,
          system,
          messages:[{role:"user",content:user}]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("")||"";
      if(!text) throw new Error();
      setResult(parseResponse(text));
      if(isVariation)setVariationCount(v=>v+1);
      recordPrayer();
      window.history.replaceState(null,"",window.location.pathname);
    } catch { 
      setError("Unable to connect to the divine source (API). Please check your configuration."); 
    }
    finally { setLoading(false); }
  };

  const saveToJournal = () => {
    if(!result||saved) return;
    const label=PRAYER_TYPES.find(p=>p.value===prayerType)?.label||prayerType;
    const entry={...result,offense,type:label,depth,date:new Date().toISOString()};
    const updated=[...journal,entry]; setJournal(updated); save("pf_journal",updated); setSaved(true);
  };

  const copyPrayer = () => {
    if(result?.prayerText){navigator.clipboard.writeText(result.prayerText);setCopiedPrayer(true);setTimeout(()=>setCopiedPrayer(false),2000);}
  };

  const sharePrayer = () => {
    if(!result) return;
    const encoded = encodePrayer(offense,prayerType,depth,result);
    if(!encoded) return;
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    navigator.clipboard.writeText(url);
    window.history.replaceState(null,"",`#${encoded}`);
    setShared(true); setTimeout(()=>setShared(false),2500);
  };

  const printPrayer = () => window.print();

  // Theme tokens
  const bg = isDark ? "#130b04" : "#faf3e0";
  const bgGrad = isDark
    ? "radial-gradient(ellipse at 20% 20%,rgba(201,150,58,0.07) 0%,transparent 55%),radial-gradient(ellipse at 80% 80%,rgba(201,150,58,0.05) 0%,transparent 55%)"
    : "radial-gradient(ellipse at 20% 20%,rgba(201,150,58,0.12) 0%,transparent 55%),radial-gradient(ellipse at 80% 80%,rgba(201,150,58,0.08) 0%,transparent 55%)";
  const textColor = isDark ? "#F5ECD7" : "#2C1810";
  const cardBg = isDark ? "linear-gradient(145deg,#271509,#1c0e05)" : "linear-gradient(145deg,#fdf5e4,#f5e8cc)";
  const cardBorder = isDark ? "rgba(201,150,58,0.22)" : "rgba(201,150,58,0.35)";
  const inputBg = isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.7)";
  const inputBorder = isDark ? "rgba(201,150,58,0.18)" : "rgba(139,105,20,0.25)";
  const labelC = isDark ? "#C9963A" : "#8B6914";
  const prayerCardBg = isDark ? "linear-gradient(160deg,#f5ecd7,#ede0c4)" : "linear-gradient(160deg,#fffbf0,#fdf3d8)";
  const verseCardBg = isDark ? "linear-gradient(145deg,#1e1005,#130b04)" : "linear-gradient(145deg,#fdf5e4,#f5e8cc)";
  const verseBorder = isDark ? "rgba(201,150,58,0.18)" : "rgba(139,105,20,0.25)";
  const verseTextC = isDark ? "#e8d5b0" : "#4a2e0a";
  const subtitleC = isDark ? "#a8906e" : "#8B6914";

  const cardStyle = {background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"4px",padding:"32px",marginBottom:"18px",boxShadow:"0 8px 40px rgba(0,0,0,0.3),inset 0 1px 0 rgba(201,150,58,0.06)"};
  const labelStyle = {display:"block",fontFamily:"'Cinzel',serif",fontSize:"0.74rem",letterSpacing:"0.15em",color:labelC,textTransform:"uppercase",marginBottom:"10px"};
  const inputStyle = {width:"100%",background:inputBg,border:`1px solid ${inputBorder}`,borderRadius:"3px",padding:"13px 16px",color:textColor,fontFamily:"'Cinzel',serif",fontSize:"0.88rem",letterSpacing:"0.04em",cursor:"pointer",appearance:"none",boxSizing:"border-box",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23C9963A' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 16px center"};

  return (
    <>
      <JournalModal entry={modalEntry} onClose={()=>{setModalEntry(null);tts.stop();}} tts={tts}/>

      <div style={{minHeight:"100vh",background:bg,backgroundImage:bgGrad,fontFamily:"'EB Garamond',Georgia,serif",color:textColor,padding:"32px 16px 80px",transition:"background 0.4s,color 0.4s"}}>
        <div style={{maxWidth:"740px",margin:"0 auto"}}>

          <header style={{textAlign:"center",marginBottom:"24px"}} className="no-print">
            <div style={{display:"flex",justifyContent:"flex-end",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
              <GhostBtn small onClick={ambient.toggle} active={ambient.playing}>
                {ambient.playing?"🔇 Silence":"🎵 Ambience"}
              </GhostBtn>
              <GhostBtn small onClick={()=>setIsDark(d=>!d)}>
                {isDark?"☀ Light Mode":"🌙 Dark Mode"}
              </GhostBtn>
            </div>
            <CrossSVG/>
            <h1 style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:"700",color:"#C9963A",letterSpacing:"0.08em",margin:"12px 0 6px",textShadow:"0 0 40px rgba(201,150,58,0.3)"}}>PrayerForge</h1>
            <p style={{fontSize:"1.05rem",color:subtitleC,fontStyle:"italic",margin:0}}>Come before God with a sincere heart</p>
          </header>

          {streak>0&&(
            <div style={{display:"flex",justifyContent:"center",marginBottom:"18px"}} className="no-print">
              <div style={{display:"flex",alignItems:"center",gap:"8px",background:"rgba(201,150,58,0.08)",border:"1px solid rgba(201,150,58,0.2)",borderRadius:"20px",padding:"6px 18px"}}>
                <FlameIcon lit={true}/>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.76rem",letterSpacing:"0.1em",color:"#C9963A",textTransform:"uppercase"}}>{streak} Day Streak</span>
              </div>
            </div>
          )}

          <div style={{display:"flex",gap:"2px",borderBottom:`1px solid ${isDark?"rgba(201,150,58,0.12)":"rgba(139,105,20,0.2)"}`,marginBottom:"24px"}} className="no-print">
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{fontFamily:"'Cinzel',serif",fontSize:"0.76rem",letterSpacing:"0.14em",textTransform:"uppercase",padding:"10px 16px",cursor:"pointer",background:"transparent",border:"none",borderBottom:tab===t?"2px solid #C9963A":"2px solid transparent",color:tab===t?"#C9963A":isDark?"#5a4525":"#a8906e",transition:"all 0.2s",marginBottom:"-1px"}}>
                {t}{t==="Journal"&&journal.length>0?` (${journal.length})`:""}
              </button>
            ))}
          </div>

          {tab==="Forge"&&(
            <>
              {sharedOffense&&(
                <div style={{background:"rgba(201,150,58,0.08)",border:"1px solid rgba(201,150,58,0.25)",borderRadius:"3px",padding:"12px 18px",marginBottom:"16px",fontFamily:"'Cinzel',serif",fontSize:"0.74rem",letterSpacing:"0.1em",color:"#C9963A",textTransform:"uppercase"}}>
                  ✦ Shared prayer loaded — "{sharedOffense.slice(0,50)}{sharedOffense.length>50?"…":""}"
                </div>
              )}

              <div style={cardStyle} className="no-print">
                <label style={labelStyle}>Describe your offense, sin, or topic</label>
                <textarea style={{width:"100%",minHeight:"100px",background:inputBg,border:`1px solid ${inputBorder}`,borderRadius:"3px",padding:"14px",color:textColor,fontFamily:"'EB Garamond',Georgia,serif",fontSize:"1.05rem",lineHeight:"1.6",resize:"vertical",boxSizing:"border-box"}}
                  value={offense} onChange={e=>setOffense(e.target.value)}
                  placeholder="Be honest before God. Describe what weighs on your heart…" rows={4}/>
                {offense.trim().length>3&&<RelatedChips offense={offense} onSelect={s=>{setOffense(s);setResult(null);setSaved(false);}} isDark={isDark}/>}
              </div>

              <div style={cardStyle} className="no-print">
                <div style={{marginBottom:"22px"}}>
                  <label style={labelStyle}>Type of prayer</label>
                  <select style={inputStyle} value={prayerType} onChange={e=>setPrayerType(e.target.value)}>
                    {PRAYER_TYPES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  {prayerType==="intercession"&&<p style={{fontSize:"0.82rem",color:subtitleC,fontStyle:"italic",margin:"8px 0 0"}}>Describe the person's struggle above — the prayer will stand in the gap on their behalf.</p>}
                  {prayerType==="praise"&&<p style={{fontSize:"0.82rem",color:subtitleC,fontStyle:"italic",margin:"8px 0 0"}}>Enter a theme or reason for praise. The prayer will celebrate God's nature in that context.</p>}
                </div>
                <DepthSelector value={depth} onChange={setDepth} isDark={isDark}/>
              </div>

              <button className="gen-btn no-print" onClick={()=>callAPI(false)} disabled={loading||!offense.trim()}
                style={{width:"100%",padding:"17px",background:"linear-gradient(135deg,#8B6914,#C9963A,#8B6914)",backgroundSize:"200% 100%",border:"none",borderRadius:"3px",color:"#1a0f07",fontFamily:"'Cinzel',serif",fontSize:"0.95rem",fontWeight:"700",letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.3s",boxShadow:"0 4px 20px rgba(201,150,58,0.28)",marginBottom:"18px"}}>
                {loading?"Composing Your Prayer…":"✝ Generate Prayer"}
              </button>

              {error&&<div style={{background:"rgba(180,40,40,0.12)",border:"1px solid rgba(180,40,40,0.25)",borderRadius:"3px",padding:"14px 18px",color:"#e8a0a0",fontSize:"0.95rem",fontStyle:"italic",marginBottom:"16px"}}>{error}</div>}
              {loading&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px",padding:"40px",color:"#a8906e",fontStyle:"italic"}}><SpinnerSVG/><span>{depth==="deep"?"Entering deep prayer… this may take a moment.":"Crafting your prayer from Scripture…"}</span></div>}

              {result&&!loading&&(
                <>
                  <div className="print-card" style={{background:prayerCardBg,border:"1px solid #C9963A",borderRadius:"4px",padding:"44px 40px",color:"#2C1810",boxShadow:"0 12px 60px rgba(0,0,0,0.5)",position:"relative",animation:"fadeInUp 0.6s ease forwards",marginBottom:"18px"}}>
                    <span style={{position:"absolute",top:"14px",left:"18px",color:"#C9963A",fontSize:"1.3rem",opacity:0.55}}>✦</span>
                    <span style={{position:"absolute",top:"14px",right:"18px",color:"#C9963A",fontSize:"1.3rem",opacity:0.55}}>✦</span>

                    <div style={{textAlign:"center",marginBottom:"28px"}}>
                      <p style={{fontFamily:"'Cinzel',serif",fontSize:"0.88rem",letterSpacing:"0.18em",color:"#8B6914",textTransform:"uppercase",margin:"0 0 8px"}}>
                        A Prayer of {PRAYER_TYPES.find(p=>p.value===prayerType)?.label}
                      </p>
                      <span style={{background:DEPTH_COLORS[depth],borderRadius:"10px",padding:"2px 10px",fontSize:"0.65rem",fontFamily:"'Cinzel',serif",letterSpacing:"0.1em",color:"#fff",textTransform:"uppercase",opacity:0.85}}>
                        {DEPTH_LEVELS.find(d=>d.value===depth)?.label}
                      </span>
                      {variationCount>0&&<span style={{marginLeft:"8px",background:"rgba(80,60,120,0.4)",borderRadius:"10px",padding:"2px 10px",fontSize:"0.65rem",fontFamily:"'Cinzel',serif",letterSpacing:"0.1em",color:"#c8b8e8",textTransform:"uppercase",opacity:0.85}}>Variation {variationCount}</span>}
                    </div>

                    <PrayerWithDropCap text={result.prayerText} isDark={false}/>

                    <span style={{position:"absolute",bottom:"14px",left:"18px",color:"#C9963A",fontSize:"1.3rem",opacity:0.55}}>✦</span>
                    <span style={{position:"absolute",bottom:"14px",right:"18px",color:"#C9963A",fontSize:"1.3rem",opacity:0.55}}>✦</span>

                    <div style={{display:"flex",gap:"8px",justifyContent:"flex-end",marginTop:"28px",flexWrap:"wrap"}} className="no-print">
                      {tts.supported&&<GhostBtn onClick={()=>tts.speak(result.prayerText)} active={tts.speaking}>{tts.speaking?"◼ Stop":"▶ Read Aloud"}</GhostBtn>}
                      <GhostBtn onClick={copyPrayer}>{copiedPrayer?"✓ Copied":"⎘ Copy"}</GhostBtn>
                      <GhostBtn onClick={sharePrayer}>{shared?"✓ Link Copied":"⛓ Share"}</GhostBtn>
                      <GhostBtn onClick={printPrayer}>⎙ Print</GhostBtn>
                      <GhostBtn onClick={()=>callAPI(true)} disabled={loading}>↻ Variation</GhostBtn>
                      <GhostBtn onClick={saveToJournal} active={saved}>{saved?"✓ Saved":"＋ Save"}</GhostBtn>
                    </div>
                  </div>

                  {result.verses?.length>0&&(
                    <div className="print-verses" style={{background:verseCardBg,border:`1px solid ${verseBorder}`,borderRadius:"4px",padding:"32px 36px",animation:"fadeInUp 0.6s ease 0.2s both"}}>
                      <SectionDivider dark={isDark}>Scripture & Meditation</SectionDivider>
                      {result.verses.map((v,i)=>(
                        <div key={i} style={{borderLeft:"3px solid #C9963A",paddingLeft:"18px",marginBottom:"20px"}}>
                          <div className="verse-ref" style={{fontFamily:"'Cinzel',serif",fontSize:"0.76rem",letterSpacing:"0.12em",color:"#C9963A",marginBottom:"5px",textTransform:"uppercase"}}>{v.ref}</div>
                          <div className="verse-text" style={{fontSize:"1rem",lineHeight:"1.75",color:verseTextC,fontStyle:"italic",marginBottom:"5px"}}>"{v.text}"</div>
                          {v.context&&<div className="verse-context" style={{fontSize:"0.83rem",color:subtitleC,lineHeight:"1.5"}}>{v.context}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {tab==="Journal"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.72rem",letterSpacing:"0.12em",color:isDark?"#5a4525":"#a8906e",textTransform:"uppercase"}}>{journal.length} {journal.length===1?"entry":"entries"}</span>
              </div>
              <JournalTab journal={journal} onOpen={setModalEntry} isDark={isDark}/>
            </>
          )}

          {tab==="Verses"&&(
            <>
              <p style={{color:subtitleC,fontStyle:"italic",fontSize:"0.92rem",marginTop:0,marginBottom:"16px"}}>Tap a card to reveal the verse. Mark mastered to track memorization progress.</p>
              <VerseFlashcards allVerses={allVerses} isDark={isDark}/>
            </>
          )}

          {tab==="Streak"&&<StreakTab streak={streak} journal={journal} isDark={isDark}/>}

        </div>
      </div>
    </>
  );
}
