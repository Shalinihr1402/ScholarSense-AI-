import React from "react";

const scholarships = [
  ["Post-Matric Scholarship", "Eligible", "Income and category matched"],
  ["AICTE Swanath", "Check", "Requires special eligibility verification"],
  ["Merit-cum-Means", "Not eligible", "Marks below configured limit"]
];

export default function Scholarships() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Eligibility predictor</p>
        <h2>Scholarships for me</h2>
      </div>
      <section className="panel">
        <div className="table-like">
          {scholarships.map(([name, status, reason]) => (
            <div className="table-row" key={name}>
              <strong>{name}</strong>
              <span className={`status-pill ${status === "Eligible" ? "ok" : status === "Check" ? "warn" : "bad"}`}>
                {status}
              </span>
              <p>{reason}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
