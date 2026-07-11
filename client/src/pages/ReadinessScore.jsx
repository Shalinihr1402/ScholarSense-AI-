import React from "react";
import { readinessApi } from "../services/api.js";
import { ExternalLink, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

const NPCI_STEPS = [
  { step: 1, text: 'Open myAadhaar portal — myaadhaar.uidai.gov.in' },
  { step: 2, text: 'Login with your Aadhaar number and OTP' },
  { step: 3, text: 'Go to "Aadhaar Services" → "Bank Seeding Status"' },
  { step: 4, text: 'Check if your bank account is already seeded' },
  { step: 5, text: 'If not seeded, visit your bank branch with your Aadhaar card to link it' },
  { step: 6, text: 'Once seeded, update your profile — set Aadhaar Bank Linked → Yes and NPCI Mapping → Yes' },
];

function NPCIBaseCard({ dbtScore }) {
  const isConfirmed = dbtScore?.matched === dbtScore?.total && dbtScore?.total > 0;

  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      border: `1.5px solid ${isConfirmed ? "#bbf7d0" : "#fed7aa"}`,
      background: isConfirmed ? "#f0fdf4" : "white",
      boxShadow: "0 2px 10px rgba(15,23,42,.07)"
    }}>
      <div style={{
        padding: "14px 18px", display: "flex", alignItems: "center", gap: 12,
        background: isConfirmed ? "#dcfce7" : "#fff7ed",
        borderBottom: `1px solid ${isConfirmed ? "#bbf7d0" : "#fed7aa"}`
      }}>
        {isConfirmed
          ? <CheckCircle2 size={22} color="#16a34a" />
          : <AlertTriangle size={22} color="#ea580c" />}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: isConfirmed ? "#15803d" : "#c2410c" }}>
            {isConfirmed ? "Aadhaar-Bank Linking Confirmed" : "Aadhaar Not Linked to Bank — Action Required"}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: isConfirmed ? "#166534" : "#9a3412", marginTop: 2 }}>
            {isConfirmed
              ? "Your scholarship money will be credited directly to your bank via DBT."
              : "Without Aadhaar-Bank linking, scholarship money (DBT) will not reach you even if selected."}
          </p>
        </div>
        {!isConfirmed && (
          <a href="https://myaadhaar.uidai.gov.in/" target="_blank" rel="noreferrer" style={{
            display: "flex", alignItems: "center", gap: 5, padding: "8px 14px",
            borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0,
            background: "#ea580c", color: "white"
          }}>
            Fix Now <ExternalLink size={12} />
          </a>
        )}
      </div>

      {!isConfirmed && (
        <div style={{ padding: "16px 18px" }}>
          <p style={{ margin: "0 0 12px", fontSize: 12.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em" }}>
            How to link Aadhaar to Bank (NPCI BASE — takes 2 minutes)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {NPCI_STEPS.map(({ step, text }) => (
              <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "#2563eb", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800
                }}>{step}</div>
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5, paddingTop: 3 }}>{text}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#1e40af" }}>
              <strong>After linking:</strong> Update your profile — set "Aadhaar Bank Linked" to Yes and "NPCI Mapping" to Yes. Your DBT readiness score will increase.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ComponentRow({ label, component, detail }) {
  const percent = Math.round((component.points / component.max) * 100);

  return (
    <div className="score-row">
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <div className="score-row-meter">
        <div style={{ width: `${percent}%` }} />
      </div>
      <b>
        {component.points}/{component.max}
      </b>
    </div>
  );
}

export default function ReadinessScore() {
  const [data, setData] = React.useState(null);
  const [status, setStatus] = React.useState({ loading: true, error: "" });

  React.useEffect(() => {
    readinessApi
      .getMine()
      .then((response) => {
        setData(response);
        setStatus({ loading: false, error: "" });
      })
      .catch((error) => setStatus({ loading: false, error: error.message }));
  }, []);

  const readiness = data?.readiness;
  const components = readiness?.components;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Readiness score</p>
        <h2>Application preparation status</h2>
      </div>

      {status.loading ? <section className="panel">Loading readiness score...</section> : null}
      {status.error ? <div className="form-alert error">{status.error}</div> : null}
      {data && !data.profileFound ? (
        <div className="form-alert error">Save your Profile first to generate an accurate readiness score.</div>
      ) : null}

      {readiness ? (
        <>
          <section className="panel score-panel">
            <div
              className={`score-orbit large ${readiness.status.riskLevel.toLowerCase()}`}
              style={{ "--score": `${readiness.totalScore}%` }}
            >
              <span>{readiness.totalScore}</span>
              <small>out of 100</small>
            </div>
            <div>
              <p className="eyebrow">{readiness.status.riskLevel} risk</p>
              <h3>{readiness.status.label}</h3>
              <p>{readiness.status.summary}</p>
              <div className="readiness-summary">
                <span>{readiness.summary.eligibleCount} eligible</span>
                <span>{readiness.summary.checkCount} need checking</span>
                <span>{readiness.summary.notEligibleCount} not eligible</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <h3>Score breakdown</h3>
            <div className="score-breakdown">
              <ComponentRow
                label="Profile completion"
                component={components.profile}
                detail={`${components.profile.completion}% completed`}
              />
              <ComponentRow
                label="Eligibility strength"
                component={components.eligibility}
                detail={`${components.eligibility.averageMatch}% average match`}
              />
              <ComponentRow
                label="Document readiness"
                component={components.documents}
                detail={`${components.documents.matched}/${components.documents.total} required documents ready`}
              />
              <ComponentRow
                label="DBT readiness"
                component={components.dbt}
                detail={`${components.dbt.matched}/${components.dbt.total} DBT checks confirmed`}
              />
              <ComponentRow label="Deadline safety" component={components.deadline} detail="Based on matching schemes" />
            </div>
          </section>

          <NPCIBaseCard dbtScore={components.dbt} />

          <section className="two-column">
            <div className="panel">
              <h3>Personalized action plan</h3>
              <ul className="task-list">
                {readiness.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h3>Top scholarship matches</h3>
              <div className="timeline">
                {readiness.summary.topScholarships.map((scholarship) => (
                  <span key={scholarship.name}>
                    {scholarship.name} - {scholarship.status} ({scholarship.matchScore}%)
                  </span>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
