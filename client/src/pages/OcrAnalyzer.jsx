import React from "react";

export default function OcrAnalyzer() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">OCR screenshot analyzer</p>
        <h2>Upload NSP/SSP screenshots or document images</h2>
      </div>
      <section className="two-column">
        <div className="panel upload-panel">
          <h3>Document upload</h3>
          <input type="file" accept="image/*,.pdf" />
          <button className="primary-btn" type="button">Analyze Screenshot</button>
        </div>
        <div className="panel">
          <h3>Sample result</h3>
          <p><strong>Detected type:</strong> NSP Status Screenshot</p>
          <p><strong>OCR confidence:</strong> 74%</p>
          <p><strong>Issue:</strong> Bank validation may be pending or failed.</p>
          <p><strong>Guidance:</strong> Verify IFSC, account status, and Aadhaar-bank seeding.</p>
        </div>
      </section>
    </div>
  );
}
