import React from "react";

export default function AwarenessGuide() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Awareness guide</p>
        <h2>DBT, Aadhaar seeding, and scholarship safety</h2>
      </div>
      <section className="card-grid">
        {["DBT means Direct Benefit Transfer to a bank account.", "Aadhaar seeding links Aadhaar with bank for benefits.", "Wrong IFSC or inactive account can delay payment.", "Never share OTP or pay unknown agents."].map((item) => (
          <article className="info-card" key={item}>{item}</article>
        ))}
      </section>
    </div>
  );
}
