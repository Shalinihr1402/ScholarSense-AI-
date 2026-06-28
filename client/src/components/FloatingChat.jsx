import React from "react";
import { X, Send, Minimize2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { chatApi } from "../services/api.js";

// ── Quick prompts ─────────────────────────────────────────────────────────────
const QUICK = [
  { label: "🎯 Am I eligible?",       q: "Based on my profile — marks, income, category, and college — am I eligible for any NSP or SSP scholarship this year?" },
  { label: "🏦 Money not arrived?",   q: "My scholarship is sanctioned but money hasn't reached my bank. Based on my bank details in my profile, what is most likely wrong?" },
  { label: "📄 Documents needed",     q: "Based on my category, course, and college in my profile, give me the exact list of documents I need for my scholarship." },
  { label: "🚨 Application rejected", q: "My scholarship was marked Defective or Rejected. Based on my profile, what are the likely reasons and what should I do immediately?" },
];

// ── Robot SVG mascot ──────────────────────────────────────────────────────────
function RobotMascot({ size = 62 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer teal ring */}
      <circle cx="60" cy="60" r="56" stroke="#0d9488" strokeWidth="2.5" strokeDasharray="8 4" strokeLinecap="round" opacity="0.5" />
      {/* Inner blue ring */}
      <circle cx="60" cy="60" r="48" stroke="#2563eb" strokeWidth="3" />
      {/* White body circle */}
      <circle cx="60" cy="62" r="40" fill="white" />

      {/* Robot head */}
      <rect x="38" y="50" width="44" height="34" rx="10" fill="#1e3a8a" />
      {/* Robot face screen */}
      <rect x="43" y="55" width="34" height="22" rx="6" fill="#dbeafe" />
      {/* Eyes */}
      <ellipse cx="53" cy="65" rx="5" ry="5.5" fill="white" />
      <ellipse cx="67" cy="65" rx="5" ry="5.5" fill="white" />
      <circle cx="53" cy="65" r="2.5" fill="#2563eb" />
      <circle cx="67" cy="65" r="2.5" fill="#2563eb" />
      <circle cx="54" cy="64" r="1" fill="white" />
      <circle cx="68" cy="64" r="1" fill="white" />
      {/* Smile */}
      <path d="M52 72 Q60 77 68 72" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Ears / side buttons */}
      <rect x="33" y="60" width="6" height="10" rx="3" fill="#2563eb" />
      <rect x="81" y="60" width="6" height="10" rx="3" fill="#2563eb" />

      {/* Graduation cap */}
      <rect x="38" y="42" width="44" height="7" rx="2" fill="#1e3a8a" />
      <polygon points="60,28 88,42 32,42" fill="#1e3a8a" />
      {/* Tassel */}
      <line x1="88" y1="42" x2="91" y2="55" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
      <circle cx="91" cy="57" r="3" fill="#0d9488" />

      {/* Body */}
      <rect x="46" y="82" width="28" height="18" rx="6" fill="#2563eb" />
      {/* Chest badge */}
      <circle cx="60" cy="90" r="7" fill="white" />
      <circle cx="60" cy="90" r="4" fill="#0d9488" />
      <path d="M57 90 L59.5 92.5 L64 87" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Waving arm (right) */}
      <rect x="74" y="82" width="8" height="20" rx="4" fill="#2563eb" transform="rotate(-30 78 82)" />
      <circle cx="80" cy="101" r="4" fill="#2563eb" />
      {/* Left arm */}
      <rect x="38" y="82" width="8" height="16" rx="4" fill="#2563eb" />
      <circle cx="42" cy="98" r="4" fill="#2563eb" />

      {/* Green dot bottom right */}
      <circle cx="98" cy="92" r="8" fill="#4ade80" />
      <circle cx="98" cy="92" r="5" fill="#22c55e" />
    </svg>
  );
}

