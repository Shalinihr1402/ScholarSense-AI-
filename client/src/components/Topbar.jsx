import React from "react";
import { Bell, LogOut, Mic, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Topbar() {
  const { user, logout } = useAuth();

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
        <button className="icon-btn notification-dot" type="button" aria-label="Notifications">
          <Bell size={19} />
        </button>
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
