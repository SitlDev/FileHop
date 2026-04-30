import { useState, useEffect, useRef } from "react";

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "frontdesk_account";
function loadAccount() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; } }
function saveAccount(acc) { localStorage.setItem(STORAGE_KEY, JSON.stringify(acc)); }
function clearAccount() { localStorage.removeItem(STORAGE_KEY); }
function daysLeft(startDate) { return Math.max(0, 30 - Math.floor((Date.now() - new Date(startDate)) / 86400000)); }

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1100, isDesktop: w >= 1100, width: w };
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CHANNEL_META = {
  email:      { label: "Email",      icon: "✉",  color: "#E8852A", bg: "#FFF4E6", short: "EM" },
  text:       { label: "Text",       icon: "💬", color: "#2E9E4F", bg: "#EDF7EE", short: "TX" },
  quickbooks: { label: "QuickBooks", icon: "📊", color: "#3B6FD4", bg: "#EEF4FF", short: "QB" },
  slack:      { label: "Slack",      icon: "⚡", color: "#7C3AED", bg: "#F5EEFF", short: "SL" },
  voicemail:  { label: "Voicemail",  icon: "📞", color: "#DC2626", bg: "#FFF0F0", short: "VM" },
};
const ONBOARDING_STEPS = [
  { id: "contact",  label: "Contact Info",    icon: "👤" },
  { id: "project",  label: "Project Details", icon: "📋" },
  { id: "docs",     label: "Documents",       icon: "📄" },
  { id: "billing",  label: "Billing",         icon: "💳" },
  { id: "channels", label: "Comm Prefs",      icon: "💬" },
];
const STEP_CHECKS = {
  contact:  ["Full name", "Email verified", "Phone on file", "Company name"],
  project:  ["Scope defined", "Start date set", "Timeline agreed", "Budget approved"],
  docs:     ["Agreement sent", "Contract signed", "ID verified", "NDA if needed"],
  billing:  ["Payment on file", "Billing cycle set", "Invoice prefs", "Deposit collected"],
  channels: ["Preferred channel", "Notification prefs", "Emergency contact", "Portal access sent"],
};
const INIT_MESSAGES = [
  { id: 1, channel: "email",      client: "Maria Gonzalez",  avatar: "MG", subject: "Project Update",        preview: "Hi, I wanted to check on the kitchen renovation. Are we still on track?",  time: "9:42 AM",   unread: true,  starred: false, full: "Hi, I wanted to check in on the status of our kitchen renovation. Are we still on track for the 15th? My husband is getting a bit anxious. Let me know if you need anything from our end. Thanks — Maria" },
  { id: 2, channel: "text",       client: "Derek Holt",      avatar: "DH", subject: "Text Message",          preview: "Hey! Can we push the meeting to 3pm instead of 2?",                          time: "9:15 AM",   unread: true,  starred: true,  full: "Hey! Quick q — can we push the meeting to 3pm instead of 2? Thanks" },
  { id: 3, channel: "quickbooks", client: "Sunrise Bakery",  avatar: "SB", subject: "Invoice #1042 Overdue", preview: "Invoice #1042 for $3,200 is 14 days past due.",                             time: "8:50 AM",   unread: true,  starred: false, full: "Invoice #1042 for $3,200.00 is now 14 days past due. Sent Feb 12, due Feb 26. Two automatic reminders have been sent." },
  { id: 4, channel: "slack",      client: "Team: Roofers",   avatar: "RG", subject: "#general",              preview: "Jake: Supply delivery confirmed for Tuesday morning.",                        time: "Yesterday", unread: false, starred: false, full: "Jake: The supply delivery is confirmed for Tuesday morning. All hands on deck by 7am." },
  { id: 5, channel: "voicemail",  client: "Tom Brewster",    avatar: "TB", subject: "Voicemail — 1:24",      preview: "Called about the quote for the back deck. Sounds urgent.",                    time: "Yesterday", unread: true,  starred: false, full: 'Transcription: "Hi, this is Tom Brewster about the quote for the back deck. I need to make a decision by Friday. Please call me back."' },
  { id: 6, channel: "email",      client: "Priya Nair",      avatar: "PN", subject: "Contract signed",       preview: "Attached is the signed contract. Looking forward to it!",                    time: "Mon",       unread: false, starred: true,  full: "Hi, attached is the signed contract. Looking forward to getting started! Let me know next steps. — Priya" },
];
const INIT_CLIENTS = [
  { id: 1, name: "Sunrise Bakery",    contact: "Janet Liu",    email: "janet@sunrisebakery.com", phone: "(555) 201-4432", address: "842 Maple Ave, Orlando, FL 32801",              value: "$8,400",  added: "Mar 10", priority: "high",   steps: { contact:"done", project:"done", docs:"done",    billing:"pending", channels:"pending" } },
  { id: 2, name: "Derek Holt",        contact: "Derek Holt",   email: "dholt@gmail.com",         phone: "(555) 983-1120", address: "119 Birchwood Dr, Tampa, FL 33602",             value: "$2,200",  added: "Mar 9",  priority: "medium", steps: { contact:"done", project:"done", docs:"pending", billing:"pending", channels:"pending" } },
  { id: 3, name: "Verde Gardens LLC", contact: "Carlos Medina",email: "carlos@verde.com",         phone: "(555) 440-7771", address: "3300 SW 8th St, Miami, FL 33135",               value: "$14,000", added: "Mar 7",  priority: "low",    steps: { contact:"done", project:"done", docs:"done",    billing:"done",    channels:"done"    } },
  { id: 4, name: "Tom Brewster",      contact: "Tom Brewster", email: "tbrewster@outlook.com",   phone: "(555) 312-6650", address: "",                                              value: "$0",      added: "Mar 12", priority: "high",   steps: { contact:"done", project:"pending", docs:"pending", billing:"pending", channels:"pending" } },
  { id: 5, name: "Priya Nair",        contact: "Priya Nair",   email: "priya@nairc.co",          phone: "(555) 776-4490", address: "27 Coral Ridge Blvd, Fort Lauderdale, FL 33308",value: "$7,500",  added: "Mar 6",  priority: "low",    steps: { contact:"done", project:"done", docs:"done",    billing:"done",    channels:"pending" } },
];

const getProgress = (steps) => Math.round(Object.values(steps).filter(v => v === "done").length / Object.keys(steps).length * 100);
const priorityColor = { high: "#DC2626", medium: "#E8852A", low: "#2E9E4F" };

