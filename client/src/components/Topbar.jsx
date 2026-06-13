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

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Student workspace</p>
        <h2>Readiness, diagnosis, and guidance in one place</h2>
      </div>
      <div className="topbar-actions">
        <label className="search-box">
          <Search size={17} />
          <input placeholder="Search scholarships, DBT, documents..." />
        </label>
        <button className="icon-btn" type="button" aria-label="Voice assistant">
          <Mic size={19} />
        </button>
        <Link
          className={`icon-btn ${summary.unread > 0 ? "notification-dot" : ""}`}
          to="/notifications"
          aria-label="Notifications"
          title={`${summary.unread} unread notification(s), ${summary.highPriority} high priority`}
        >
          <Bell size={19} />
          {summary.unread > 0 ? <span className="notification-count">{summary.unread}</span> : null}
        </Link>
        <div className="user-chip">
          <span>{user?.name || "Student"}</span>
          <small>{user?.role || "student"}</small>
        </div>
        <button className="icon-btn" type="button" aria-label="Logout" onClick={logout}>
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
