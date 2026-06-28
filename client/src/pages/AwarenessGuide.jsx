import React from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, Phone,
  Building2, CreditCard, ShieldCheck, Clock, Info, Lightbulb,
  Banknote, Smartphone, MapPin, Mail, Star, TrendingUp, Users
} from "lucide-react";

// ── Animations injected once ─────────────────────────────────────────────────
const ANIM_CSS = `
@keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes slideIn  { from { opacity:0; transform:translateX(-18px); } to { opacity:1; transform:translateX(0); } }
@keyframes pulseRing { 0%,100%{ box-shadow:0 0 0 0 rgba(37,99,235,.35); } 60%{ box-shadow:0 0 0 10px rgba(37,99,235,0); } }
@keyframes flowDash  { to { stroke-dashoffset:-20; } }
@keyframes bobUp     { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6px); } }
@keyframes shimmer   { 0%{ background-position:-400px 0; } 100%{ background-position:400px 0; } }
@keyframes countUp   { from{ opacity:0; transform:scale(.7); } to{ opacity:1; transform:scale(1); } }
`;

function AU(delay = 0, extra = {}) {
  return { animation: `fadeUp .55s ease ${delay}s both`, ...extra };
}

// ── SVG: Journey Flow ─────────────────────────────────────────────────────────
function SvgJourney() {
  return (
    <svg viewBox="0 0 640 160" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="gBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="gTeal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="gViolet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="gAmber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <marker id="mBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3z" fill="#2563eb" />
        </marker>
      </defs>
      {/* Track */}
      <line x1="80" y1="68" x2="560" y2="68" stroke="#e2e8f0" strokeWidth="3" strokeDasharray="6,4" />

      {/* Nodes */}
      {[
        { x: 80,  label: "Ministry", sub: "Scholarship\nApproved", grad: "url(#gBlue)" },
        { x: 213, label: "NSP/PFMS", sub: "Application\nVerified", grad: "url(#gViolet)" },
        { x: 346, label: "Bank Gate", sub: "3 Checks\nRequired", grad: "url(#gAmber)" },
        { x: 480, label: "Your Account", sub: "Money\nReceived", grad: "url(#gTeal)" },
      ].map(({ x, label, sub, grad }) => (
        <g key={x}>
          <circle cx={x} cy={68} r={34} fill={grad} opacity=".12" />
          <circle cx={x} cy={68} r={24} fill={grad} />
          <text x={x} y={72} fill="white" fontSize="10" fontWeight="900" textAnchor="middle">{label.split(" ")[0]}</text>
          <text x={x} y={98} fill="#374151" fontSize="9" fontWeight="700" textAnchor="middle">{label.split(" ").slice(1).join(" ")}</text>
          {sub.split("\n").map((l, i) => (
            <text key={i} x={x} y={110 + i * 12} fill="#64748b" fontSize="8.5" textAnchor="middle">{l}</text>
          ))}
        </g>
      ))}

      {/* Arrows between nodes */}
      {[133, 266, 399].map((x, i) => (
        <path key={x} d={`M${x} 68 L${x + 48} 68`} stroke="#2563eb" strokeWidth="2" markerEnd="url(#mBlue)" />
      ))}

      {/* Labels on arrows */}
      {[["Aadhaar\nSeeded?", 157], ["DBT\nEnabled?", 290], ["Account\nActive?", 420]].map(([t, x]) => (
        t.split("\n").map((l, i) => (
          <text key={l} x={x} y={52 + i * 11} fill="#0d9488" fontSize="8" fontWeight="800" textAnchor="middle">{l}</text>
        ))
      ))}
    </svg>
  );
}

// ── SVG: Aadhaar-Bank Link ────────────────────────────────────────────────────
function SvgAadhaarLink() {
  return (
    <svg viewBox="0 0 580 200" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="bankBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>

      {/* Aadhaar card */}
      <rect x="20" y="30" width="180" height="110" rx="12" fill="url(#cardBg)" />
      <rect x="30" y="42" width="160" height="90" rx="8" fill="#2563eb" opacity=".5" />
      {/* Govt logo */}
      <circle cx="60" cy="75" r="16" fill="#93c5fd" opacity=".3" />
      <circle cx="60" cy="75" r="10" fill="#dbeafe" opacity=".8" />
      {/* Text lines */}
      <rect x="85" y="62" width="85" height="7" rx="3" fill="#bfdbfe" opacity=".6" />
      <rect x="85" y="74" width="65" height="5" rx="2" fill="#93c5fd" opacity=".4" />
      <rect x="85" y="84" width="75" height="5" rx="2" fill="#93c5fd" opacity=".4" />
      {/* Aadhaar number */}
      <rect x="35" y="104" width="150" height="8" rx="3" fill="#3b82f6" opacity=".4" />
      {/* Label */}
      <text x="110" y="158" fill="#1e3a8a" fontSize="11" fontWeight="900" textAnchor="middle">AADHAAR CARD</text>
      <rect x="35" y="162" width="150" height="4" rx="2" fill="#93c5fd" opacity=".3" />

      {/* Animated dashed link */}
      <line x1="204" y1="85" x2="376" y2="85" stroke="#0d9488" strokeWidth="3" strokeDasharray="8,5"
        style={{ animation: "flowDash 1.2s linear infinite" }} />
      <polygon points="376,80 388,85 376,90" fill="#0d9488" />
      {/* SEEDED badge */}
      <rect x="248" y="65" width="84" height="22" rx="11" fill="#0d9488" />
      <text x="290" y="81" fill="white" fontSize="10" fontWeight="900" textAnchor="middle">✓ SEEDED</text>

      {/* Bank passbook */}
      <rect x="390" y="30" width="170" height="110" rx="12" fill="url(#bankBg)" />
      <rect x="400" y="42" width="150" height="90" rx="8" fill="#065f46" opacity=".5" />
      <rect x="408" y="54" width="110" height="7" rx="3" fill="#34d399" opacity=".8" />
      <rect x="408" y="66" width="80" height="5" rx="2" fill="#6ee7b7" opacity=".5" />
      <rect x="408" y="76" width="95" height="5" rx="2" fill="#6ee7b7" opacity=".5" />
      <rect x="408" y="86" width="70" height="5" rx="2" fill="#a7f3d0" opacity=".4" />
      <rect x="408" y="98" width="110" height="8" rx="3" fill="#059669" opacity=".4" />
      <text x="475" y="158" fill="#064e3b" fontSize="11" fontWeight="900" textAnchor="middle">BANK ACCOUNT</text>

      {/* PFMS success */}
      <rect x="180" y="170" width="220" height="22" rx="11" fill="#2563eb" />
      <text x="290" y="186" fill="white" fontSize="10" fontWeight="900" textAnchor="middle">✓ PFMS Payment Route Active</text>
    </svg>
  );
}

