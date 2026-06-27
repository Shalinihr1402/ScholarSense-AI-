import React from "react";
import { Bell, LogOut, Mic, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { notificationApi } from "../services/api.js";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = React.useState({ unread: 0, highPriority: 0 });

  React.useEffect(() => {
    let active = true;

    notificationApi
      .list()
      .then((data) => {
        if (active) {
          setSummary(data.summary);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      notificationApi
        .list()
        .then((data) => {
          if (active) {
            setSummary(data.summary);
          }
        })
        .catch(() => {});
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const initials = (user?.name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <div>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#0d9488", margin: "0 0 4px" }}>
          ScholarSense AI
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.3, color: "#0f172a", letterSpacing: "-.02em" }}>
          Your{" "}
          <span style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Smart Scholarship
          </span>
          {" "}Companion
        </h2>
      </div>
      <div className="topbar-actions">
        <label className="search-box">
          <Search size={16} color="#94a3b8" />
          <input placeholder="Search scholarships, documents…" />
        </label>
        <button className="icon-btn" type="button" aria-label="Voice assistant">
          <Mic size={17} />
        </button>
        <Link
          className={`icon-btn ${summary.unread > 0 ? "notification-dot" : ""}`}
          to="/notifications"
          aria-label="Notifications"
          title={`${summary.unread} unread`}
        >
          <Bell size={17} />
          {summary.unread > 0 && <span className="notification-count">{summary.unread}</span>}
        </Link>
        <div className="user-chip">
          <div className="user-chip-avatar">{initials}</div>
          <div>
            <span>{user?.name || "Student"}</span>
            <small>{user?.role || "student"}</small>
          </div>
        </div>
        <button className="icon-btn" type="button" aria-label="Logout" onClick={logout}>
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
