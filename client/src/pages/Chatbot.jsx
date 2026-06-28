import React from "react";
import { Send, Bot, User, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";
import { chatApi } from "../services/api.js";

const QUICK_PROMPTS = [
  { emoji: "🎯", label: "Am I eligible?", q: "Based on my profile — my marks, income, category, and college — am I eligible for any NSP or SSP scholarship this year?" },
  { emoji: "🏦", label: "Why no money yet?", q: "My scholarship is sanctioned on the portal but money hasn't reached my bank account. Based on my bank details in my profile, what is most likely wrong and how do I fix it?" },
  { emoji: "📄", label: "Documents checklist", q: "Based on my category, course, and college in my profile, give me the exact list of documents I need to submit for my scholarship application." },
  { emoji: "🚨", label: "Urgent: application rejected", q: "My scholarship application was marked Defective or Rejected. Based on my profile data, what are the most likely reasons and what should I do immediately?" },
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "12px 16px", background: "white", borderRadius: "4px 18px 18px 18px", border: "1px solid #e2e8f0", width: "fit-content" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#94a3b8", animation: `dotBounce 1.2s ease ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

function Bubble({ msg }) {
  const isUser = msg.from === "user";
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
      {!isUser && (
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <Bot size={16} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: "75%", padding: "11px 16px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
        background: isUser ? "linear-gradient(135deg,#2563eb,#0891b2)" : "white",
        color: isUser ? "white" : "#0f172a",
        fontSize: 14, lineHeight: 1.65, fontWeight: 500,
        boxShadow: "0 2px 10px rgba(15,23,42,.08)",
        border: isUser ? "none" : "1px solid #e2e8f0",
        whiteSpace: "pre-wrap"
      }}>
        {msg.text}
      </div>
      {isUser && (
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f1f5f9", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <User size={16} color="#64748b" />
        </div>
      )}
    </div>
  );
}

export default function Chatbot() {
  const [msgs, setMsgs] = React.useState([
    { from: "bot", text: "Hi! 👋 I'm ScholarSense AI. I've loaded your profile to give you personalized scholarship guidance.\n\nYou can ask me about your eligibility, bank issues, document status, or anything about NSP/SSP." }
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const bottomRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send(text) {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput("");
    setError(null);

    const userMsg = { from: "user", text: t };
    const history = msgs.filter(m => m.from === "bot" || m.from === "user")
      .slice(-10); // keep last 10 for context window

    setMsgs(m => [...m, userMsg]);
    setLoading(true);

    try {
      const { reply } = await chatApi.send(t, history);
      setMsgs(m => [...m, { from: "bot", text: reply }]);
    } catch (err) {
      setError(err.message || "Failed to get response. Please try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function clearChat() {
    setMsgs([{ from: "bot", text: "Hi! 👋 Chat cleared. How can I help you with your scholarship today?" }]);
    setError(null);
  }

  const showQuickPrompts = msgs.length <= 1;

  return (
    <div className="page-stack" style={{ height: "calc(100vh - 48px)", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-5px); }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", borderRadius: 16, padding: "20px 24px", flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={22} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: "white", fontWeight: 900, fontSize: 18, margin: "0 0 3px", letterSpacing: "-.02em" }}>ScholarSense AI Chat</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.8)", fontWeight: 600 }}>Online · Answers from your profile</span>
          </div>
        </div>
        <button onClick={clearChat} title="Clear chat"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 10, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <RefreshCw size={13} /> Clear
        </button>
      </div>

      {/* RAG info banner */}
      <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <Lightbulb size={15} color="#16a34a" />
        <p style={{ fontSize: 12.5, color: "#166534", margin: 0, fontWeight: 600 }}>
          AI answers are personalized using your saved profile — income, marks, bank status, documents, and college details.
          Keep your profile updated for best results.
        </p>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 4px", display: "flex", flexDirection: "column", gap: 14, background: "#f8fafc", borderRadius: 16, border: "1.5px solid #e2e8f0" }}>
        <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 14 }}>
          {msgs.map((m, i) => <Bubble key={i} msg={m} />)}

          {/* Quick prompts */}
          {showQuickPrompts && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", margin: "0 0 4px" }}>Try asking:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {QUICK_PROMPTS.map(q => (
                  <button key={q.label} onClick={() => send(q.q)}
                    style={{
                      padding: "12px 14px", fontSize: 13, fontWeight: 700,
                      borderRadius: 12, border: "1.5px solid #dbeafe",
                      background: "white", color: "#0f172a", cursor: "pointer",
                      transition: "all .15s", textAlign: "left", lineHeight: 1.5,
                      display: "flex", flexDirection: "column", gap: 3
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#dbeafe"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <span style={{ fontSize: 18 }}>{q.emoji}</span>
                    <span style={{ color: "#2563eb", fontWeight: 800 }}>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={16} color="white" />
              </div>
              <TypingDots />
            </div>
          )}

          {error && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12 }}>
              <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: "#92400e", margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0, boxShadow: "0 2px 12px rgba(15,23,42,.06)" }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about eligibility, bank issues, documents, NSP status… (Enter to send)"
          rows={1}
          style={{
            flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 12,
            padding: "10px 14px", fontSize: 14, outline: "none",
            background: "#f8fafc", resize: "none", lineHeight: 1.5,
            fontFamily: "inherit", transition: "border-color .15s",
            maxHeight: 120, overflowY: "auto"
          }}
          onFocus={e => e.target.style.borderColor = "#2563eb"}
          onBlur={e => e.target.style.borderColor = "#e2e8f0"}
        />
        <button onClick={() => send()} disabled={!input.trim() || loading}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: input.trim() && !loading ? "linear-gradient(135deg,#2563eb,#0891b2)" : "#e2e8f0",
            color: input.trim() && !loading ? "white" : "#94a3b8",
            cursor: input.trim() && !loading ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all .15s",
            boxShadow: input.trim() && !loading ? "0 4px 14px rgba(37,99,235,.35)" : "none"
          }}>
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