// ─── SHARED INPUT STYLES ──────────────────────────────────────────────────────
const inputBase = { width: "100%", border: "1px solid #E7E5E2", borderRadius: 8, padding: "11px 14px", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" };
const labelBase = { display: "block", fontSize: 11, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 5 };
const darkInput = { ...inputBase, background: "#1A1D27", border: "1px solid #2A2F45", color: "#F0EDE8", borderRadius: 10, marginBottom: 12 };
const darkLabel = { ...labelBase, color: "#6C7A9E" };

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ initials, color, bg, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.3, border: `2px solid ${color}22`, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─── REGISTER SCREEN ─────────────────────────────────────────────────────────
function RegisterScreen({ onRegister }) {
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ name: "", business: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { isMobile } = useBreakpoint();

  const setF = (k, v, isLogin = false) => { setErr(""); isLogin ? setLoginForm(p => ({ ...p, [k]: v })) : setForm(p => ({ ...p, [k]: v })); };

  const handleRegister = () => {
    if (!form.name || !form.email || !form.password) { setErr("Please fill in all required fields."); return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setErr("Enter a valid email address."); return; }
    if (form.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setLoading(true);
    setTimeout(() => {
      const acc = { name: form.name, business: form.business || form.name, email: form.email, password: form.password, trialStart: new Date().toISOString(), paid: false };
      saveAccount(acc); onRegister(acc); setLoading(false);
    }, 900);
  };

  const handleLogin = () => {
    if (!loginForm.email || !loginForm.password) { setErr("Enter your email and password."); return; }
    const acc = loadAccount();
    if (!acc || acc.email !== loginForm.email || acc.password !== loginForm.password) { setErr("Email or password incorrect."); return; }
    onRegister(acc);
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#0F1117", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }`}</style>
      {/* Desktop: two-column layout */}
      {!isMobile && (
        <div style={{ display: "flex", width: "100%", maxWidth: 900, minHeight: 560, borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
          {/* Left panel */}
          <div style={{ flex: 1, background: "linear-gradient(145deg, #1A1D27, #0F1117)", padding: "52px 48px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid #1E2030" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #E8852A, #DC2626)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 19, color: "#fff", marginBottom: 24, letterSpacing: "-0.5px" }}>FD</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#F0EDE8", letterSpacing: "-1px", marginBottom: 12, lineHeight: 1.2 }}>Frontdesk</div>
            <div style={{ fontSize: 15, color: "#6C7A9E", lineHeight: 1.7, marginBottom: 32 }}>Every client. Every message. One desk.</div>
            {["Unified inbox for all channels", "Client onboarding tracker", "AI-powered reply drafts", "Starting at $29/month"].map(f => (
              <div key={f} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <span style={{ color: "#2E9E4F", fontWeight: 800 }}>✓</span>
                <span style={{ fontSize: 14, color: "#A8A29E" }}>{f}</span>
              </div>
            ))}
            <div style={{ marginTop: 32, background: "#172A1D", border: "1px solid #2E9E4F44", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2E9E4F", marginBottom: 4 }}>✓ 30-day free trial</div>
              <div style={{ fontSize: 12, color: "#6C7A9E" }}>No credit card required. Cancel anytime.</div>
            </div>
          </div>
          {/* Right panel — form */}
          <div style={{ width: 380, background: "#13161F", padding: "52px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F0EDE8", marginBottom: 4 }}>{mode === "register" ? "Create your account" : "Welcome back"}</div>
            <div style={{ fontSize: 13, color: "#6C7A9E", marginBottom: 28 }}>{mode === "register" ? "Start your free 30-day trial today." : "Sign in to continue."}</div>
            {err && <div style={{ background: "#2A1010", border: "1px solid #DC262644", color: "#F87171", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠ {err}</div>}
            {mode === "register" ? (
              <>
                {[{ l: "Your Name *", k: "name", p: "Jane Smith" }, { l: "Business Name", k: "business", p: "Smith Contracting LLC" }, { l: "Email *", k: "email", p: "you@yourbusiness.com", t: "email" }, { l: "Password *", k: "password", p: "Min. 6 characters", t: "password" }].map(f => (
                  <div key={f.k} style={{ marginBottom: 14 }}>
                    <label style={darkLabel}>{f.l}</label>
                    <input type={f.t || "text"} value={form[f.k]} onChange={e => setF(f.k, e.target.value)} placeholder={f.p} style={darkInput} />
                  </div>
                ))}
                <button onClick={handleRegister} disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg, #E8852A, #DC2626)", border: "none", color: "#fff", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                  {loading ? "Creating account…" : "Start Free Trial →"}
                </button>
                <div style={{ marginTop: 16, color: "#6C7A9E", fontSize: 13, textAlign: "center" }}>
                  Already have an account? <button style={{ background: "none", border: "none", color: "#E8852A", fontFamily: "inherit", fontSize: 13, cursor: "pointer", fontWeight: 600 }} onClick={() => { setMode("login"); setErr(""); }}>Sign in</button>
                </div>
              </>
            ) : (
              <>
                {[{ l: "Email", k: "email", p: "you@yourbusiness.com", t: "email" }, { l: "Password", k: "password", p: "Password", t: "password" }].map(f => (
                  <div key={f.k} style={{ marginBottom: 14 }}>
                    <label style={darkLabel}>{f.l}</label>
                    <input type={f.t} value={loginForm[f.k]} onChange={e => setF(f.k, e.target.value, true)} placeholder={f.p} style={darkInput} />
                  </div>
                ))}
                <button onClick={handleLogin} style={{ width: "100%", background: "linear-gradient(135deg, #E8852A, #DC2626)", border: "none", color: "#fff", borderRadius: 10, padding: "13px", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700 }}>Sign In →</button>
                <div style={{ marginTop: 16, color: "#6C7A9E", fontSize: 13, textAlign: "center" }}>
                  New to Frontdesk? <button style={{ background: "none", border: "none", color: "#E8852A", fontFamily: "inherit", fontSize: 13, cursor: "pointer", fontWeight: 600 }} onClick={() => { setMode("register"); setErr(""); }}>Start free trial</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Mobile: single column */}
      {isMobile && (
        <div style={{ width: "100%", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #E8852A, #DC2626)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 19, color: "#fff", marginBottom: 16, letterSpacing: "-0.5px" }}>FD</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#F0EDE8", marginBottom: 4, textAlign: "center" }}>Frontdesk</div>
          <div style={{ fontSize: 14, color: "#6C7A9E", textAlign: "center", marginBottom: 24 }}>{mode === "register" ? "Every client, every message — one desk." : "Welcome back."}</div>
          {mode === "register" && <div style={{ background: "#172A1D", border: "1px solid #2E9E4F44", color: "#2E9E4F", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, textAlign: "center", marginBottom: 20, width: "100%" }}>✓ 30-day free trial · No credit card required</div>}
          {err && <div style={{ background: "#2A1010", border: "1px solid #DC262644", color: "#F87171", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14, width: "100%" }}>⚠ {err}</div>}
          {mode === "register" ? (
            <>
              {[{ l: "Your Name *", k: "name", p: "Jane Smith" }, { l: "Business Name", k: "business", p: "Smith Contracting LLC" }, { l: "Email *", k: "email", p: "you@yourbusiness.com", t: "email" }, { l: "Password *", k: "password", p: "Min. 6 characters", t: "password" }].map(f => (
                <div key={f.k} style={{ marginBottom: 14, width: "100%" }}>
                  <label style={darkLabel}>{f.l}</label>
                  <input type={f.t || "text"} value={form[f.k]} onChange={e => setF(f.k, e.target.value)} placeholder={f.p} style={darkInput} />
                </div>
              ))}
              <button onClick={handleRegister} disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg, #E8852A, #DC2626)", border: "none", color: "#fff", borderRadius: 10, padding: "14px", cursor: "pointer", fontFamily: "inherit", fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                {loading ? "Creating account…" : "Start Free Trial →"}
              </button>
              <div style={{ marginTop: 16, color: "#6C7A9E", fontSize: 13, textAlign: "center" }}>
                Already have an account? <button style={{ background: "none", border: "none", color: "#E8852A", fontFamily: "inherit", fontSize: 13, cursor: "pointer", fontWeight: 600 }} onClick={() => { setMode("login"); setErr(""); }}>Sign in</button>
              </div>
            </>
          ) : (
            <>
              {[{ l: "Email", k: "email", p: "you@yourbusiness.com", t: "email" }, { l: "Password", k: "password", p: "Password", t: "password" }].map(f => (
                <div key={f.k} style={{ marginBottom: 14, width: "100%" }}>
                  <label style={darkLabel}>{f.l}</label>
                  <input type={f.t} value={loginForm[f.k]} onChange={e => setF(f.k, e.target.value, true)} placeholder={f.p} style={darkInput} />
                </div>
              ))}
              <button onClick={handleLogin} style={{ width: "100%", background: "linear-gradient(135deg, #E8852A, #DC2626)", border: "none", color: "#fff", borderRadius: 10, padding: "14px", cursor: "pointer", fontFamily: "inherit", fontSize: 16, fontWeight: 700 }}>Sign In →</button>
              <div style={{ marginTop: 16, color: "#6C7A9E", fontSize: 13, textAlign: "center" }}>
                New to Frontdesk? <button style={{ background: "none", border: "none", color: "#E8852A", fontFamily: "inherit", fontSize: 13, cursor: "pointer", fontWeight: 600 }} onClick={() => { setMode("register"); setErr(""); }}>Start free trial</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PAYWALL SCREEN ───────────────────────────────────────────────────────────
function PaywallScreen({ account, onPaid, onLogout }) {
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tier, setTier] = useState("teams");
  const { isMobile } = useBreakpoint();

  const fmt = (k, v) => {
    if (k === "number") v = v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    if (k === "expiry") { v = v.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); }
    if (k === "cvv") v = v.replace(/\D/g, "").slice(0, 4);
    setCard(p => ({ ...p, [k]: v })); setErr("");
  };

  const handlePay = () => {
    if (card.number.replace(/\s/g, "").length < 15) { setErr("Enter a valid card number."); return; }
    if (!card.expiry.match(/^\d{2}\/\d{2}$/)) { setErr("Enter expiry as MM/YY."); return; }
    if (card.cvv.length < 3) { setErr("Enter your CVV."); return; }
    if (!card.name.trim()) { setErr("Enter the name on your card."); return; }
    setLoading(true);
    setTimeout(() => {
      const updated = { ...account, paid: true, tier, paidSince: new Date().toISOString() };
      saveAccount(updated); setDone(true);
      setTimeout(() => onPaid(updated), 1200); setLoading(false);
    }, 1200);
  };

  if (done) return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#0F1117", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#2E9E4F", marginBottom: 8 }}>You're all set!</div>
      <div style={{ fontSize: 15, color: "#6C7A9E" }}>Welcome back to Frontdesk.</div>
    </div>
  );

  const formContent = (
    <>
      {err && <div style={{ background: "#2A1010", border: "1px solid #DC262644", color: "#F87171", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠ {err}</div>}
      <div style={{ marginBottom: 14 }}><label style={darkLabel}>Card Number</label><input value={card.number} onChange={e => fmt("number", e.target.value)} placeholder="1234 5678 9012 3456" inputMode="numeric" style={darkInput} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div><label style={darkLabel}>Expiry</label><input value={card.expiry} onChange={e => fmt("expiry", e.target.value)} placeholder="MM/YY" inputMode="numeric" style={{ ...darkInput, marginBottom: 0 }} /></div>
        <div><label style={darkLabel}>CVV</label><input value={card.cvv} onChange={e => fmt("cvv", e.target.value)} placeholder="123" inputMode="numeric" style={{ ...darkInput, marginBottom: 0 }} /></div>
      </div>
      <div style={{ marginBottom: 20 }}><label style={darkLabel}>Name on Card</label><input value={card.name} onChange={e => fmt("name", e.target.value)} placeholder="Jane Smith" style={darkInput} /></div>
      <button onClick={handlePay} disabled={loading} style={{ width: "100%", background: "#E8852A", border: "none", color: "#fff", borderRadius: 10, padding: "14px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Processing…" : `Activate — $${tier === "basic" ? "29" : "39"}/month →`}
      </button>
      <div style={{ fontSize: 11, color: "#3A4060", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>Charged monthly on the same date. Cancel anytime.</div>
      <button onClick={onLogout} style={{ background: "none", border: "none", color: "#3A4060", fontFamily: "inherit", fontSize: 13, cursor: "pointer", width: "100%", marginTop: 16, textAlign: "center" }}>Sign out</button>
    </>
  );

  const features = ["Unified inbox (Email, Text, QB, Slack, Voicemail)", "Client onboarding tracker", "AI-powered reply drafts", "Unlimited clients", "Cancel anytime"];

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#0F1117", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{`* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }`}</style>
      {isMobile ? (
        <div style={{ width: "100%", color: "#F0EDE8" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #E8852A, #DC2626)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "#fff", marginBottom: 12, letterSpacing: "-0.5px" }}>FD</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Your trial has ended</div>
            <div style={{ fontSize: 13, color: "#6C7A9E" }}>Hi {account.name} — activate your subscription to continue.</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div onClick={() => setTier("basic")} style={{ flex: 1, background: tier === "basic" ? "#3B6FD411" : "#13161F", border: `2px solid ${tier === "basic" ? "#3B6FD4" : "#2A2F45"}`, borderRadius: 12, padding: "14px", cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: tier === "basic" ? "#3B6FD4" : "#6C7A9E" }}>Basic</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>$29<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span></div>
            </div>
            <div onClick={() => setTier("teams")} style={{ flex: 1, background: tier === "teams" ? "#3B6FD411" : "#13161F", border: `2px solid ${tier === "teams" ? "#3B6FD4" : "#2A2F45"}`, borderRadius: 12, padding: "14px", cursor: "pointer", transition: "all 0.2s", position: "relative" }}>
              <div style={{ position: "absolute", top: -10, right: 10, background: "#E8852A", color: "#fff", fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>POPULAR</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: tier === "teams" ? "#3B6FD4" : "#6C7A9E" }}>Teams</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>$39<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span></div>
            </div>
          </div>
          <div style={{ background: "#13161F", border: "1px solid #2A2F45", borderRadius: 14, padding: "18px", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: "#F0EDE8" }}>{tier === "basic" ? "Basic Plan Includes:" : "Teams Plan Includes:"}</div>
            {features.map(f => <div key={f} style={{ fontSize: 12, color: "#A8A29E", marginBottom: 6 }}>✓ {f}</div>)}
            {tier === "teams" && <div style={{ fontSize: 12, color: "#E8852A", fontWeight: 700, marginTop: 4 }}>✦ AI-Powered Email Drafting</div>}
          </div>
          {formContent}
        </div>
      ) : (
        <div style={{ display: "flex", maxWidth: 860, width: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
          <div style={{ flex: 1, background: "linear-gradient(145deg, #1A1D27, #0F1117)", padding: "52px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #E8852A, #DC2626)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "#fff", marginBottom: 24, letterSpacing: "-0.5px" }}>FD</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <div onClick={() => setTier("basic")} style={{ flex: 1, background: tier === "basic" ? "#3B6FD411" : "transparent", border: `2px solid ${tier === "basic" ? "#3B6FD4" : "#2A2F45"}`, borderRadius: 12, padding: "16px", cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: tier === "basic" ? "#3B6FD4" : "#6C7A9E", marginBottom: 4 }}>Basic</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>$29<span style={{ fontSize: 14, fontWeight: 400, color: "#6C7A9E" }}>/mo</span></div>
              </div>
              <div onClick={() => setTier("teams")} style={{ flex: 1, background: tier === "teams" ? "#3B6FD411" : "transparent", border: `2px solid ${tier === "teams" ? "#3B6FD4" : "#2A2F45"}`, borderRadius: 12, padding: "16px", cursor: "pointer", transition: "all 0.2s", position: "relative" }}>
                <div style={{ position: "absolute", top: -10, right: 10, background: "#E8852A", color: "#fff", fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>RECOMMENDED</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tier === "teams" ? "#3B6FD4" : "#6C7A9E", marginBottom: 4 }}>Teams</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>$39<span style={{ fontSize: 14, fontWeight: 400, color: "#6C7A9E" }}>/mo</span></div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#F0EDE8", marginBottom: 12 }}>{tier === "basic" ? "Basic Features:" : "Teams Features:"}</div>
              {features.map(f => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ color: "#2E9E4F", fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#A8A29E" }}>{f}</span>
                </div>
              ))}
              {tier === "teams" && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ color: "#E8852A", fontWeight: 800 }}>✦</span>
                  <span style={{ fontSize: 14, color: "#E8852A", fontWeight: 700 }}>AI Email Drafting & Briefs</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: 28, background: "#1E1510", border: "1px solid #E8852A44", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E8852A", marginBottom: 4 }}>⏰ Your free trial has ended</div>
              <div style={{ fontSize: 12, color: "#A8A29E" }}>Hi {account.name} — select a plan to continue.</div>
            </div>
          </div>
          <div style={{ width: 380, background: "#13161F", padding: "52px 40px", display: "flex", flexDirection: "column", justifyContent: "center", color: "#F0EDE8" }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>💳 Payment Details</div>
            <div style={{ fontSize: 13, color: "#6C7A9E", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>🔒 Secure checkout</div>
            {formContent}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
function Modal({ onClose, title, children, isMobile }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 14, padding: isMobile ? "20px 20px 32px" : "28px 32px", width: isMobile ? "100%" : 500, maxWidth: "100%", maxHeight: isMobile ? "85dvh" : "90vh", overflowY: "auto", animation: isMobile ? "slideUp 0.25s ease" : "fadeIn 0.2s ease", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        {isMobile && <div style={{ width: 36, height: 4, background: "#E7E5E2", borderRadius: 2, margin: "0 auto 18px" }} />}
        <div style={{ fontWeight: 700, fontSize: 18, color: "#1C1917", marginBottom: 20 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Frontdesk() {
  const [account, setAccount] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState("inbox");
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [clients, setClients] = useState(INIT_CLIENTS);
  const [channelFilter, setChannelFilter] = useState("all");
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", contact: "", email: "", phone: "", address: "" });
  const [checkState, setCheckState] = useState({});
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  useEffect(() => { setAccount(loadAccount()); setAuthReady(true); }, []);

  const handleRegister = (acc) => setAccount(acc);
  const handlePaid = (acc) => setAccount(acc);
  const handleLogout = () => { clearAccount(); setAccount(null); };

  const unread = messages.filter(m => m.unread).length;
  const inboxList = messages.filter(m => {
    const chOk = channelFilter === "all" || m.channel === channelFilter;
    const srOk = !search || m.client.toLowerCase().includes(search.toLowerCase()) || m.preview.toLowerCase().includes(search.toLowerCase());
    return chOk && srOk;
  });

  const markRead = (id) => setMessages(p => p.map(m => m.id === id ? { ...m, unread: false } : m));
  const toggleStar = (id) => setMessages(p => p.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
  const openMsg = (msg) => { setSelectedMsg(msg); markRead(msg.id); setAiText(""); setReplyText(""); };
  const openClient = (c) => { setSelectedClient({ ...c }); setAiText(""); };
  const markStep = (cid, sid, status) => {
    setClients(p => p.map(c => c.id === cid ? { ...c, steps: { ...c.steps, [sid]: status } } : c));
    setSelectedClient(p => p ? { ...p, steps: { ...p.steps, [sid]: status } } : p);
  };
  const aiDraft = async (context, prompt) => {
    if (account.tier !== "teams") { setAiText("Teams tier required for AI drafts."); return; }
    setAiLoading(true); setAiText("");
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const res = await fetch("https://api.anthropic.com/v1/messages", { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "dangerously-allow-browser": "true"
        }, 
        body: JSON.stringify({ 
          model: "claude-3-5-sonnet-20240620", 
          max_tokens: 1000, 
          messages: [{ role: "user", content: prompt }] 
        }) 
      });
      const data = await res.json();
      const txt = data.content?.map(b => b.text || "").join("") || "";
      setAiText(txt.trim());
      if (context === "reply") setReplyText(txt.trim());
    } catch (err) { 
      console.error("AI Error:", err);
      setAiText("Couldn't generate. Try again."); 
    }
    setAiLoading(false);
  };
  const addClient = () => {
    if (!newClient.name) return;
    const c = { id: Date.now(), ...newClient, value: "$0", added: "Today", priority: "high", steps: { contact: "done", project: "pending", docs: "pending", billing: "pending", channels: "pending" } };
    setClients(p => [c, ...p]); setShowAddClient(false);
    setNewClient({ name: "", contact: "", email: "", phone: "", address: "" });
    setTab("onboarding"); openClient(c);
  };

  if (!authReady) return null;
  if (!account) return <RegisterScreen onRegister={handleRegister} />;
  const trialExpired = daysLeft(account.trialStart) === 0;
  if (trialExpired && !account.paid) return <PaywallScreen account={account} onPaid={handlePaid} onLogout={handleLogout} />;
  const remaining = daysLeft(account.trialStart);

  // ── NAV ITEMS ────────────────────────────────────────────────────────────────
  const NAV = [
    { id: "inbox",      icon: "✉",  label: "Inbox",      badge: unread },
    { id: "onboarding", icon: "📋", label: "Onboarding", badge: clients.filter(c => c.priority === "high" && getProgress(c.steps) < 100).length },
    { id: "clients",    icon: "👥", label: "Clients",    badge: 0 },
  ];

  // ── MESSAGE DETAIL PANEL ────────────────────────────────────────────────────
  const MsgDetail = () => {
    if (!selectedMsg) return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#A8A29E", background: "#FAFAF8" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✉</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#57534E" }}>Select a message</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Your client conversations appear here</div>
      </div>
    );
    const ch = CHANNEL_META[selectedMsg.channel];
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#FAFAF8" }}>
        {isMobile && (
          <div style={{ background: "#1C1917", padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <button onClick={() => setSelectedMsg(null)} style={{ background: "none", border: "none", color: "#E8852A", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <button onClick={() => toggleStar(selectedMsg.id)} style={{ background: "none", border: "none", color: selectedMsg.starred ? "#E8852A" : "#78716C", fontSize: 20, cursor: "pointer" }}>{selectedMsg.starred ? "★" : "☆"}</button>
          </div>
        )}
        <div style={{ padding: "20px 24px", background: ch.bg, borderBottom: `1px solid ${ch.color}22`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar initials={selectedMsg.avatar} color={ch.color} bg="#fff" size={44} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1C1917" }}>{selectedMsg.client}</div>
              <div style={{ fontSize: 12, color: ch.color, fontWeight: 600 }}>{selectedMsg.time} · {ch.label}</div>
              <div style={{ fontSize: 14, color: "#44403C", fontWeight: 600, marginTop: 2 }}>{selectedMsg.subject}</div>
            </div>
          </div>
          {!isMobile && <button onClick={() => toggleStar(selectedMsg.id)} style={{ background: "none", border: "none", color: selectedMsg.starred ? "#E8852A" : "#C8C4BE", fontSize: 22, cursor: "pointer" }}>{selectedMsg.starred ? "★" : "☆"}</button>}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", fontSize: 15, lineHeight: 1.7, color: "#3C3835", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>{selectedMsg.full}</div>
          {selectedMsg.channel === "voicemail" && (
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button style={{ background: ch.bg, border: `1px solid ${ch.color}33`, color: ch.color, borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, flex: 1 }}>▶ Play</button>
              <button style={{ background: ch.bg, border: `1px solid ${ch.color}33`, color: ch.color, borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, flex: 1 }}>📞 Call Back</button>
            </div>
          )}
          {selectedMsg.channel === "quickbooks" && (
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button style={{ background: ch.bg, border: `1px solid ${ch.color}33`, color: ch.color, borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, flex: 1 }}>View Invoice</button>
              <button style={{ background: ch.bg, border: `1px solid ${ch.color}33`, color: ch.color, borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, flex: 1 }}>Send Reminder</button>
            </div>
          )}
        </div>
        <div style={{ borderTop: "1px solid #E7E5E2", padding: "16px 24px", background: "#fff", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#57534E" }}>Reply via {ch.label}</span>
            {account.tier === "teams" ? (
              <button onClick={() => aiDraft("reply", `Draft a short friendly professional reply (2-3 sentences, no headers) to this message from "${selectedMsg.client}" via ${selectedMsg.channel}: "${selectedMsg.full}"`)} disabled={aiLoading} style={{ background: aiLoading ? "#F0EDE8" : "#1C1917", border: "none", color: aiLoading ? "#A8A29E" : "#fff", borderRadius: 6, padding: "6px 12px", cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>
                {aiLoading ? "✦ Writing…" : "✦ AI Draft"}
              </button>
            ) : (
              <button onClick={() => setTab("billing")} style={{ background: "#EEF4FF", border: "1px solid #3B6FD433", color: "#3B6FD4", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700 }}>Upgrade for AI Drafts</button>
            )}
          </div>
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={`Reply to ${selectedMsg.client}…`} rows={isMobile ? 3 : 4} style={{ ...inputBase, resize: "none", lineHeight: 1.6 }} />
          <button onClick={() => setReplyText("")} style={{ background: ch.color, border: "none", color: "#fff", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, marginTop: 8, float: "right" }}>Send Reply →</button>
          <div style={{ clear: "both" }} />
        </div>
      </div>
    );
  };

  // ── CLIENT DETAIL PANEL ─────────────────────────────────────────────────────
  const ClientDetail = () => {
    if (!selectedClient) return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#A8A29E", background: "#FAFAF8" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#57534E" }}>Select a client</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Onboarding details appear here</div>
      </div>
    );
    const c = selectedClient;
    const pct = getProgress(c.steps);
    return (
      <div style={{ flex: 1, overflowY: "auto", background: "#FAFAF8" }}>
        {isMobile && (
          <div style={{ background: "#1C1917", padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
            <button onClick={() => setSelectedClient(null)} style={{ background: "none", border: "none", color: "#E8852A", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? "#2E9E4F" : "#E8852A" }}>{pct}% done</span>
          </div>
        )}
        <div style={{ padding: isDesktop ? "24px" : "16px", display: isDesktop ? "grid" : "block", gridTemplateColumns: "1fr 300px", gap: 20 }}>
          {/* Steps */}
          <div>
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "16px 0", borderBottom: "1px solid #E7E5E2" }}>
                <Avatar initials={c.name.split(" ").map(n => n[0]).join("").slice(0, 2)} color="#3B6FD4" bg="#EEF4FF" size={46} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#1C1917" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#78716C" }}>{c.contact} · {c.value}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: pct === 100 ? "#2E9E4F" : "#3B6FD4" }}>{pct}%</div>
                  <div style={{ background: "#F0EDE8", borderRadius: 4, height: 5, width: 80, overflow: "hidden", marginTop: 4 }}>
                    <div style={{ background: pct === 100 ? "#2E9E4F" : "linear-gradient(90deg,#E8852A,#3B6FD4)", height: "100%", width: `${pct}%`, borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            )}
            {/* Mobile progress bar */}
            {isMobile && (
              <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Avatar initials={c.name.split(" ").map(n => n[0]).join("").slice(0, 2)} color="#3B6FD4" bg="#EEF4FF" size={42} />
                  <div><div style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>{c.name}</div><div style={{ fontSize: 12, color: "#78716C" }}>{c.contact}</div></div>
                </div>
                <div style={{ background: "#F0EDE8", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ background: pct === 100 ? "#2E9E4F" : "linear-gradient(90deg,#E8852A,#3B6FD4)", height: "100%", width: `${pct}%`, borderRadius: 4 }} />
                </div>
              </div>
            )}
            {ONBOARDING_STEPS.map(step => {
              const done = c.steps[step.id] === "done";
              const checks = STEP_CHECKS[step.id] || [];
              return (
                <div key={step.id} style={{ background: "#fff", borderRadius: 10, marginBottom: 10, border: done ? "1.5px solid #B8EFC8" : "1.5px solid #F0EDE8", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: `4px solid ${done ? "#2E9E4F" : "#E8852A"}` }}>
                  <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{done ? "✅" : step.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>{step.label}</div>
                      <div style={{ fontSize: 12, color: done ? "#2E9E4F" : "#A8A29E", fontWeight: done ? 700 : 400 }}>{done ? "Complete" : "Pending"}</div>
                    </div>
                    <button onClick={() => markStep(c.id, step.id, done ? "pending" : "done")} style={{ background: done ? "#F0EDE8" : "#EDFBF1", border: `1px solid ${done ? "#E7E5E2" : "#B8EFC8"}`, color: done ? "#A8A29E" : "#2E9E4F", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {done ? "Undo" : "Mark Done ✓"}
                    </button>
                  </div>
                  {!done && (
                    <div style={{ borderTop: "1px solid #F0EDE8", padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {checks.map(item => {
                        const key = `${c.id}-${step.id}-${item}`;
                        return (
                          <label key={item} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minHeight: 32 }}>
                            <input type="checkbox" checked={!!checkState[key]} onChange={() => setCheckState(p => ({ ...p, [key]: !p[key] }))} style={{ width: 16, height: 16, accentColor: "#2E9E4F", cursor: "pointer", flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: checkState[key] ? "#2E9E4F" : "#57534E", textDecoration: checkState[key] ? "line-through" : "none", lineHeight: 1.3 }}>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {pct === 100 && <div style={{ background: "#EDFBF1", border: "1.5px solid #B8EFC8", borderRadius: 10, padding: "20px", textAlign: "center", marginTop: 4 }}><div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div><div style={{ fontWeight: 700, color: "#2E9E4F", fontSize: 16 }}>Onboarding Complete!</div></div>}
          </div>

          {/* Sidebar on desktop */}
          {isDesktop && (
            <div>
              {/* Info card */}
              <div style={{ background: "#fff", borderRadius: 10, padding: "18px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #F0EDE8" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Client Info</div>
                {[["Email", c.email], ["Phone", c.phone], ["Address", c.address || "—"], ["Added", c.added], ["Value", c.value]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #F5F3F0", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#78716C" }}>{l}</span>
                    <span style={{ fontSize: 12, color: "#1C1917", fontWeight: 600, maxWidth: 160, textAlign: "right", wordBreak: "break-all" }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* AI Brief */}
              <div style={{ background: "#fff", borderRadius: 10, padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #F0EDE8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#57534E" }}>✦ AI Status Brief</span>
                  <button onClick={() => aiDraft("brief", `Write a 2-3 sentence plain-English onboarding summary for client "${c.name}". Done: ${Object.entries(c.steps).filter(([, v]) => v === "done").map(([k]) => k).join(", ")}. Pending: ${Object.entries(c.steps).filter(([, v]) => v === "pending").map(([k]) => k).join(", ")}. Give one clear next action.`)} disabled={aiLoading} style={{ background: aiLoading ? "#F0EDE8" : "#1C1917", border: "none", color: aiLoading ? "#A8A29E" : "#fff", borderRadius: 6, padding: "5px 10px", cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700 }}>
                    {aiLoading ? "Writing…" : "Generate"}
                  </button>
                </div>
                {aiText ? <p style={{ fontSize: 13, lineHeight: 1.7, color: "#57534E", margin: 0 }}>{aiText}</p> : <p style={{ fontSize: 13, color: "#C0BAB4", fontStyle: "italic", margin: 0 }}>Tap Generate for an AI summary.</p>}
              </div>
            </div>
          )}
          {/* Mobile: info + AI below steps */}
          {isMobile && (
            <>
              <div style={{ background: "#fff", borderRadius: 10, padding: "16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#78716C", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Client Info</div>
                {[["Email", c.email], ["Phone", c.phone], ["Address", c.address || "—"], ["Added", c.added], ["Value", c.value]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #F5F3F0", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "#78716C" }}>{l}</span>
                    <span style={{ fontSize: 13, color: "#1C1917", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: "16px", marginBottom: 80, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#57534E" }}>✦ AI Status Brief</span>
                  {account.tier === "teams" ? (
                    <button onClick={() => aiDraft("brief", `Write a 2-3 sentence onboarding summary for "${c.name}". Done: ${Object.entries(c.steps).filter(([, v]) => v === "done").map(([k]) => k).join(", ")}. Pending: ${Object.entries(c.steps).filter(([, v]) => v === "pending").map(([k]) => k).join(", ")}. Give one clear next action.`)} disabled={aiLoading} style={{ background: aiLoading ? "#F0EDE8" : "#1C1917", border: "none", color: aiLoading ? "#A8A29E" : "#fff", borderRadius: 6, padding: "5px 10px", cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700 }}>
                      {aiLoading ? "Writing…" : "Generate"}
                    </button>
                  ) : (
                    <button onClick={() => setTab("billing")} style={{ background: "#F5F3F0", border: "1px solid #E7E5E2", color: "#78716C", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 700 }}>Upgrade</button>
                  )}
                </div>
                {aiText ? <p style={{ fontSize: 14, lineHeight: 1.7, color: "#57534E", margin: 0 }}>{aiText}</p> : <p style={{ fontSize: 13, color: "#C0BAB4", fontStyle: "italic", margin: 0 }}>Tap Generate for an AI summary.</p>}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── INBOX TAB CONTENT ────────────────────────────────────────────────────────
  const InboxContent = () => (
    <>
      {/* Channel filter */}
      <div style={{ overflowX: "auto", display: "flex", gap: 8, padding: "12px 16px", background: "#fff", borderBottom: "1px solid #F0EDE8", flexShrink: 0 }}>
        {[{ id: "all", label: "All", icon: "⊞" }, ...Object.entries(CHANNEL_META).map(([id, m]) => ({ id, label: m.label, icon: m.icon }))].map(ch => {
          const active = channelFilter === ch.id;
          const cnt = messages.filter(m => (ch.id === "all" || m.channel === ch.id) && m.unread).length;
          return (
            <button key={ch.id} onClick={() => setChannelFilter(ch.id)} style={{ flexShrink: 0, background: active ? "#1C1917" : "#F8F5F0", border: `1px solid ${active ? "#1C1917" : "#E7E5E2"}`, color: active ? "#fff" : "#57534E", borderRadius: 20, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active ? 700 : 400, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <span>{ch.icon}</span> {ch.label}
              {cnt > 0 && <span style={{ background: "#E8852A", color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 10, fontWeight: 800 }}>{cnt}</span>}
            </button>
          );
        })}
      </div>
      {/* Message list */}
      <div style={{ overflowY: "auto", flex: isDesktop ? "0 0 340px" : 1, borderRight: isDesktop ? "1px solid #E7E5E2" : "none", background: "#FAFAF8" }}>
        {inboxList.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#A8A29E" }}>No messages found</div>}
        <div style={{ padding: "10px 12px 0" }}>
          {inboxList.map(msg => {
            const ch = CHANNEL_META[msg.channel];
            return (
              <div key={msg.id} onClick={() => { openMsg(msg); }} style={{ background: "#fff", borderRadius: 10, padding: "13px 14px", marginBottom: 8, cursor: "pointer", display: "flex", gap: 11, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: msg.unread ? `4px solid ${ch.color}` : "4px solid transparent", outline: selectedMsg?.id === msg.id && isDesktop ? `2px solid ${ch.color}44` : "none" }}>
                <Avatar initials={msg.avatar} color={ch.color} bg={ch.bg} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontWeight: msg.unread ? 800 : 600, fontSize: 14, color: "#1C1917" }}>{msg.client}</span>
                    <span style={{ fontSize: 11, color: "#A8A29E", flexShrink: 0, marginLeft: 6 }}>{msg.time}</span>
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 3 }}>
                    <span style={{ background: ch.bg, color: ch.color, borderRadius: 4, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>{ch.icon} {ch.short}</span>
                    <span style={{ fontSize: 12, color: "#44403C", fontWeight: msg.unread ? 700 : 400, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{msg.subject}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#78716C", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{msg.preview}</div>
                </div>
                {msg.starred && <span style={{ color: "#E8852A", fontSize: 14, flexShrink: 0, alignSelf: "flex-start" }}>★</span>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  // ── ONBOARDING TAB CONTENT ───────────────────────────────────────────────────
  const OnboardingContent = () => {
    const total = clients.length;
    const complete = clients.filter(c => getProgress(c.steps) === 100).length;
    const actionNeeded = clients.filter(c => c.priority === "high" && getProgress(c.steps) < 100).length;
    return (
      <>
        {/* Stats */}
        <div style={{ padding: "16px", background: "#fff", borderBottom: "1px solid #F0EDE8", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, flexShrink: 0 }}>
          {[{ l: "Total", v: total, c: "#3B6FD4" }, { l: "Complete", v: complete, c: "#2E9E4F" }, { l: "Action Needed", v: actionNeeded, c: "#DC2626" }].map(s => (
            <div key={s.l} style={{ background: "#F8F5F0", borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "#78716C", marginTop: 3, fontWeight: 600, textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Client list */}
        <div style={{ overflowY: "auto", flex: isDesktop ? "0 0 340px" : 1, borderRight: isDesktop ? "1px solid #E7E5E2" : "none", background: "#FAFAF8" }}>
          <div style={{ padding: "10px 12px 0" }}>
            {clients.map(c => {
              const pct = getProgress(c.steps);
              const nextStep = ONBOARDING_STEPS.find(s => c.steps[s.id] === "pending");
              return (
                <div key={c.id} onClick={() => openClient(c)} style={{ background: "#fff", borderRadius: 10, padding: "14px", marginBottom: 8, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", outline: selectedClient?.id === c.id && isDesktop ? "2px solid #3B6FD444" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Avatar initials={c.name.split(" ").map(n => n[0]).join("").slice(0, 2)} color="#3B6FD4" bg="#EEF4FF" size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#1C1917" }}>{c.name}</span>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: priorityColor[c.priority], flexShrink: 0 }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#78716C" }}>{c.contact}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: pct === 100 ? "#2E9E4F" : "#3B6FD4" }}>{pct}%</div>
                  </div>
                  <div style={{ background: "#F0EDE8", borderRadius: 3, height: 4, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ background: pct === 100 ? "#2E9E4F" : "linear-gradient(90deg,#E8852A,#3B6FD4)", height: "100%", width: `${pct}%`, borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {ONBOARDING_STEPS.map(s => <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: c.steps[s.id] === "done" ? "#2E9E4F" : "#E7E5E2" }} />)}
                  </div>
                  {pct < 100 && nextStep && <div style={{ fontSize: 11, color: "#E8852A", marginTop: 6, fontWeight: 700 }}>Next: {nextStep.icon} {nextStep.label}</div>}
                  {pct === 100 && <div style={{ fontSize: 11, color: "#2E9E4F", marginTop: 6, fontWeight: 700 }}>✓ Fully onboarded</div>}
                </div>
              );
            })}
          </div>
          <div style={{ height: isMobile ? 80 : 20 }} />
        </div>
      </>
    );
  };

  // ── CLIENTS TAB ──────────────────────────────────────────────────────────────
  const ClientsContent = () => (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
      {clients.map(c => (
        <div key={c.id} onClick={() => { setTab("onboarding"); openClient(c); }} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar initials={c.name.split(" ").map(n => n[0]).join("").slice(0, 2)} color="#E8852A" bg="#FFF4E6" size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "#78716C" }}>{c.contact} · {c.email}</div>
            {c.address && <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 1 }}>📍 {c.address}</div>}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1C1917" }}>{c.value}</div>
            <div style={{ fontSize: 11, color: priorityColor[c.priority], fontWeight: 700 }}>{getProgress(c.steps)}%</div>
          </div>
        </div>
      ))}
      <div style={{ height: isMobile ? 80 : 20 }} />
    </div>
  );

  // ── LAYOUT ───────────────────────────────────────────────────────────────────
  const isDetailOpen = (tab === "inbox" && selectedMsg) || (tab === "onboarding" && selectedClient);

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#F8F5F0", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        textarea, input { font-size: 16px !important; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4CFC8; border-radius: 4px; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ background: "#1C1917", color: "#F7F4EF", padding: "0 20px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #E8852A, #DC2626)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff" }}>FD</div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.5px" }}>Frontdesk</span>
          {/* Desktop nav tabs in topbar */}
          {!isMobile && (
            <div style={{ display: "flex", marginLeft: 24, gap: 2 }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => { setTab(n.id); if (!isMobile) { setSelectedMsg(null); setSelectedClient(null); } }} style={{ background: tab === n.id ? "#2D2926" : "none", border: "none", color: tab === n.id ? "#E8852A" : "#78716C", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: tab === n.id ? 700 : 400, display: "flex", alignItems: "center", gap: 6 }}>
                  {n.icon} {n.label}
                  {n.badge > 0 && <span style={{ background: "#DC2626", color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 10, fontWeight: 800 }}>{n.badge}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!account.paid && remaining > 0 && !isMobile && (
            <span style={{ fontSize: 12, color: remaining <= 5 ? "#E8852A" : "#2E9E4F", fontWeight: 700, marginRight: 4 }}>
              {remaining <= 5 ? "⚠" : "✓"} {remaining} day{remaining !== 1 ? "s" : ""} left in trial
            </span>
          )}
          <button onClick={() => setShowSearch(p => !p)} style={{ background: "none", border: "none", color: "#A8A29E", fontSize: 18, cursor: "pointer", padding: 4 }}>🔍</button>
          {tab === "inbox" && <button onClick={() => setShowCompose(true)} style={{ background: "#E8852A", border: "none", color: "#fff", borderRadius: 6, padding: "6px 13px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>+ New</button>}
          {tab === "onboarding" && <button onClick={() => setShowAddClient(true)} style={{ background: "#3B6FD4", border: "none", color: "#fff", borderRadius: 6, padding: "6px 13px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>+ Client</button>}
          <button onClick={handleLogout} title="Sign out" style={{ background: "none", border: "none", color: "#57534E", fontSize: 16, cursor: "pointer", padding: 4 }} >⏻</button>
          {!isMobile && (
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2D2926", color: "#E7E5E4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
              {account.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Trial banner — mobile only */}
      {!account.paid && remaining > 0 && isMobile && (
        <div style={{ background: remaining <= 5 ? "#1E1510" : "#0F1F14", borderBottom: `1px solid ${remaining <= 5 ? "#E8852A55" : "#2E9E4F44"}`, padding: "7px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: remaining <= 5 ? "#E8852A" : "#2E9E4F", fontWeight: 700 }}>{remaining <= 5 ? "⚠" : "✓"} {remaining} day{remaining !== 1 ? "s" : ""} left in free trial</span>
          <span style={{ fontSize: 11, color: "#6C7A9E" }}>from $29/mo after</span>
        </div>
      )}

      {/* Search bar */}
      {showSearch && (
        <div style={{ background: "#fff", padding: "10px 16px", borderBottom: "1px solid #E7E5E2", flexShrink: 0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients or messages…" autoFocus style={{ ...inputBase, background: "#F8F5F0" }} />
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

        {/* Desktop sidebar nav (for tablet) */}
        {isTablet && (
          <div style={{ width: 60, background: "#1C1917", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 4, flexShrink: 0 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)} title={n.label} style={{ background: tab === n.id ? "#2D2926" : "none", border: "none", color: tab === n.id ? "#E8852A" : "#78716C", borderRadius: 8, padding: "10px", cursor: "pointer", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: 50 }}>
                <span style={{ fontSize: 20 }}>{n.icon}</span>
                {n.badge > 0 && <span style={{ position: "absolute", top: 6, right: 6, background: "#DC2626", color: "#fff", borderRadius: 6, padding: "0 3px", fontSize: 8, fontWeight: 800 }}>{n.badge}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Content area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Mobile: show either list OR detail */}
          {isMobile && (
            <>
              {isDetailOpen ? (
                tab === "inbox" ? <MsgDetail /> : <ClientDetail />
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {tab === "inbox" && <InboxContent />}
                  {tab === "onboarding" && <OnboardingContent />}
                  {tab === "clients" && <ClientsContent />}
                </div>
              )}
            </>
          )}

          {/* Desktop/Tablet: side-by-side list + detail */}
          {!isMobile && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Left: list panel */}
              <div style={{ width: 340, display: "flex", flexDirection: "column", borderRight: "1px solid #E7E5E2", overflow: "hidden", flexShrink: 0 }}>
                {tab === "inbox" && <InboxContent />}
                {tab === "onboarding" && <OnboardingContent />}
                {tab === "clients" && <ClientsContent />}
              </div>
              {/* Right: detail panel */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {tab === "inbox" && <MsgDetail />}
                {tab === "onboarding" && <ClientDetail />}
                {tab === "clients" && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#A8A29E" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#57534E" }}>Client directory</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Click a client to view onboarding details</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && !isDetailOpen && (
        <div style={{ background: "#1C1917", borderTop: "1px solid #2D2926", display: "flex", height: 60, flexShrink: 0, position: "sticky", bottom: 0, zIndex: 50 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: 1, background: "none", border: "none", color: tab === n.id ? "#E8852A" : "#78716C", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, fontFamily: "inherit", fontSize: 10, fontWeight: tab === n.id ? 700 : 400 }}>
              <div style={{ position: "relative" }}>
                <span style={{ fontSize: 20 }}>{n.icon}</span>
                {n.badge > 0 && <span style={{ position: "absolute", top: -4, right: -8, background: "#DC2626", color: "#fff", borderRadius: 8, padding: "0 4px", fontSize: 9, fontWeight: 800 }}>{n.badge}</span>}
              </div>
              {n.label}
            </button>
          ))}
        </div>
      )}

      {/* ── COMPOSE MODAL ── */}
      {showCompose && (
        <Modal onClose={() => setShowCompose(false)} title="New Message" isMobile={isMobile}>
          <div style={{ marginBottom: 14 }}><label style={labelBase}>To</label><input placeholder="Client name…" style={inputBase} /></div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelBase}>Send Via</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(CHANNEL_META).map(([id, m]) => (
                <button key={id} style={{ background: m.bg, border: `1px solid ${m.color}33`, color: m.color, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>{m.icon} {m.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}><label style={labelBase}>Message</label><textarea placeholder="Write your message…" rows={4} style={{ ...inputBase, resize: "none" }} /></div>
          <button style={{ background: "#E8852A", border: "none", color: "#fff", borderRadius: 8, padding: "13px", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, width: "100%" }} onClick={() => setShowCompose(false)}>Send Message →</button>
        </Modal>
      )}

      {/* ── ADD CLIENT MODAL ── */}
      {showAddClient && (
        <Modal onClose={() => setShowAddClient(false)} title="Add New Client" isMobile={isMobile}>
          <div style={{ fontSize: 13, color: "#78716C", marginBottom: 18, marginTop: -10 }}>Fill in what you know — finish the rest later.</div>
          {[
            { label: "Business / Client Name *", key: "name", placeholder: "e.g. Sunrise Bakery" },
            { label: "Primary Contact", key: "contact", placeholder: "Full name" },
            { label: "Email", key: "email", placeholder: "email@example.com", type: "email" },
            { label: "Phone", key: "phone", placeholder: "(555) 000-0000", type: "tel" },
            { label: "Address", key: "address", placeholder: "123 Main St, City, State ZIP" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={labelBase}>{f.label}</label>
              <input type={f.type || "text"} value={newClient[f.key]} onChange={e => setNewClient(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputBase} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button style={{ background: "#F0EDE8", border: "none", color: "#57534E", borderRadius: 8, padding: "12px", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, flex: 0.4 }} onClick={() => setShowAddClient(false)}>Cancel</button>
            <button style={{ background: "#3B6FD4", border: "none", color: "#fff", borderRadius: 8, padding: "12px", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, flex: 0.6 }} onClick={addClient}>Add Client →</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
