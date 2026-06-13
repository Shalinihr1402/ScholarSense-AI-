import React from "react";

export default function FailureDiagnosis() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Failure diagnosis</p>
        <h2>Probable scholarship risk factors</h2>
      </div>
      <section className="panel">
        <div className="risk-banner">Medium Risk</div>
        <ul className="task-list">
          <li>Aadhaar-bank seeding status is not confirmed.</li>
          <li>Bank passbook image may not show IFSC clearly.</li>
          <li>Institute verification status should be checked before deadline.</li>
        </ul>
      </section>
    </div>
  );
}
