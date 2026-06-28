import React from "react";
import { apiRequest } from "../services/api.js";
import {
  ShieldCheck, User, Banknote, FileText, GraduationCap, LogIn,
  CheckCircle2, RefreshCw, Lock, Info
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const CAT = {
  auth:         { icon: LogIn,          color: "#64748b", bg: "#f8fafc", border: "#e2e8f0",  label: "Account" },
  profile:      { icon: User,           color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",  label: "Profile" },
  bank:         { icon: Banknote,       color: "#d97706", bg: "#fffbeb", border: "#fde68a",  label: "Bank & DBT" },
  document:     { icon: FileText,       color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",  label: "Document" },
  scholarship:  { icon: GraduationCap,  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",  label: "Scholarship" },
  system:       { icon: Info,           color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4",  label: "System" },
};

const ACTION_ICON = {
  aadhaar_linked:      "🔗",
  dbt_enabled:         "✅",
  npci_mapped:         "🗺️",
  bank_details_updated:"🏦",
  profile_updated:     "✏️",
  document_uploaded:   "📄",
  document_deleted:    "🗑️",
  scholarship_sanctioned: "🎉",
  scholarship_paid:    "💰",
  scholarship_defective: "⚠️",
  scholarship_applied: "📝",
  register:            "🆕",
  login:               "🔑",
};

function formatDate(iso) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

// Group logs by date label
function groupByDate(logs) {
  const groups = {};
  for (const log of logs) {
    const d = new Date(log.createdAt);
    const label = new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(d);
    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
  }
  return groups;
}

// ── Single timeline entry ─────────────────────────────────────────────────────
function Entry({ log, isLast }) {
  const cat = CAT[log.category] || CAT.system;
  const Icon = cat.icon;
  const emoji = ACTION_ICON[log.action] || "📌";

  return (
    <div style={{ display: "flex", gap: 16, position: "relative" }}>
      {/* Vertical line */}
      {!isLast && (
        <div style={{ position: "absolute", left: 19, top: 44, bottom: -24, width: 2, background: "linear-gradient(to bottom, #e2e8f0, transparent)", zIndex: 0 }} />
      )}

      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: cat.bg, border: `2px solid ${cat.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, fontSize: 16 }}>
        {emoji}
      </div>

      {/* Content */}
      <div style={{ flex: 1, background: "white", border: `1.5px solid ${cat.border}`, borderRadius: 13, padding: "13px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>{log.title}</p>
            {log.detail && <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.6 }}>{log.detail}</p>}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg, padding: "3px 10px", borderRadius: 20, border: `1px solid ${cat.border}`, display: "block", marginBottom: 4 }}>
              {cat.label}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(log.createdAt)}</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: "6px 0 0", fontFamily: "monospace" }}>
          {formatDate(log.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuditTrail() {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");
  const [error, setError] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await apiRequest("/audit");
      setLogs(res.logs || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? logs : logs.filter(l => l.category === filter);
  const grouped  = groupByDate(filtered);

  const counts = {};
  for (const cat of Object.keys(CAT)) {
    counts[cat] = logs.filter(l => l.category === cat).length;
  }

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a,#0891b2)", borderRadius: 18, padding: "28px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} color="white" />
            </div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#93c5fd", margin: 0 }}>Blockchain-style · Immutable Record</p>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-.02em" }}>Activity Audit Trail</h2>
          <p style={{ fontSize: 13.5, color: "#bfdbfe", margin: "0 0 20px", lineHeight: 1.7, maxWidth: 520 }}>
            Every action on your account is permanently logged — profile updates, bank changes, document uploads, scholarship events. Records cannot be edited or deleted.
          </p>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              ["Total Events", logs.length, "#dbeafe"],
              ["Bank Changes", counts.bank || 0, "#fde68a"],
              ["Documents", counts.document || 0, "#ddd6fe"],
              ["Scholarship", counts.scholarship || 0, "#bbf7d0"],
            ].map(([label, val, bg]) => (
              <div key={label} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 10, padding: "10px 18px", backdropFilter: "blur(6px)" }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: "white", margin: "0 0 2px" }}>{val}</p>
                <p style={{ fontSize: 11, color: "#bfdbfe", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Immutability banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "12px 18px" }}>
        <Lock size={15} color="#16a34a" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: "#166534", margin: 0, fontWeight: 600 }}>
          This trail is <strong>append-only</strong> — like a blockchain ledger. Once an event is recorded, it cannot be modified or removed. This ensures complete transparency of all account activity.
        </p>
        <button onClick={load} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "white", border: "1.5px solid #bbf7d0", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#16a34a", cursor: "pointer", flexShrink: 0 }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[{ key: "all", label: `All (${logs.length})` }, ...Object.entries(CAT).map(([k, v]) => ({ key: k, label: `${v.label} (${counts[k] || 0})` }))].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "1.5px solid #e2e8f0", fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "all .15s",
              background: filter === t.key ? "linear-gradient(135deg,#2563eb,#0891b2)" : "white",
              color: filter === t.key ? "white" : "#64748b"
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1.5px solid #fecdd3", borderRadius: 12, padding: "12px 16px", color: "#dc2626", fontSize: 13 }}>{error}</div>}

      {/* Timeline */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>Loading audit trail…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "white", borderRadius: 16, padding: "48px 24px", textAlign: "center", border: "1.5px solid #e2e8f0" }}>
          <CheckCircle2 size={36} color="#16a34a" style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>No activity yet</p>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Events will appear here as you update your profile, upload documents, and complete bank setup.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, entries]) => (
          <div key={date}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 14px" }}>
              <div style={{ height: 1, flex: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", whiteSpace: "nowrap" }}>{date}</span>
              <div style={{ height: 1, flex: 1, background: "#e2e8f0" }} />
            </div>
            <div style={{ paddingLeft: 4 }}>
              {entries.map((log, i) => (
                <Entry key={log._id || log.id || i} log={log} isLast={i === entries.length - 1 && Object.keys(grouped).at(-1) === date} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