// ── SVG: DBT Flow ─────────────────────────────────────────────────────────────
function SvgDBTFlow() {
  return (
    <svg viewBox="0 0 620 180" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <defs>
        <marker id="mGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3z" fill="#16a34a" />
        </marker>
        <marker id="mTeal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3z" fill="#0d9488" />
        </marker>
      </defs>

      {/* Boxes */}
      {[
        { x: 10,  label: "Central\nGovt", sub: "Ministry", color: "#1e40af", bg: "#dbeafe" },
        { x: 155, label: "NSP /\nPFMS", sub: "Validates", color: "#7c3aed", bg: "#ede9fe" },
        { x: 300, label: "Bank\nGateway", sub: "Routes", color: "#0d9488", bg: "#ccfbf1" },
        { x: 445, label: "Your\nAccount", sub: "Receives", color: "#16a34a", bg: "#dcfce7" },
      ].map(({ x, label, sub, color, bg }) => (
        <g key={x}>
          <rect x={x} y="30" width="115" height="70" rx="12" fill={bg} stroke={color} strokeWidth="2" />
          {label.split("\n").map((l, i) => (
            <text key={i} x={x + 57} y={58 + i * 17} fill={color} fontSize="13" fontWeight="900" textAnchor="middle">{l}</text>
          ))}
          <text x={x + 57} y={110} fill="#64748b" fontSize="9" fontWeight="700" textAnchor="middle">{sub}</text>
        </g>
      ))}

      {/* Arrows */}
      {[125, 270, 415].map(x => (
        <path key={x} d={`M${x} 65 L${x + 25} 65`} stroke="#16a34a" strokeWidth="2.5" markerEnd="url(#mGreen)" />
      ))}

      {/* Money label */}
      <rect x="155" y="125" width="310" height="22" rx="11" fill="#16a34a" />
      <text x="310" y="141" fill="white" fontSize="10" fontWeight="900" textAnchor="middle">₹ Scholarship Money flows only if DBT is ON</text>

      {/* Rupee coin animation */}
      <circle cx="560" cy="65" r="28" fill="#fef9c3" stroke="#d97706" strokeWidth="2.5"
        style={{ animation: "bobUp 2s ease infinite" }} />
      <text x="560" y="70" fill="#d97706" fontSize="18" fontWeight="900" textAnchor="middle">₹</text>
      <text x="560" y="110" fill="#64748b" fontSize="9" fontWeight="700" textAnchor="middle">Your Money</text>
    </svg>
  );
}

// ── SVG: NPCI Diagram ─────────────────────────────────────────────────────────
function SvgNPCI() {
  return (
    <svg viewBox="0 0 580 160" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <rect width="580" height="160" fill="#f5f3ff" rx="12" />
      {/* NPCI center */}
      <circle cx="290" cy="80" r="40" fill="#7c3aed" />
      <text x="290" y="77" fill="white" fontSize="11" fontWeight="900" textAnchor="middle">NPCI</text>
      <text x="290" y="90" fill="#ddd6fe" fontSize="9" textAnchor="middle">Aadhaar Bridge</text>

      {/* Spokes */}
      {[
        { angle: -120, label: "Your\nAadhaar", sub: "12-digit ID", color: "#2563eb" },
        { angle: -60,  label: "Bank\nAccount", sub: "Linked a/c", color: "#0d9488" },
        { angle: 60,   label: "PFMS\nPayment", sub: "Govt sends", color: "#7c3aed" },
        { angle: 120,  label: "Your\nBank", sub: "Receives", color: "#16a34a" },
      ].map(({ angle, label, sub, color }) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 290 + 130 * Math.cos(rad);
        const cy = 80 + 90 * Math.sin(rad);
        const lx = 290 + 50 * Math.cos(rad);
        const ly = 80 + 45 * Math.sin(rad);
        return (
          <g key={angle}>
            <line x1={lx} y1={ly} x2={cx} y2={cy} stroke={color} strokeWidth="2" strokeDasharray="5,3" />
            <circle cx={cx} cy={cy} r="22" fill={color} opacity=".15" />
            <circle cx={cx} cy={cy} r="15" fill={color} />
            {label.split("\n").map((l, i) => (
              <text key={i} x={cx} y={cy + 3 + (i - 0.5) * 10} fill="white" fontSize="7" fontWeight="800" textAnchor="middle">{l}</text>
            ))}
            <text x={cx} y={cy + 26} fill="#64748b" fontSize="8" textAnchor="middle">{sub}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Small reusable components ─────────────────────────────────────────────────
function Card({ children, style = {}, color }) {
  const topBar = color ? { borderTop: `4px solid ${color}` } : {};
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "22px 24px",
      boxShadow: "0 2px 18px rgba(15,23,42,.08)", border: "1.5px solid #f1f5f9",
      ...topBar, ...style
    }}>
      {children}
    </div>
  );
}

function Eyebrow({ children, color = "#0d9488" }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color, margin: "0 0 8px" }}>
      {children}
    </p>
  );
}

