import React from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  FileScan,
  Gauge,
  Home,
  Languages,
  ListChecks,
  ShieldAlert,
  UserRound
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/scholarsense-logo.jpeg";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "Profile", path: "/profile", icon: UserRound },
  { label: "Scholarships", path: "/scholarships", icon: ListChecks },
  { label: "OCR Analyzer", path: "/ocr-analyzer", icon: FileScan },
  { label: "Readiness Score", path: "/readiness-score", icon: Gauge },
  { label: "Failure Diagnosis", path: "/failure-diagnosis", icon: ShieldAlert },
  { label: "AI Chatbot", path: "/chatbot", icon: Bot },
  { label: "Awareness Guide", path: "/awareness", icon: BookOpen },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Analytics", path: "/admin/dashboard", icon: BarChart3 }
];

export default function Sidebar() {
  const { user } = useAuth();
  const visibleItems = navItems.filter((item) => item.path !== "/admin/dashboard" || user?.role === "admin");

  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <img className="brand-mark" src={logo} alt="ScholarSense AI logo" />
        <div>
          <h1>ScholarSense AI</h1>
          <p>Scholarship decision support</p>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} className="nav-link">
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="language-chip">
        <Languages size={16} />
        <span>English / Kannada / Hindi</span>
      </div>
    </aside>
  );
}
