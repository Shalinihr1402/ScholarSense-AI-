import React from "react";
import {
  BarChart3, Bell, BookOpen, FileScan, FolderLock,
  Gauge, Home, Languages, ListChecks, ShieldAlert, ShieldCheck,
  UserRound, LogOut
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/scholarsense-logo.jpeg";

const navItems = [
  { label: "Dashboard",         path: "/dashboard",         icon: Home,        group: "main" },
  { label: "Profile",           path: "/profile",           icon: UserRound,   group: "main" },
  { label: "Document Vault",    path: "/document-vault",    icon: FolderLock,  group: "tools" },
  { label: "Health Check",      path: "/risk-analyzer",     icon: ShieldCheck, group: "tools" },
  { label: "Scholarships",      path: "/scholarships",      icon: ListChecks,  group: "tools" },
  { label: "Status Analyzer",   path: "/ocr-analyzer",      icon: FileScan,    group: "tools" },
  { label: "Readiness Score",   path: "/readiness-score",   icon: Gauge,       group: "tools" },
  { label: "Failure Diagnosis", path: "/failure-diagnosis", icon: ShieldAlert, group: "tools" },
  { label: "Awareness Guide",   path: "/awareness",         icon: BookOpen,    group: "support" },
  { label: "Notifications",     path: "/notifications",     icon: Bell,        group: "support" },
  { label: "Analytics",         path: "/admin/dashboard",   icon: BarChart3,   group: "admin" },
];

const GROUP_LABELS = { main: "Main", tools: "Tools", support: "Support", admin: "Admin" };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const visible = navItems.filter(i => i.path !== "/admin/dashboard" || user?.role === "admin");
  const initials = (user?.name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // Group items
  const groups = visible.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <aside style={{
      width: 270, background: "#ffffff",
      borderRight: "1px solid #e8f0fe",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
      overflow: "hidden"
    }}>

      {/* Subtle top gradient accent */}
      <div style={{ height: 3, background: "linear-gradient(90deg,#2563eb 0%,#0891b2 50%,#0d9488 100%)", flexShrink: 0 }} />

      {/* ── Brand ── */}
      <div style={{ padding: "18px 20px 14px", display: "flex", alignItems: "center", gap: 11, flexShrink: 0 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, overflow: "hidden", flexShrink: 0,
          border: "2px solid #dbeafe",
          boxShadow: "0 2px 12px rgba(37,99,235,.18)"
        }}>
          <img src={logo} alt="ScholarSense AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#2563eb", letterSpacing: "-.02em", lineHeight: 1.2 }}>
            ScholarSense <span style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#0d9488", marginTop: 2 }}>
            Guide · Analyze · Succeed
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg,transparent,#e2e8f0,transparent)", margin: "0 16px 10px", flexShrink: 0 }} />

      {/* ── Nav (scrollable) ── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 12px 8px", display: "flex", flexDirection: "column", gap: 2 }}
        aria-label="Primary navigation">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 4 }}>
            <p style={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em",
              textTransform: "uppercase", color: "#94a3b8",
              padding: "8px 8px 4px", margin: 0
            }}>
              {GROUP_LABELS[group]}
            </p>
            {items.map(item => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path}
                  style={({ isActive }) => ({
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 10, margin: "1px 0",
                    fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                    textDecoration: "none", position: "relative", overflow: "hidden",
                    transition: "all .18s ease",
                    background: isActive
                      ? "linear-gradient(135deg,#eff6ff 0%,#e0f2fe 100%)"
                      : "transparent",
                    color: isActive ? "#2563eb" : "#475569",
                    borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
                    boxShadow: isActive ? "0 2px 8px rgba(37,99,235,.1)" : "none"
                  })}
                  onMouseEnter={e => {
                    if (!e.currentTarget.classList.contains("active")) {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.color = "#2563eb";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.style.borderLeft.includes("3px solid #2563eb")) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#475569";
                    }
                  }}
                >
                  {({ isActive }) => (
                    <>
                      {/* Icon wrapper */}
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? "rgba(37,99,235,.12)" : "rgba(0,0,0,.04)",
                        transition: "background .18s"
                      }}>
                        <Icon size={15} />
                      </div>
                      <span style={{ flex: 1, lineHeight: 1 }}>{item.label}</span>
                      {/* Active dot */}
                      {isActive && (
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#2563eb", flexShrink: 0,
                          animation: "navDotPulse 2s ease infinite"
                        }} />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Language chip ── */}
      <div style={{
        margin: "0 12px 10px", padding: "9px 12px",
        background: "linear-gradient(135deg,#f0fdfa,#eff6ff)",
        border: "1px solid #ccfbf1", borderRadius: 10,
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 11.5, fontWeight: 700, color: "#0d9488", flexShrink: 0
      }}>
        <Languages size={13} color="#0d9488" />
        <span>English / ಕನ್ನಡ / हिंदी</span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg,transparent,#e2e8f0,transparent)", margin: "0 16px 10px", flexShrink: 0 }} />

      {/* ── User card ── */}
      <div style={{
        margin: "0 12px 16px", padding: "10px 12px",
        background: "linear-gradient(135deg,#f8fafc,#f0f9ff)",
        border: "1px solid #e2e8f0", borderRadius: 12,
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        boxShadow: "0 2px 8px rgba(15,23,42,.05)"
      }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,#2563eb 0%,#0891b2 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 13, fontWeight: 800,
          boxShadow: "0 2px 8px rgba(37,99,235,.3)"
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name || "Student"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", marginTop: 1 }}>
            {user?.role || "student"}
          </div>
        </div>
        <button onClick={logout} title="Logout"
          style={{
            width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0",
            background: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#94a3b8", flexShrink: 0, transition: "all .15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fecaca"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
        >
          <LogOut size={13} />
        </button>
      </div>

      <style>{`
        @keyframes navDotPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.5; transform:scale(.7); }
        }
        aside nav a:hover > div:first-child {
          background: rgba(37,99,235,.1) !important;
        }
      `}</style>
    </aside>
  );
}
