import React from "react";
import { readinessApi } from "../services/api.js";

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