function H2({ children }) {
  return <h2 style={{ fontSize: 21, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-.02em" }}>{children}</h2>;
}

function Sub({ children }) {
  return <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 20px", lineHeight: 1.75 }}>{children}</p>;
}

function CheckRow({ text, sub, color = "#16a34a", bg = "#f0fdf4", border = "#bbf7d0" }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "11px 14px", borderRadius: 11, background: bg, border: `1.5px solid ${border}`, alignItems: "flex-start" }}>
      <CheckCircle2 size={16} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: sub ? "0 0 2px" : 0 }}>{text}</p>
        {sub && <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{sub}</p>}
      </div>
    </div>
  );
}

function WarnRow({ text, sub }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "11px 14px", borderRadius: 11, background: "#fffbeb", border: "1.5px solid #fde68a", alignItems: "flex-start" }}>
      <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: "#92400e", margin: sub ? "0 0 2px" : 0 }}>{text}</p>
        {sub && <p style={{ fontSize: 12, color: "#78350f", margin: 0, lineHeight: 1.5 }}>{sub}</p>}
      </div>
    </div>
  );
}

function StepCard({ num, color, bg, border, title, body, tip }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "18px 20px", borderRadius: 14, background: bg, border: `1.5px solid ${border}`, alignItems: "flex-start", transition: "transform .2s", cursor: "default" }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ width: 38, height: 38, borderRadius: 11, background: color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "white", boxShadow: `0 4px 12px ${color}55` }}>
        {num}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: "0 0 5px" }}>{title}</p>
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>{body}</p>
        {tip && (
          <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color, background: "white", border: `1.5px solid ${border}`, padding: "4px 12px", borderRadius: 20 }}>
            <Lightbulb size={11} /> {tip}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBanner({ icon: Icon, color, bg, border, title, body }) {
  return (
    <div style={{ padding: "16px 20px", borderRadius: 14, background: bg, border: `1.5px solid ${border}`, display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "white", border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".07em" }}>{title}</p>
        <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.75, margin: 0 }}>{body}</p>
      </div>
    </div>
  );
}

// ── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "why",     label: "Why Money Fails", emoji: "❓" },
  { id: "aadhaar", label: "Aadhaar Seeding", emoji: "🪪" },
  { id: "dbt",     label: "DBT Activation",  emoji: "💸" },
  { id: "npci",    label: "NPCI Mapping",    emoji: "🔗" },
  { id: "steps",   label: "Action Steps",    emoji: "✅" },
  { id: "safety",  label: "Stay Safe",       emoji: "🛡️" },
];

