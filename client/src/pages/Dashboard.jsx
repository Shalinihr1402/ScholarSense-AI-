import React from "react";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { profileApi } from "../services/api.js";
import { Link } from "react-router-dom";
import { FileText, Search, ClipboardCheck, Trophy, FileSearch, AlertTriangle, ShieldCheck, GraduationCap, ArrowRight, Headphones } from "lucide-react";
import logo from "../assets/scholarsense-logo.jpeg";

// ── Quick action button ───────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, to }) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        cursor: "pointer"
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#f0f9ff",
          border: "1.5px solid #bfdbfe",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .18s",
          boxShadow: "0 2px 8px rgba(37,99,235,.1)"
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderColor = "#2563eb"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f0f9ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
        >
          <Icon size={22} color="#2563eb" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", textAlign: "center" }}>{label}</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profileState, setProfileState] = React.useState({
    loading: true,
    profile: null,
    insights: null,
    error: ""
  });

  React.useEffect(() => {
    profileApi
      .getMine()
      .then((data) => setProfileState({ loading: false, profile: data.profile, insights: data.insights, error: "" }))
      .catch((error) => setProfileState({ loading: false, profile: null, insights: null, error: error.message }));
  }, []);

  const completion = profileState.insights?.completion ?? 0;
  const dbtReady = profileState.insights?.dbtReady ?? false;
  const missingFields = profileState.insights?.missingFields || [];
  const readinessPreview = Math.max(25, Math.round(completion * 0.7 + (dbtReady ? 20 : 5)));
  const riskLevel = dbtReady && completion >= 80 ? "Low" : completion >= 55 ? "Medium" : "High";
  const recommendedActions =
    missingFields.length > 0
      ? [
          "Complete missing profile fields to improve eligibility prediction.",
          ...(profileState.insights?.dbtWarnings || []),
          "Upload document details before running readiness score."
        ]
      : [
          "Profile data is ready for eligibility prediction.",
          dbtReady ? "DBT and bank status look ready." : "Confirm DBT, Aadhaar-bank, and bank active status.",
          "Proceed to scholarship matching and OCR document analysis."
        ];

  const recentActivity = [
    { icon: <FileText size={16} color="#2563eb" />, bg: "#eff6ff", text: "Document analyzed", time: "2 mins ago" },
    { icon: <AlertTriangle size={16} color="#d97706" />, bg: "#fef3c7", text: "Issue found in Income Cert.", time: "15 mins ago" },
    { icon: <ShieldCheck size={16} color="#16a34a" />, bg: "#dcfce7", text: "Eligibility checked", time: "1 hour ago" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Hero card */}
        <div style={{
          background: "white",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 12px rgba(15,23,42,.07)",
          overflow: "hidden",
          minHeight: 320,
          position: "relative"
        }}>
          <div style={{ display: "flex", alignItems: "stretch", minHeight: 320 }}>

            {/* ── Text side ── */}
            <div style={{ flex: 1, padding: "40px 36px 40px 40px", display: "flex", flexDirection: "column", justifyContent: "center", zIndex: 2, position: "relative" }}>
              <h2 style={{ fontSize: 36, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.1 }}>
                ScholarSense{" "}
                <span style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  AI
                </span>
              </h2>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#475569", margin: "0 0 14px" }}>
                Your Smart Scholarship Companion
              </p>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75, maxWidth: 380, margin: "0 0 32px" }}>
                Upload documents, check eligibility, analyze issues, and get personalized
                guidance — all in one place.
              </p>
              {/* 4 quick actions */}
              <div style={{ display: "flex", gap: 32 }}>
                <QuickAction icon={FileText}       label="Guide"   to="/awareness" />
                <QuickAction icon={Search}         label="Analyze" to="/ocr-analyzer" />
                <QuickAction icon={ClipboardCheck} label="Prepare" to="/risk-analyzer" />
                <QuickAction icon={Trophy}         label="Succeed" to="/scholarships" />
              </div>
            </div>

            {/* ── Logo illustration side ── */}
            <div style={{
              width: 340, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg,#f0f9ff 0%,#f0fdfa 100%)",
              overflow: "hidden", position: "relative"
            }}>
              {/* Single wrapper — all rings + logo perfectly centered here */}
              <div style={{ position: "relative", width: 290, height: 290, flexShrink: 0 }}>

                {/* Ring 1 — outermost dashed spinning teal (fits exactly in 290px box) */}
                <svg style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  animation: "spinSlow 22s linear infinite"
                }} viewBox="0 0 290 290" fill="none">
                  <circle cx="145" cy="145" r="140" stroke="#0d9488" strokeWidth="1.8"
                    strokeDasharray="9 6" strokeLinecap="round" opacity=".5" />
                </svg>

                {/* Ring 2 — solid teal, 240px */}
                <svg style={{ position: "absolute", inset: 25, width: "calc(100% - 50px)", height: "calc(100% - 50px)" }}
                  viewBox="0 0 240 240" fill="none">
                  <circle cx="120" cy="120" r="117" stroke="#0d9488" strokeWidth="1.2" opacity=".22" />
                </svg>

                {/* Ring 3 — solid blue, 196px */}
                <svg style={{ position: "absolute", inset: 47, width: "calc(100% - 94px)", height: "calc(100% - 94px)" }}
                  viewBox="0 0 196 196" fill="none">
                  <circle cx="98" cy="98" r="95" stroke="#2563eb" strokeWidth="1.5" opacity=".18" />
                </svg>

                {/* Gradient fill circle */}
                <div style={{
                  position: "absolute",
                  inset: 60,                       /* 290 - 2×60 = 170px */
                  borderRadius: "50%",
                  background: "radial-gradient(circle,#dbeafe 0%,#e0f2fe 60%,#ccfbf1 100%)",
                  boxShadow: "0 6px 32px rgba(37,99,235,.13)"
                }} />

                {/* White logo disc — centered absolutely */}
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 178, height: 178,
                  borderRadius: "50%",
                  background: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 20px rgba(37,99,235,.14)",
                  zIndex: 2
                }}>
                  <img src={logo} alt="ScholarSense AI"
                    style={{ width: 156, height: 156, objectFit: "contain", display: "block" }} />
                </div>

                {/* Sparkle dots — anchored to wrapper corners */}
                <div style={{ position: "absolute", top: 16, right: 16, width: 16, height: 16, borderRadius: "50%", background: "#0d9488", zIndex: 3, animation: "sparkleFloat 3s ease infinite" }} />
                <div style={{ position: "absolute", bottom: 40, left: 14, width: 11, height: 11, borderRadius: "50%", background: "#2563eb", zIndex: 3, animation: "sparkleFloat 3s 1s ease infinite" }} />
                <div style={{ position: "absolute", top: 70, left: 8,   width: 8,  height: 8,  borderRadius: "50%", background: "#0d9488", zIndex: 3, animation: "sparkleFloat 3s 1.8s ease infinite" }} />
                <div style={{ position: "absolute", bottom: 20, right: 44, width: 7, height: 7, borderRadius: "50%", background: "#2563eb", zIndex: 3, animation: "sparkleFloat 3s .5s ease infinite" }} />
              </div>
            </div>

          </div>
        </div>

        {/* "Try asking me something" */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Try asking me something</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { icon: <ShieldCheck size={18} color="#2563eb" />, bg: "#eff6ff", title: "Check Eligibility", sub: "Check my scholarship eligibility for NSP", to: "/risk-analyzer" },
              { icon: <FileSearch size={18} color="#0d9488" />, bg: "#f0fdfa", title: "Document Review", sub: "Analyze my documents for any issues", to: "/document-vault" },
              { icon: <FileText size={18} color="#7c3aed" />, bg: "#f5f3ff", title: "Track Application", sub: "How can I track my scholarship status?", to: "/ocr-analyzer" },
              { icon: <GraduationCap size={18} color="#d97706" />, bg: "#fffbeb", title: "Find Scholarships", sub: "Find scholarships I'm eligible for", to: "/scholarships" },
            ].map(c => (
              <Link key={c.title} to={c.to} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "white", border: "1px solid #e2e8f0", borderRadius: 14,
                  padding: "16px 14px", cursor: "pointer", transition: "box-shadow .18s",
                  boxShadow: "0 1px 4px rgba(15,23,42,.05)"
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,23,42,.1)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(15,23,42,.05)"}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    {c.icon}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#2563eb", margin: "0 0 4px" }}>{c.title}</p>
                  <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{c.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>


        <style>{`
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes sparkleFloat {
            0%, 100% { transform: translateY(0) scale(1); opacity: .6; }
            50%       { transform: translateY(-6px) scale(1.2); opacity: 1; }
          }
        `}</style>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Quick Stats */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 4px rgba(15,23,42,.05)" }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 16px" }}>Quick Stats</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: <FileText size={15} color="#2563eb" />, bg: "#eff6ff", label: "Documents Analyzed", value: profileState.insights?.documentCount ?? 0 },
              { icon: <AlertTriangle size={15} color="#d97706" />, bg: "#fef3c7", label: "Issues Found", value: missingFields.length },
              { icon: <FileSearch size={15} color="#0d9488" />, bg: "#f0fdfa", label: "Reports Generated", value: 5 },
              { icon: <GraduationCap size={15} color="#7c3aed" />, bg: "#f5f3ff", label: "Scholarships Found", value: 8 },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <span style={{ flex: 1, fontSize: 13, color: "#475569", fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 4px rgba(15,23,42,.05)" }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 16px" }}>Recent Activity</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {a.icon}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{a.text}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0", fontWeight: 500 }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/notifications" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            marginTop: 16, padding: "10px", borderRadius: 10,
            background: "#f8fafc", border: "1px solid #e2e8f0",
            fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none"
          }}>
            View All Activity <ArrowRight size={13} />
          </Link>
        </div>

        {/* Need Help? */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 4px rgba(15,23,42,.05)" }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 6px" }}>Need Help?</p>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px", lineHeight: 1.6 }}>
            Our support team is here to assist you.
          </p>
          <Link to="/chatbot" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 16px", borderRadius: 10,
            border: "1.5px solid #bfdbfe", background: "#f0f9ff",
            fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none",
            transition: "background .15s"
          }}>
            <Headphones size={15} /> Contact Support
          </Link>
        </div>

      </div>
    </div>
  );
}
