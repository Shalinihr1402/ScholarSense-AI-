import React from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldAlert } from "lucide-react";
import { diagnosisApi } from "../services/api.js";

function priorityClass(priority) {
  return priority === "critical" ? "bad" : priority === "high" ? "bad" : priority === "medium" ? "warn" : "ok";
}

export default function FailureDiagnosis() {
  const [data, setData] = React.useState(null);
  const [status, setStatus] = React.useState({ loading: true, error: "" });

  React.useEffect(() => {
    diagnosisApi
      .getMine()
      .then((response) => {
        setData(response);
        setStatus({ loading: false, error: "" });
      })
      .catch((error) => setStatus({ loading: false, error: error.message }));
  }, []);

  const diagnosis = data?.diagnosis;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Failure diagnosis</p>
        <h2>Probable scholarship risk factors</h2>
      </div>

      {status.loading ? <section className="panel">Loading diagnosis...</section> : null}
      {status.error ? <div className="form-alert error">{status.error}</div> : null}
      {data && !data.profileFound ? (
        <div className="form-alert error">Save your Profile first to generate a meaningful diagnosis.</div>
      ) : null}

      {diagnosis ? (
        <>
          <section className="diagnosis-hero">
            <div>
              <p className="eyebrow">Risk level</p>
              <h3>{diagnosis.riskLevel}</h3>
              <p>
                {diagnosis.issueCount === 0
                  ? "No major failure risk detected from your current profile."
                  : `${diagnosis.issueCount} issue(s) detected across DBT, documents, eligibility, deadline, and profile readiness.`}
              </p>
            </div>
            <ShieldAlert size={54} />
          </section>

          <section className="stats-grid">
            <div className="stat-card red">
              <p>Critical</p>
              <strong>{diagnosis.counts.critical}</strong>
              <span>Must fix first</span>
            </div>
            <div className="stat-card amber">
              <p>High</p>
              <strong>{diagnosis.counts.high}</strong>
              <span>Can cause rejection/payment failure</span>
            </div>
            <div className="stat-card blue">
              <p>Medium</p>
              <strong>{diagnosis.counts.medium}</strong>
              <span>Needs verification</span>
            </div>
            <div className="stat-card green">
              <p>Readiness</p>
              <strong>{diagnosis.summary.readinessScore}</strong>
              <span>Score out of 100</span>
            </div>
          </section>

          <section className="two-column">
            <div className="panel">
              <h3>Personalized action plan</h3>
              <div className="action-plan">
                {diagnosis.actionPlan.map((item) => (
                  <article key={`${item.step}-${item.title}`} className="action-step">
                    <b>{item.step}</b>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.action}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="panel">
              <h3>Scholarship matching summary</h3>
              <div className="timeline">
                <span>{diagnosis.summary.eligibleCount} scholarship(s) fully eligible</span>
                <span>{diagnosis.summary.checkCount} scholarship(s) need document/DBT checking</span>
                <span>{diagnosis.summary.notEligibleCount} scholarship(s) have hard rule mismatch</span>
              </div>
            </div>
          </section>

          <section className="diagnosis-grid">
            {diagnosis.issues.length === 0 ? (
              <article className="diagnosis-card ok">
                <CheckCircle2 size={22} />
                <div>
                  <h3>No major risk detected</h3>
                  <p>Still verify official scholarship portal details before applying.</p>
                </div>
              </article>
            ) : (
              diagnosis.issues.map((item) => (
                <article className={`diagnosis-card ${priorityClass(item.priority)}`} key={`${item.type}-${item.title}-${item.reason}`}>
                  {item.priority === "critical" || item.priority === "high" ? (
                    <AlertTriangle size={22} />
                  ) : (
                    <ClipboardList size={22} />
                  )}
                  <div>
                    <div className="diagnosis-card-title">
                      <h3>{item.title}</h3>
                      <span>{item.priority}</span>
                    </div>
                    <p><strong>Reason:</strong> {item.reason}</p>
                    <p><strong>Action:</strong> {item.action}</p>
                    <small>{item.source}</small>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