export default function AwarenessGuide() {
  const [tab, setTab] = React.useState("why");

  return (
    <div className="page-stack">
      <style>{ANIM_CSS}</style>

      {/* ── HERO ── */}
      <div style={{
        borderRadius: 20, overflow: "hidden",
        background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 40%,#0891b2 100%)",
        boxShadow: "0 8px 40px rgba(15,23,42,.3)", position: "relative"
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.06) 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
        <div style={{ position: "relative", padding: "36px 36px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#93c5fd" }}>
              Awareness Guide · Module 4
            </span>
            <span style={{ background: "#0d9488", color: "white", fontSize: 10, fontWeight: 800, padding: "3px 12px", borderRadius: 20, letterSpacing: ".04em" }}>
              Student Resource
            </span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "white", margin: "0 0 12px", lineHeight: 1.2, letterSpacing: "-.03em", ...AU(0.05) }}>
            Why isn't your scholarship money<br />reaching your bank account?
          </h1>
          <p style={{ fontSize: 14.5, color: "#bfdbfe", margin: "0 0 20px", lineHeight: 1.8, maxWidth: 560, ...AU(0.12) }}>
            You applied, your college verified, NSP shows <strong style={{ color: "white" }}>Sanctioned</strong> — but the money never arrives.
            The reason is almost always one of three missing bank prerequisites that <em>no one tells students about</em>.
            This guide explains everything step-by-step in plain language.
          </p>

          {/* Stat cards */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, ...AU(0.18) }}>
            {[
              ["60%", "payment failures are bank-related", "#dbeafe"],
              ["3 Lakhs+", "students affected every year", "#e0f2fe"],
              ["₹0", "cost to fix all 3 issues", "#ccfbf1"],
              ["1–3 Days", "average fix time at bank branch", "#ede9fe"],
            ].map(([n, l, bg]) => (
              <div key={n} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 12, padding: "10px 16px", backdropFilter: "blur(8px)" }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: "white", margin: "0 0 2px" }}>{n}</p>
                <p style={{ fontSize: 11, color: "#bfdbfe", margin: 0 }}>{l}</p>
              </div>
            ))}
          </div>

          {/* Portal tags */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", ...AU(0.22) }}>
            {["NSP · scholarships.gov.in", "SSP · ssp.karnataka.gov.in", "PFMS · pfms.nic.in", "INSPIRE", "PMSS"].map(t => (
              <span key={t} style={{ fontSize: 11.5, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: "rgba(255,255,255,.12)", color: "white", border: "1px solid rgba(255,255,255,.22)" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── JOURNEY MAP ── */}
      <Card color="#2563eb">
        <Eyebrow color="#2563eb">How Scholarship Money Travels to You</Eyebrow>
        <H2>The Complete Payment Journey</H2>
        <Sub>
          Your scholarship money passes through 4 checkpoints before reaching your account.
          At each arrow, the system checks if you meet the requirement. <strong>One failure = no money.</strong>
        </Sub>
        <SvgJourney />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 18 }}>
          {[
            ["🔴 Common Failure 1", "Aadhaar not seeded to bank", "PFMS cannot find your account at all"],
            ["🟡 Common Failure 2", "DBT switch is OFF", "Bank blocks government payments silently"],
            ["🟠 Common Failure 3", "NPCI mapper outdated", "Payment goes to your old/wrong bank"],
          ].map(([badge, t, b]) => (
            <div key={t} style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#d97706", margin: "0 0 5px" }}>{badge}</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>{t}</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{b}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── TAB BAR ── */}
      <div style={{ background: "white", borderRadius: 14, padding: 6, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 12px rgba(15,23,42,.07)", display: "flex", gap: 4, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, minWidth: 90, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 800, transition: "all .18s",
            background: tab === t.id ? "linear-gradient(135deg,#2563eb,#0891b2)" : "transparent",
            color: tab === t.id ? "white" : "#64748b",
            boxShadow: tab === t.id ? "0 3px 12px rgba(37,99,235,.28)" : "none"
          }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB: WHY MONEY FAILS ══════════════ */}
      {tab === "why" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, ...AU(0) }}>
          <Card color="#d97706">
            <Eyebrow color="#d97706">Understanding the Problem</Eyebrow>
            <H2>Why do students lose scholarship money even after getting sanctioned?</H2>
            <Sub>
              NSP/SSP portal shows <strong>"Sanctioned"</strong> or <strong>"Payment Processed"</strong> — but the bank account receives nothing.
              This happens because students submit bank details without completing 3 mandatory prerequisites that the portal never explains clearly.
            </Sub>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {[
                { emoji: "🏦", title: "Aadhaar Not Seeded", body: "Your Aadhaar 12-digit number is NOT registered against your bank account. PFMS cannot route payment without this.", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                { emoji: "🔒", title: "DBT Not Enabled", body: "Direct Benefit Transfer is a switch your bank must turn ON. Without it, government payments are rejected at the bank level.", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
                { emoji: "🗺️", title: "NPCI Mapper Missing", body: "NPCI maintains a national directory linking Aadhaar to banks. If your entry is missing or wrong, payment goes to the wrong account.", color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
              ].map(({ emoji, title, body, color, bg, border }) => (
                <div key={title} style={{ borderRadius: 14, padding: "18px 16px", background: bg, border: `1.5px solid ${border}` }}>
                  <p style={{ fontSize: 28, margin: "0 0 8px" }}>{emoji}</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>{title}</p>
                  <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.7, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card color="#16a34a">
              <Eyebrow color="#16a34a">What "Sanctioned" actually means</Eyebrow>
              <H2 style={{ fontSize: 17 }}>Portal says Sanctioned ✓</H2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {[
                  "College Nodal Officer verified your documents",
                  "District authority approved your application",
                  "State/Ministry selected you for the scholarship",
                  "Amount has been released from government funds",
                ].map(t => <CheckRow key={t} text={t} />)}
              </div>
              <InfoBanner icon={Info} color="#16a34a" bg="#f0fdf4" border="#bbf7d0"
                title="But this does NOT mean"
                body="Money has reached your bank. Sanctioned = approved for payment. Actual credit happens only after your bank passes all 3 checks." />
            </Card>

            <Card color="#d97706">
              <Eyebrow color="#d97706">What "Bank Validation Failed" means</Eyebrow>
              <H2 style={{ fontSize: 17 }}>Portal shows failed ✗</H2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {[
                  ["Aadhaar not linked to this bank account", "PFMS searched NPCI directory — not found"],
                  ["DBT flag is OFF on your account", "Bank rejected the incoming government transfer"],
                  ["Account number / IFSC mismatch", "You entered wrong bank details on the portal"],
                  ["Account is dormant (no activity 12+ months)", "Bank freezes inactive accounts from receiving credits"],
                  ["Wrong bank registered on NPCI", "You changed banks but didn't update NPCI mapper"],
                ].map(([t, s]) => <WarnRow key={t} text={t} sub={s} />)}
              </div>
            </Card>
          </div>

          <Card>
            <Eyebrow>Real Impact — What students lose</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 8 }}>
              {[
                ["📅", "Miss the academic year", "Money returned after 6+ months delay"],
                ["📋", "Re-apply next cycle", "Lose one full year of scholarship benefit"],
                ["🏫", "College blocks registration", "No payment = college can withhold enrollment"],
                ["😓", "Stress & confusion", "No one explains why payment failed"],
              ].map(([e, t, b]) => (
                <div key={t} style={{ textAlign: "center", padding: "16px 12px", borderRadius: 12, background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
                  <p style={{ fontSize: 28, margin: "0 0 6px" }}>{e}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>{t}</p>
                  <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{b}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════ TAB: AADHAAR SEEDING ══════════════ */}
      {tab === "aadhaar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, ...AU(0) }}>
          <Card color="#2563eb">
            <Eyebrow color="#2563eb">Step 1 of 3 — Most Important</Eyebrow>
            <H2>What is Aadhaar Seeding?</H2>
            <Sub>
              Aadhaar seeding (also called Aadhaar–bank linking) means telling your bank: <em>"My Aadhaar number is XXXX XXXX XXXX and it belongs to this bank account."</em>
              The bank then registers this mapping in the NPCI national directory.
              When PFMS sends your scholarship, it searches for your Aadhaar in this directory and routes money to the linked account.
              <strong> Without seeding, PFMS cannot find your account — payment fails silently.</strong>
            </Sub>
            <SvgAadhaarLink />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 16, padding: "20px" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#16a34a", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 7 }}>
                <CheckCircle2 size={15} /> IF AADHAAR IS SEEDED
              </p>
              {[
                ["Payment routes automatically", "PFMS finds your account in NPCI directory within seconds"],
                ["Money arrives in 7–30 working days", "After Sanctioned status appears on portal"],
                ["You get bank SMS confirmation", "Credit alert from your bank when money arrives"],
                ["No manual follow-up needed", "The entire process is automated once seeded"],
              ].map(([t, s]) => <CheckRow key={t} text={t} sub={s} color="#16a34a" bg="white" border="#bbf7d0" />).reduce((a, e, i) => [...a, i > 0 ? <div key={i} style={{ height: 8 }} /> : null, e], [])}
            </div>

            <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 16, padding: "20px" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#d97706", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 7 }}>
                <AlertTriangle size={15} /> IF AADHAAR IS NOT SEEDED
              </p>
              {[
                ["PFMS cannot route the payment", "It searches NPCI — finds nothing — rejects transfer"],
                ["Portal may show 'Bank Validation Failed'", "You see an error but don't know what it means"],
                ["Money returns to government", "Returned amount takes 3–6 months to be re-processed"],
                ["You may lose that scholarship cycle", "Deadlines pass while the issue goes unresolved"],
              ].map(([t, s]) => <WarnRow key={t} text={t} sub={s} />).reduce((a, e, i) => [...a, i > 0 ? <div key={i} style={{ height: 8 }} /> : null, e], [])}
            </div>
          </div>

          <Card color="#0d9488">
            <Eyebrow color="#0d9488">How to Link Aadhaar to Your Bank — 4 Methods</Eyebrow>
            <H2>Choose the easiest method for you</H2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
              <StepCard num="1" color="#2563eb" bg="#eff6ff" border="#bfdbfe"
                title="Visit Bank Branch (Most Reliable — Recommended)"
                body="Carry: Original Aadhaar card + Bank passbook/account details. Ask at counter: 'I want to link my Aadhaar to my account.' Fill the Aadhaar seeding request form. Bank submits to NPCI within 24–48 hours. You get SMS confirmation."
                tip="Best for first-time linking or if other methods fail" />
              <StepCard num="2" color="#7c3aed" bg="#f5f3ff" border="#ddd6fe"
                title="Bank's Mobile App or Internet Banking"
                body="Login to your bank's app. Go to Services / Profile / My Account. Look for 'Link Aadhaar' or 'Aadhaar Seeding'. Enter your 12-digit Aadhaar number. OTP comes to your Aadhaar-registered mobile. Confirm. Done instantly."
                tip="Fastest method — no branch visit needed" />
              <StepCard num="3" color="#0d9488" bg="#f0fdfa" border="#99f6e4"
                title="Bank ATM (select banks only)"
                body="Insert your debit card at ATM. Choose 'More Services' or 'Registration'. Select 'Aadhaar Registration / Seeding'. Enter 12-digit Aadhaar and confirm. Available at SBI, BOB, PNB ATMs."
                tip="Check if your bank supports Aadhaar seeding at ATM" />
              <StepCard num="4" color="#d97706" bg="#fffbeb" border="#fde68a"
                title="UIDAI / India Post Payment Bank (alternative)"
                body="If your bank is uncooperative, visit India Post Payment Bank or CSC (Common Service Centre) near you. They can process Aadhaar-bank seeding using biometric verification. Carry Aadhaar + passbook."
                tip="Use when your bank's systems are down or uncooperative" />
            </div>
          </Card>

          <Card>
            <Eyebrow color="#0d9488">How to Verify Aadhaar Seeding is Done</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
              <div style={{ background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: 12, padding: "16px" }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0d9488", margin: "0 0 8px" }}>Method 1 — USSD Code</p>
                <p style={{ fontSize: 13, color: "#134e4a", lineHeight: 1.7, margin: "0 0 8px" }}>
                  Dial <strong>*99*99*1#</strong> on your Aadhaar-registered mobile number. Enter your 12-digit Aadhaar. The screen shows which bank is currently linked.
                </p>
                <div style={{ background: "#0d9488", borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "white", margin: 0 }}>Dial: *99*99*1#</p>
                </div>
              </div>
              <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "16px" }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#2563eb", margin: "0 0 8px" }}>Method 2 — PFMS Portal</p>
                <p style={{ fontSize: 13, color: "#1e3a8a", lineHeight: 1.7, margin: "0 0 8px" }}>
                  Go to <strong>pfms.nic.in</strong>. Click "Know Your Payment". Enter Aadhaar number. It shows the bank where your Aadhaar is registered on NPCI.
                </p>
                <div style={{ background: "#2563eb", borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "white", margin: 0 }}>pfms.nic.in</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════ TAB: DBT ══════════════ */}
      {tab === "dbt" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, ...AU(0) }}>
          <Card color="#16a34a">
            <Eyebrow color="#16a34a">Step 2 of 3 — Often Missed</Eyebrow>
            <H2>What is DBT — Direct Benefit Transfer?</H2>
            <Sub>
              DBT is a government programme that transfers welfare money (scholarship, pension, LPG subsidy, MGNREGA wages) directly into citizens' bank accounts using Aadhaar as the identifier.
              It eliminates middlemen and leakage. <strong>But it only works if your bank account has the DBT flag activated.</strong>
              This is a separate step from Aadhaar seeding — many students seed Aadhaar but forget to enable DBT.
            </Sub>
            <SvgDBTFlow />
          </Card>

          <InfoBanner icon={AlertTriangle} color="#d97706" bg="#fffbeb" border="#fde68a"
            title="Most Common Confusion"
            body={`"I already linked Aadhaar to my bank — why is payment still failing?" — Aadhaar seeding and DBT activation are TWO different things. Seeding tells PFMS WHERE your account is. DBT activation tells the bank to ACCEPT government payments. Both must be done.`}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <Eyebrow color="#16a34a">What DBT Enables</Eyebrow>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Scholarship payments (NSP, SSP, INSPIRE)", "Direct from Ministry to your account"],
                  ["LPG subsidy", "Cooking gas subsidy without middleman"],
                  ["PM-KISAN, MGNREGA wages", "Farmer & labour scheme payments"],
                  ["Pension & social welfare", "State government welfare schemes"],
                ].map(([t, s]) => <CheckRow key={t} text={t} sub={s} />)}
              </div>
            </Card>
            <Card>
              <Eyebrow color="#d97706">Full Prerequisite Checklist</Eyebrow>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Aadhaar seeded to bank account", "Must be done first"],
                  ["DBT switch ON at your bank", "Ask bank explicitly to enable it"],
                  ["NPCI Aadhaar mapper registered", "Bank must submit to NPCI"],
                  ["Bank account active", "At least 1 transaction in last 12 months"],
                  ["Correct IFSC entered on portal", "Match exactly with passbook"],
                  ["Mobile number linked to Aadhaar", "Needed for OTP-based verification"],
                ].map(([t, s]) => <CheckRow key={t} text={t} sub={s} />)}
              </div>
            </Card>
          </div>

          <Card color="#7c3aed">
            <Eyebrow color="#7c3aed">How to Enable DBT on Your Account</Eyebrow>
            <H2>3 Ways to activate DBT</H2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
              <StepCard num="1" color="#7c3aed" bg="#f5f3ff" border="#ddd6fe"
                title="Visit your Bank Branch (Always Works)"
                body="Tell the bank officer: 'Please activate DBT and enable Aadhaar Payment Bridge on my account.' They will fill a form. No charge applies. Takes 1–2 working days. Get written confirmation."
                tip="Say exactly: 'Enable DBT on my savings account'" />
              <StepCard num="2" color="#2563eb" bg="#eff6ff" border="#bfdbfe"
                title="Bank Mobile App — DBT Enrollment"
                body="Some banks (SBI YONO, Bank of Baroda) allow DBT enrollment via app. Look under Account Services > DBT Registration. If option not available, go to branch."
                tip="Check under 'Services' or 'Account Management' in your app" />
              <StepCard num="3" color="#0d9488" bg="#f0fdfa" border="#99f6e4"
                title="Call Bank's Helpline"
                body="Call your bank's customer care and say 'I want to enable DBT on my account.' They will guide you or raise a request. You may need to visit branch for biometric confirmation."
                tip="SBI: 1800-11-2211 | BOB: 1800-5700 | Canara: 1800-103-0018" />
            </div>
          </Card>

          <Card>
            <Eyebrow>Types of bank accounts and DBT compatibility</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 8 }}>
              {[
                ["✅ Savings Account", "#16a34a", "#f0fdf4", "#bbf7d0", "Best for DBT. Activate DBT explicitly at branch. Most scholarship portals require this."],
                ["⚠️ Jan Dhan Account", "#d97706", "#fffbeb", "#fde68a", "DBT is pre-enabled in Jan Dhan accounts. But confirm Aadhaar seeding is done. May have withdrawal limits."],
                ["❌ Current / Business Account", "#dc2626", "#fef2f2", "#fecdd3", "Government scholarships do NOT support current accounts. Use only personal savings account."],
              ].map(([t, c, bg, border, b]) => (
                <div key={t} style={{ borderRadius: 12, padding: "16px", background: bg, border: `1.5px solid ${border}` }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>{t}</p>
                  <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6, margin: 0 }}>{b}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════ TAB: NPCI ══════════════ */}
      {tab === "npci" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, ...AU(0) }}>
          <Card color="#7c3aed">
            <Eyebrow color="#7c3aed">Step 3 of 3 — Technical but Critical</Eyebrow>
            <H2>What is NPCI Aadhaar Payment Bridge?</H2>
            <Sub>
              NPCI (National Payments Corporation of India) runs a national database called the <strong>Aadhaar Payment Bridge System (APBS)</strong>.
              This is a centralized directory that maps every Indian citizen's Aadhaar number to one bank account.
              When PFMS sends scholarship money using your Aadhaar, it queries NPCI's APBS to find which bank account to credit.
              <strong> If your Aadhaar is not in this directory, or mapped to a wrong/old bank, payment fails.</strong>
            </Sub>
            <SvgNPCI />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <InfoBanner icon={Info} color="#7c3aed" bg="#f5f3ff" border="#ddd6fe"
              title="One Aadhaar = One Bank"
              body="NPCI allows only ONE primary bank account per Aadhaar for DBT payments. If you have accounts in multiple banks, only the bank that most recently registered with NPCI will receive scholarship money. This causes confusion when students change banks." />
            <InfoBanner icon={AlertTriangle} color="#d97706" bg="#fffbeb" border="#fde68a"
              title="Old Bank Still Mapped?"
              body="If you had a bank account in your hometown (say, SBI) and now use a college-city account (say, Canara), but never updated NPCI — your scholarship money goes to your old SBI account. Many students don't know this." />
          </div>

          <Card color="#0d9488">
            <Eyebrow color="#0d9488">How to Check Your NPCI Mapping</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
              <StepCard num="1" color="#2563eb" bg="#eff6ff" border="#bfdbfe"
                title="Check on PFMS Portal (pfms.nic.in)"
                body="Go to pfms.nic.in. Click 'Know Your Payment'. Select 'Beneficiary Status'. Choose Aadhaar as search type. Enter your Aadhaar number. The result shows which bank is currently registered on NPCI. If it shows 'Not Found' — your bank has not submitted your Aadhaar to NPCI yet."
                tip="Visit pfms.nic.in — free, instant check" />
              <StepCard num="2" color="#7c3aed" bg="#f5f3ff" border="#ddd6fe"
                title="Check via USSD — *99*99*1#"
                body="Dial *99*99*1# on your Aadhaar-registered mobile number. Press 1 for Aadhaar Mapper Status. Enter your 12-digit Aadhaar. The screen shows the bank name where your Aadhaar is mapped. This works even on basic phones without internet."
                tip="Works on any phone — no smartphone needed" />
              <StepCard num="3" color="#0d9488" bg="#f0fdfa" border="#99f6e4"
                title="Ask your Bank (Physical / App)"
                body="Ask your bank officer: 'Is my Aadhaar registered on NPCI Aadhaar Payment Bridge?' or check the Aadhaar seeding status in your bank app. If the app shows Aadhaar linked — NPCI registration is usually done automatically by the bank."
                tip="Most banks do NPCI registration automatically after seeding" />
            </div>
          </Card>

          <Card color="#16a34a">
            <Eyebrow color="#16a34a">How to Fix NPCI Mapper Issues</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <StepCard num="A" color="#16a34a" bg="#f0fdf4" border="#bbf7d0"
                title="Update mapping to new bank"
                body="If your old bank is mapped but you want your new bank to receive payments: Visit your NEW bank branch with Aadhaar card + new passbook. Say: 'Please register my Aadhaar on NPCI Aadhaar Payment Bridge for DBT.' Bank submits to NPCI. Takes 1–3 working days. The old bank gets automatically de-mapped." />
              <StepCard num="B" color="#2563eb" bg="#eff6ff" border="#bfdbfe"
                title="De-register from old bank (if needed)"
                body="If your old bank is creating problems, visit the old bank and ask them to 'De-seed / de-register my Aadhaar from your bank's NPCI mapper.' Then immediately go to your new bank and register freshly. Never leave a gap — always have one active mapping." />
            </div>
          </Card>

          <div style={{ background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0d9488", margin: "0 0 10px" }}>Processing Timeline After NPCI Registration</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                ["Day 1", "Submit request at bank", "#2563eb", "#eff6ff"],
                ["Day 1–3", "Bank submits to NPCI", "#7c3aed", "#f5f3ff"],
                ["Day 3–5", "NPCI updates directory", "#0d9488", "#f0fdfa"],
                ["Day 5–30", "PFMS retries payment", "#16a34a", "#f0fdf4"],
              ].map(([day, act, c, bg]) => (
                <div key={day} style={{ background: bg, border: `1.5px solid ${c}22`, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, fontWeight: 900, color: c, margin: "0 0 4px" }}>{day}</p>
                  <p style={{ fontSize: 11.5, color: "#475569", margin: 0, lineHeight: 1.5 }}>{act}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: ACTION STEPS ══════════════ */}
      {tab === "steps" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, ...AU(0) }}>
          <Card color="#2563eb">
            <Eyebrow color="#2563eb">Complete Action Plan — Do These in Order</Eyebrow>
            <H2>Your Scholarship Payment Checklist</H2>
            <Sub>Complete all steps before or immediately after submitting your scholarship application. This prevents 95% of payment failures.</Sub>
          </Card>

          {[
            {
              phase: "Before Applying", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
              steps: [
                ["Open a personal savings account", "Use your own name — not parents'. Account must be in your name to receive scholarship money."],
                ["Link Aadhaar to this bank account", "Visit bank branch with Aadhaar + passbook. Fill seeding form. Get acknowledgment."],
                ["Enable DBT on this account", "Tell bank officer explicitly. It's free. Takes 1–2 days."],
                ["Verify NPCI mapper via *99*99*1#", "Confirm your Aadhaar is mapped to this specific bank account."],
                ["Do at least 1 transaction in the account", "Deposit or withdraw at least ₹1. This activates the account and prevents dormancy."],
              ]
            },
            {
              phase: "While Filling Application", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",
              steps: [
                ["Enter bank details exactly as on passbook", "Account number, IFSC, bank name — match character by character."],
                ["Enter account holder name matching Aadhaar", "Spelling must match. Even 'Shalini' vs 'Shalani' causes rejection."],
                ["Double-check IFSC code", "11-character code starting with bank abbreviation. Find on passbook or cheque leaf."],
                ["Save and screenshot the bank details page", "Keep proof of what you submitted in case of disputes later."],
              ]
            },
            {
              phase: "After Applying — Monitor Status", color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4",
              steps: [
                ["Check portal every 2 weeks", "NSP/SSP portal shows stage-by-stage status. Track it actively."],
                ["If Institute Verification Pending over 2 weeks", "Visit your college's scholarship/nodal officer. Give them your application number."],
                ["If Defective — fix within deadline", "Portal sends a reason. Upload the correct document immediately."],
                ["If Bank Validation Failed", "Re-verify Aadhaar seeding + DBT + NPCI mapper. Visit bank with all documents."],
                ["If Sanctioned but no credit for 30+ days", "Call NSP helpdesk 0120-6619540. Carry application ID and bank details."],
              ]
            },
          ].map(({ phase, color, bg, border, steps }) => (
            <Card key={phase} style={{ borderTop: `4px solid ${color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Star size={16} color={color} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0 }}>{phase}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {steps.map(([t, s], i) => (
                  <div key={t} style={{ display: "flex", gap: 14, padding: "12px 14px", borderRadius: 11, background: bg, border: `1.5px solid ${border}`, alignItems: "flex-start" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "white" }}>{i + 1}</div>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>{t}</p>
                      <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <Card style={{ background: "linear-gradient(135deg,#f0fdf4,#eff6ff)", border: "1.5px solid #bfdbfe" }}>
            <Eyebrow color="#16a34a">Quick Reference Card — Print & Keep</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 8 }}>
              {[
                ["🪪", "1. Aadhaar Seeding", "Link Aadhaar to bank", "#2563eb", "#eff6ff", "#bfdbfe"],
                ["💸", "2. DBT Enable", "Ask bank to activate", "#7c3aed", "#f5f3ff", "#ddd6fe"],
                ["🗺️", "3. NPCI Mapping", "Check *99*99*1#", "#0d9488", "#f0fdfa", "#99f6e4"],
                ["✅", "4. Active Account", "1 txn in 6 months", "#16a34a", "#f0fdf4", "#bbf7d0"],
              ].map(([e, t, b, c, bg, border]) => (
                <div key={t} style={{ borderRadius: 12, padding: "16px 12px", background: bg, border: `1.5px solid ${border}`, textAlign: "center" }}>
                  <p style={{ fontSize: 26, margin: "0 0 6px" }}>{e}</p>
                  <p style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>{t}</p>
                  <p style={{ fontSize: 11.5, color: "#475569", margin: 0 }}>{b}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════ TAB: SAFETY ══════════════ */}
      {tab === "safety" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, ...AU(0) }}>
          <Card color="#7c3aed">
            <Eyebrow color="#7c3aed">Scholarship Safety Guide</Eyebrow>
            <H2>Protect Yourself from Fraud</H2>
            <Sub>
              Every year, thousands of students lose money to scholarship fraudsters who call claiming to "process" or "release" scholarship payments.
              The government NEVER calls students for OTP, bank details, or fees.
              Learn to recognize and report fraud.
            </Sub>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { e: "🚫", t: "Never share OTP to anyone", b: "OTP (One-Time Password) is your personal security code. Government officials never ask for OTP on a phone call. If someone asks — hang up immediately.", bad: true },
                { e: "🚫", t: "Never pay 'processing fee'", b: "NSP/SSP scholarship applications are 100% FREE. No government official, college, agent, or website can charge you any fee to process your scholarship.", bad: true },
                { e: "🚫", t: "Never share full Aadhaar number", b: "Share only the last 4 digits for verification. Your full 12-digit Aadhaar gives fraudsters access to your Aadhaar-linked bank account.", bad: true },
                { e: "🚫", t: "Beware of fake portals", b: "Fraudsters create websites like 'nsp-scholarship.in' or 'scholarships-india.com'. Always type the official URL yourself. Never click email/WhatsApp links.", bad: true },
                { e: "✅", t: "Only use official portals", b: "NSP: scholarships.gov.in | SSP Karnataka: ssp.karnataka.gov.in | PFMS: pfms.nic.in | UIDAI: uidai.gov.in", bad: false },
                { e: "✅", t: "Track status yourself", b: "Check your scholarship status directly on the official portal using your application ID. Don't trust WhatsApp forwards or agents claiming to know your status.", bad: false },
                { e: "✅", t: "Save all acknowledgments", b: "Take screenshots of: submission confirmation, application ID, all uploaded documents, and any official SMSes. Store them in a safe folder.", bad: false },
                { e: "✅", t: "Report fraud immediately", b: "Call Cyber Crime Helpline 1930. File complaint at cybercrime.gov.in. Contact NSP Helpdesk 0120-6619540. Report to college scholarship cell.", bad: false },
              ].map(({ e, t, b, bad }) => (
                <div key={t} style={{
                  borderRadius: 14, padding: "16px",
                  background: bad ? "#fffbeb" : "#f0fdf4",
                  border: `1.5px solid ${bad ? "#fde68a" : "#bbf7d0"}`
                }}>
                  <p style={{ fontSize: 24, margin: "0 0 6px" }}>{e}</p>
                  <p style={{ fontSize: 13.5, fontWeight: 800, color: bad ? "#92400e" : "#16a34a", margin: "0 0 5px" }}>{t}</p>
                  <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, margin: 0 }}>{b}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card color="#2563eb">
            <Eyebrow color="#2563eb">Official Helplines — Call When in Doubt</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {[
                ["🏛️", "NSP Helpdesk", "0120-6619540", "Mon–Sat, 10am–6pm", "NSP scholarship queries, status issues", "#2563eb", "#eff6ff", "#bfdbfe"],
                ["💰", "PFMS Helpdesk", "1800-118-111", "Toll Free, 24x7", "Payment failures, bank validation failed", "#16a34a", "#f0fdf4", "#bbf7d0"],
                ["🏢", "SSP Karnataka", "080-22032228", "Mon–Sat, 10am–5pm", "State scholarship portal issues", "#7c3aed", "#f5f3ff", "#ddd6fe"],
                ["🪪", "UIDAI Aadhaar", "1947", "Toll Free, 24x7", "Aadhaar seeding, update, correction", "#0d9488", "#f0fdfa", "#99f6e4"],
                ["🚨", "Cyber Crime", "1930", "24x7 Emergency", "Scholarship fraud, online cheating", "#d97706", "#fffbeb", "#fde68a"],
              ].map(([emoji, name, num, hours, desc, c, bg, border]) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 13, background: bg, border: `1.5px solid ${border}` }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 2px" }}>{name}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{hours} · {desc}</p>
                  </div>
                  <a href={`tel:${num}`} style={{
                    fontSize: 16, fontWeight: 900, color: c, textDecoration: "none",
                    background: "white", border: `1.5px solid ${border}`, padding: "8px 18px",
                    borderRadius: 24, display: "flex", alignItems: "center", gap: 6,
                    flexShrink: 0, boxShadow: "0 2px 8px rgba(15,23,42,.06)"
                  }}>
                    <Phone size={14} /> {num}
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
