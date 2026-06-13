import React from "react";

export default function ReadinessScore() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Readiness score</p>
        <h2>Application preparation status</h2>
      </div>
      <section className="panel score-panel">
        <div className="score-orbit large">
          <span>82</span>
          <small>out of 100</small>
        </div>
        <div>
          <h3>Almost ready</h3>
          <p>Your profile and eligibility are strong, but DBT status and passbook clarity need confirmation.</p>
          <div className="progress-list">
            <span>Eligibility match: 38/40</span>
            <span>Documents: 20/25</span>
            <span>DBT readiness: 9/15</span>
            <span>Deadline safety: 10/10</span>
          </div>
        </div>
      </section>
    </div>
  );
}
