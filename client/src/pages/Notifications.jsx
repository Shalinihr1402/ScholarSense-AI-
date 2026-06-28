import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, RefreshCw, ArrowRight, Trash2,
  Banknote, FileText, GraduationCap, User, AlertTriangle, Info, CheckCircle2
} from "lucide-react";
import { notificationApi } from "../services/api.js";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  bank:         { icon: Banknote,      color: "#d97706", bg: "#fffbeb", border: "#fde68a",  label: "Bank & DBT" },
  document:     { icon: FileText,      color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",  label: "Documents" },
  scholarship:  { icon: GraduationCap, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",  label: "Scholarships" },
  profile:      { icon: User,          color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",  label: "Profile" },
  general:      { icon: Bell,          color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4",  label: "General" },
  system:       { icon: Info,          color: "#64748b", bg: "#f8fafc", border: "#e2e8f0",  label: "System" },
};

const PRIORITY_COLOR = { critical: "#dc2626", high: "#d97706", medium: "#2563eb", low: "#16a34a" };
const PRIORITY_BG    = { critical: "#fef2f2", high: "#fffbeb", medium: "#eff6ff", low: "#f0fdf4" };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Card({ children, style = {}, color }) {
  return (
    <div style={{
      background: "white", borderRadius: 14, padding: "18px 20px",
      boxShadow: "0 2px 14px rgba(15,23,42,.07)", border: "1.5px solid #f1f5f9",
      borderTop: color ? `4px solid ${color}` : undefined, ...style
    }}>
      {children}
    </div>
  );
}

// ── Notification item ─────────────────────────────────────────────────────────
function NotifItem({ n, onRead, onDelete, navigate }) {
  const cat = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.general;
  const Icon = cat.icon;
  const isUnread = !n.isRead;

  return (
    <div style={{
      display: "flex", gap: 14, alignItems: "flex-start",
      padding: "16px 18px", borderRadius: 13,
      background: isUnread ? PRIORITY_BG[n.priority] || "#f8fafc" : "white",
      border: `1.5px solid ${isUnread ? (PRIORITY_COLOR[n.priority] + "33") : "#e2e8f0"}`,
      transition: "all .18s", position: "relative"
    }}>
      {/* Unread dot */}
      {isUnread && (
        <div style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLOR[n.priority] || "#2563eb" }} />
      )}

      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: 11, background: cat.bg, border: `1.5px solid ${cat.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color={cat.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>{n.title}</p>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
            background: PRIORITY_COLOR[n.priority] || "#2563eb", color: "white",
            textTransform: "uppercase", letterSpacing: ".06em"
          }}>{n.priority}</span>
        </div>

        <p style={{ fontSize: 13, color: "#475569", margin: "0 0 8px", lineHeight: 1.65 }}>{n.message}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg, padding: "3px 10px", borderRadius: 20, border: `1px solid ${cat.border}` }}>
            {cat.label}
          </span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(n.createdAt)}</span>
          {n.emailSent && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>✉ Email sent</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {n.actionUrl && (
          <button onClick={() => navigate(n.actionUrl)}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", background: "linear-gradient(135deg,#2563eb,#0891b2)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Fix it <ArrowRight size={11} />
          </button>
        )}
        {isUnread && (
          <button onClick={() => onRead(n._id || n.id)}
            style={{ padding: "5px 12px", background: "white", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Mark read
          </button>
        )}
        <button onClick={() => onDelete(n._id || n.id)}
          title="Delete notification"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 12px", background: "white", color: "#ef4444", border: "1.5px solid #fecdd3", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "white"; }}>
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const CATEGORY_ORDER = ["bank", "scholarship", "document", "profile", "general", "system"];

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  async function load() {
    try {
      const res = await notificationApi.list();
      setNotifications(res.notifications || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await notificationApi.refresh();
      setNotifications(res.notifications || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function markRead(id) {
    await notificationApi.markRead(id);
    setNotifications(n => n.map(x => (x._id || x.id) === id ? { ...x, isRead: true } : x));
  }

  async function markAllRead() {
    await notificationApi.markAllRead();
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  }

  async function deleteOne(id) {
    await notificationApi.delete(id);
    setNotifications(n => n.filter(x => (x._id || x.id) !== id));
  }

  async function deleteAll() {
    if (!window.confirm("Delete all notifications? This cannot be undone.")) return;
    await notificationApi.deleteAll();
    setNotifications([]);
  }

  React.useEffect(() => { load(); }, []);

  const unread    = notifications.filter(n => !n.isRead).length;
  const critical  = notifications.filter(n => n.priority === "critical" && !n.isRead).length;
  const filtered  = filter === "all" ? notifications : filter === "unread" ? notifications.filter(n => !n.isRead) : notifications.filter(n => n.category === filter);

  // Group by category
  const grouped = {};
  for (const cat of CATEGORY_ORDER) {
    const items = filtered.filter(n => (n.category || "general") === cat);
    if (items.length) grouped[cat] = items;
  }

  return (
    <div className="page-stack">
      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius: 18, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#93c5fd", margin: "0 0 6px" }}>Smart Alerts</p>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "white", margin: "0 0 4px", letterSpacing: "-.02em" }}>Scholarship Notifications</h2>
          <p style={{ fontSize: 13, color: "#bfdbfe", margin: 0 }}>Alerts based on your profile — documents, bank status, and scholarship deadlines</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={refresh} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            {refreshing ? "Checking…" : "Check Now"}
          </button>
          {unread > 0 && (
            <button onClick={markAllRead}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: "white", border: "none", borderRadius: 10, color: "#0f172a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={deleteAll}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.35)", borderRadius: 10, color: "#fca5a5", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Alerts", value: notifications.length, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: Bell },
          { label: "Unread", value: unread, color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: Bell },
          { label: "Critical", value: critical, color: "#dc2626", bg: "#fef2f2", border: "#fecdd3", icon: AlertTriangle },
          { label: "Bank Alerts", value: notifications.filter(n => n.category === "bank").length, color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", icon: Banknote },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon size={14} color={color} />
              <p style={{ fontSize: 11.5, fontWeight: 700, color, margin: 0, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</p>
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* How it works banner */}
      <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: "#166534", margin: 0, lineHeight: 1.6 }}>
          <strong>How alerts work:</strong> Click <strong>"Check Now"</strong> to scan your profile for bank issues, expiring documents, and scholarship openings. High/Critical alerts are automatically emailed to <strong>your registered email</strong>.
        </p>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { key: "all",         label: "All" },
          { key: "unread",      label: `Unread (${unread})` },
          { key: "bank",        label: "Bank & DBT" },
          { key: "scholarship", label: "Scholarships" },
          { key: "document",    label: "Documents" },
          { key: "profile",     label: "Profile" },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{
              padding: "7px 16px", borderRadius: 20, border: "1.5px solid #e2e8f0",
              background: filter === t.key ? "linear-gradient(135deg,#2563eb,#0891b2)" : "white",
              color: filter === t.key ? "white" : "#64748b",
              fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "all .15s"
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1.5px solid #fecdd3", borderRadius: 12, padding: "12px 16px", color: "#dc2626", fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: 14 }}>Loading notifications…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              {filter === "all" ? "No notifications yet" : "No alerts in this category"}
            </p>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Click "Check Now" to scan your profile and generate smart alerts
            </p>
            <button onClick={refresh}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", background: "linear-gradient(135deg,#2563eb,#0891b2)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <RefreshCw size={14} /> Check Now
            </button>
          </div>
        </Card>
      ) : (
        // Grouped by category
        Object.entries(grouped).map(([cat, items]) => {
          const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.general;
          const CatIcon = cfg.icon;
          return (
            <div key={cat}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 10px" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CatIcon size={13} color={cfg.color} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: 0 }}>{cfg.label}</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "2px 8px", borderRadius: 20, border: `1px solid ${cfg.border}` }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map(n => <NotifItem key={n._id || n.id} n={n} onRead={markRead} onDelete={deleteOne} navigate={navigate} />)}
              </div>
            </div>
          );
        })
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