// ── Animated speech bubble ────────────────────────────────────────────────────
function SpeechBubble({ onClick }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed", bottom: 108, right: 88, zIndex: 8999,
        background: "white",
        borderRadius: "18px 18px 4px 18px",
        padding: "16px 20px",
        boxShadow: "0 8px 32px rgba(15,23,42,.16), 0 2px 8px rgba(37,99,235,.1)",
        border: "1px solid #e2e8f0",
        cursor: "pointer",
        width: 200,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0) scale(1)" : "translateY(12px) scale(.94)",
        transition: "opacity .35s cubic-bezier(.22,.61,.36,1), transform .35s cubic-bezier(.22,.61,.36,1)"
      }}
    >
      {/* "Hai!" text animates in */}
      <p style={{
        fontSize: 20, fontWeight: 900, color: "#2563eb", margin: "0 0 4px",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(6px)",
        transition: "opacity .4s .15s, transform .4s .15s"
      }}>
        Hai! 👋
      </p>
      <p style={{
        fontSize: 14, color: "#334155", margin: 0, lineHeight: 1.5,
        fontWeight: 500,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(6px)",
        transition: "opacity .4s .28s, transform .4s .28s"
      }}>
        How can I<br />help you today?
      </p>
      {/* Bubble tail */}
      <div style={{
        position: "absolute", bottom: -10, right: 24,
        width: 0, height: 0,
        borderLeft: "12px solid transparent",
        borderRight: "0",
        borderTop: "12px solid white",
        filter: "drop-shadow(0 3px 2px rgba(0,0,0,.05))"
      }} />
    </div>
  );
}

