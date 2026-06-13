import React from "react";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { profileApi } from "../services/api.js";

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

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">ScholarSense AI</p>
          <h2>{user?.name ? `${user.name}'s readiness dashboard` : "Scholarship readiness dashboard"}</h2>
          <p>
            Track eligibility, document quality, DBT readiness, and probable failure reasons before
            scholarship rejection or payment delay happens.
          </p>
        </div>
        <div className="score-orbit">
          <span>{readinessPreview}</span>
          <small>Readiness</small>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Profile completion" value={`${completion}%`} note={`${missingFields.length} fields pending`} />
        <StatCard
          label="Risk level"
          value={riskLevel}
          tone={riskLevel === "Low" ? "green" : riskLevel === "Medium" ? "amber" : "red"}
          note={dbtReady ? "DBT ready" : "DBT check needed"}
        />
        <StatCard label="Documents listed" value={profileState.insights?.documentCount ?? 0} tone="teal" note="From profile" />
        <StatCard
          label="Profile status"
          value={profileState.profile ? "Saved" : "New"}
          tone={profileState.profile ? "green" : "amber"}
          note={profileState.loading ? "Loading..." : "Day 3 module"}
        />
      </section>

      <section className="two-column">
        <div className="panel">
          <h3>Recommended actions</h3>
          <ul className="task-list">
            {recommendedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Recent diagnosis</h3>
          <div className="timeline">
            {profileState.error ? <span>{profileState.error}</span> : null}
            <span>{profileState.profile ? "Student profile loaded" : "Create your student profile"}</span>
            <span>{dbtReady ? "DBT readiness confirmed" : "DBT readiness requires confirmation"}</span>
            <span>Eligibility predictor will use profile data on Day 4</span>
          </div>
        </div>
      </section>
    </div>
  );
}
