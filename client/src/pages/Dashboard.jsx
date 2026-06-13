import React from "react";
import StatCard from "../components/StatCard.jsx";

export default function Dashboard() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">ScholarSense AI</p>
          <h2>Scholarship readiness dashboard</h2>
          <p>
            Track eligibility, document quality, DBT readiness, and probable failure reasons before
            scholarship rejection or payment delay happens.
          </p>
        </div>
        <div className="score-orbit">
          <span>82</span>
          <small>Readiness</small>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Eligible schemes" value="04" note="Based on profile" />
        <StatCard label="Risk level" value="Medium" tone="amber" note="2 actions needed" />
        <StatCard label="OCR quality" value="Good" tone="teal" note="Last upload readable" />
        <StatCard label="Notifications" value="03" tone="green" note="1 high priority" />
      </section>

      <section className="two-column">
        <div className="panel">
          <h3>Recommended actions</h3>
          <ul className="task-list">
            <li>Confirm Aadhaar-bank seeding status for DBT payment.</li>
            <li>Upload a clearer bank passbook image with visible IFSC code.</li>
            <li>Check institute verification status before deadline.</li>
          </ul>
        </div>
        <div className="panel">
          <h3>Recent diagnosis</h3>
          <div className="timeline">
            <span>NSP status screenshot analyzed</span>
            <span>Bank validation risk detected</span>
            <span>Email reminder prepared</span>
          </div>
        </div>
      </section>
    </div>
  );
}