// ── Sparkle lines around FAB ──────────────────────────────────────────────────
function Sparkles() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" style={{ position: "absolute", top: -14, left: -14, pointerEvents: "none" }}>
      {/* teal short lines like in the image */}
      <line x1="75" y1="10" x2="82" y2="5"  stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sparkle1 2s ease infinite" }} />
      <line x1="80" y1="20" x2="89" y2="18" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sparkle2 2s .4s ease infinite" }} />
      <line x1="72" y1="5"  x2="72" y2="0"  stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sparkle3 2s .8s ease infinite" }} />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FloatingChat() {
  const [open, setOpen]     = React.useState(false);
  const [bubble, setBubble] = React.useState(true);
  const [input, setInput]   = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [msgs, setMsgs]     = React.useState([
    { from: "bot", text: "Hai! 👋 How can I help you with your scholarship today?" }
  ]);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    const t = setTimeout(() => setBubble(false), 7000);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function send(text) {
    const t = (text || input).trim();
    if (!t || typing) return;
    setInput(""); setBubble(false);
    const history = msgs.slice(-8);
    setMsgs(m => [...m, { from: "user", text: t }]);
    setTyping(true);
    try {
      const { reply } = await chatApi.send(t, history);
      setMsgs(m => [...m, { from: "bot", text: reply }]);
    } catch (err) {
      const msg = err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")
        ? "⚠️ Cannot reach the server. Make sure the backend is running on port 5000."
        : "Sorry, I couldn't get a response. Please try again.";
      setMsgs(m => [...m, { from: "bot", text: msg }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <>
      {/* ── Chat panel ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 106, right: 24, zIndex: 9000,
          width: 360, height: 520,
          background: "white",
          borderRadius: 22,
          boxShadow: "0 12px 48px rgba(15,23,42,.18), 0 2px 12px rgba(37,99,235,.12)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          animation: "chatSlideUp .24s cubic-bezier(.22,.61,.36,1)"
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
            padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 12,
            flexShrink: 0
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "rgba(255,255,255,.18)",
              border: "2px solid rgba(255,255,255,.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden"
            }}>
              <RobotMascot size={46} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontWeight: 800, fontSize: 15, margin: 0 }}>ScholarSense AI</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 0 2px rgba(74,222,128,.3)", animation: "pulseGreen 2s ease infinite" }} />
                <span style={{ color: "rgba(255,255,255,.8)", fontSize: 12, fontWeight: 600 }}>Online · Scholarship Assistant</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <Link to="/chatbot" onClick={() => setOpen(false)} title="Open full chat"
                style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <ExternalLink size={14} />
              </Link>
              <button onClick={() => setOpen(false)}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <Minimize2 size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, background: "#f8fafc" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                {m.from === "bot" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 2, overflow: "hidden" }}>
                    <RobotMascot size={30} />
                  </div>
                )}
                <div style={{
                  maxWidth: "80%", padding: "10px 14px",
                  borderRadius: m.from === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  background: m.from === "user" ? "linear-gradient(135deg,#2563eb,#0891b2)" : "white",
                  color: m.from === "user" ? "white" : "#0f172a",
                  fontSize: 14, lineHeight: 1.6, fontWeight: 500,
                  boxShadow: "0 2px 8px rgba(15,23,42,.08)",
                  border: m.from === "bot" ? "1px solid #e2e8f0" : "none"
                }}>{m.text}</div>
              </div>
            ))}

            {/* Typing dots */}
            {typing && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  <RobotMascot size={30} />
                </div>
                <div style={{ padding: "12px 16px", background: "white", borderRadius: "4px 18px 18px 18px", border: "1px solid #e2e8f0", display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "#94a3b8", animation: `dotBounce 1.2s ease ${d * .2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {msgs.length <= 2 && (
            <div style={{ padding: "10px 14px 6px", display: "flex", gap: 6, flexWrap: "wrap", background: "#f8fafc", flexShrink: 0 }}>
              {QUICK.map(q => (
                <button key={q.label} onClick={() => send(q.q)} disabled={typing}
                  style={{
                    padding: "6px 12px", fontSize: 12, fontWeight: 700,
                    borderRadius: 999, border: "1.5px solid #dbeafe",
                    background: "white", color: "#2563eb", cursor: "pointer", transition: "background .12s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                >{q.label}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "10px 14px 14px", background: "white", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8, flexShrink: 0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Type your question…"
              style={{
                flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 14,
                padding: "10px 14px", fontSize: 14, outline: "none",
                background: "#f8fafc", transition: "border-color .15s"
              }}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
            <button onClick={() => send()} disabled={!input.trim() || typing}
              style={{
                width: 42, height: 42, borderRadius: "50%", border: "none",
                background: input.trim() ? "linear-gradient(135deg,#2563eb,#0891b2)" : "#e2e8f0",
                color: input.trim() ? "white" : "#94a3b8",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background .15s",
                boxShadow: input.trim() ? "0 4px 12px rgba(37,99,235,.35)" : "none"
              }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Speech bubble (Hai!) ── */}
      {!open && bubble && (
        <SpeechBubble onClick={() => { setOpen(true); setBubble(false); }} />
      )}

      {/* ── FAB with robot mascot ── */}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9001 }}>
        <div style={{ position: "relative", width: 70, height: 70 }}>
          {/* Sparkle lines */}
          {!open && <Sparkles />}

          {/* Main button */}
          <button
            onClick={() => { setOpen(o => !o); setBubble(false); }}
            title="Chat with ScholarSense AI"
            style={{
              width: 70, height: 70, borderRadius: "50%",
              background: open ? "#ef4444" : "white",
              border: open ? "3px solid #fca5a5" : "3px solid #2563eb",
              boxShadow: open
                ? "0 6px 24px rgba(239,68,68,.35)"
                : "0 6px 28px rgba(37,99,235,.35), 0 2px 10px rgba(15,23,42,.12)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .22s cubic-bezier(.22,.61,.36,1)",
              overflow: "hidden",
              padding: 0,
              transform: "scale(1)"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {open
              ? <X size={26} color="white" />
              : <RobotMascot size={70} />
            }
          </button>

          {/* Pulsing ring */}
          {!open && (
            <div style={{
              position: "absolute", inset: -5,
              borderRadius: "50%",
              border: "2px solid rgba(13,148,136,.4)",
              animation: "ringPulse 2.5s ease infinite",
              pointerEvents: "none"
            }} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-5px); }
        }
        @keyframes pulseGreen {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 2px rgba(74,222,128,.3); }
          50%      { opacity: .7; box-shadow: 0 0 0 5px rgba(74,222,128,.1); }
        }
        @keyframes ringPulse {
          0%   { transform: scale(1);   opacity: .8; }
          70%  { transform: scale(1.18); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes sparkle1 {
          0%, 100% { opacity: 1; transform: scale(1) translate(0,0); }
          50%      { opacity: .3; transform: scale(.6) translate(2px,-2px); }
        }
        @keyframes sparkle2 {
          0%, 100% { opacity: .8; transform: scale(1); }
          50%      { opacity: .2; transform: scale(.5) translate(3px,1px); }
        }
        @keyframes sparkle3 {
          0%, 100% { opacity: 1; transform: scale(1) translateY(0); }
          50%      { opacity: .2; transform: scale(.5) translateY(-3px); }
        }
      `}</style>
    </>
  );
}
