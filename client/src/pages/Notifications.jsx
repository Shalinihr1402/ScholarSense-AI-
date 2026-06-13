import React from "react";

export default function Notifications() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Notifications</p>
        <h2>Scholarship alerts</h2>
      </div>
      <section className="panel">
        <div className="notification-list">
          <span>Deadline reminder: Post-Matric Scholarship closes soon.</span>
          <span>OCR warning: Bank passbook IFSC is not clearly visible.</span>
          <span>Readiness score generated: 82/100.</span>
        </div>
      </section>
    </div>
  );
}
