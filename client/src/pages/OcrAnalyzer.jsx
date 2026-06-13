import React from "react";
import { AlertTriangle, FileScan, ShieldCheck, Upload } from "lucide-react";
import { ocrApi } from "../services/api.js";

export default function OcrAnalyzer() {
  const [file, setFile] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [status, setStatus] = React.useState({ loading: false, error: "" });

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setStatus({ loading: false, error: "Please choose a screenshot or document image first." });
      return;
    }

    setStatus({ loading: true, error: "" });
    setResult(null);

    try {
      const response = await ocrApi.analyze(file);
      setResult(response.result);
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">OCR screenshot analyzer</p>
        <h2>Upload NSP/SSP screenshots or document images</h2>
      </div>

      <section className="two-column">
        <form className="panel upload-panel" onSubmit={handleSubmit}>
          <div className="upload-icon">
            <Upload size={34} />
          </div>
          <h3>Document upload</h3>
          <p className="muted-text">
            Upload a clear image of NSP/SSP status, bank passbook, income certificate, marksheet, Aadhaar, or scholarship document.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          {file ? <span className="selected-file">{file.name}</span> : null}
          {status.error ? <div className="form-alert error">{status.error}</div> : null}
          <button className="primary-btn" type="submit" disabled={status.loading}>
            {status.loading ? "Analyzing OCR..." : "Analyze Screenshot"}
          </button>
        </form>

        <div className="panel">
          <h3>What this analyzer checks</h3>
          <div className="timeline">
            <span>NSP/SSP status text like rejected, defective, payment failed, sent to PFMS</span>
            <span>Bank passbook details like IFSC/account visibility</span>
            <span>Document readability using OCR confidence and detected text length</span>
            <span>Student guidance for DBT, Aadhaar-bank seeding, and correction actions</span>
          </div>
        </div>
      </section>

      {result ? (
        <>
          <section className="stats-grid">
            <div className={`stat-card ${result.quality === "Good" ? "green" : result.quality === "Medium" ? "amber" : "red"}`}>
              <p>Quality score</p>
              <strong>{result.qualityScore}/100</strong>
              <span>{result.uploadDecision.label}</span>
            </div>
            <div className="stat-card blue">
              <p>Detected type</p>
              <strong>{result.documentType}</strong>
              <span>{result.textLength} characters detected</span>
            </div>
            <div className="stat-card teal">
              <p>Status findings</p>
              <strong>{result.statusFindings.length}</strong>
              <span>Portal/status issues detected</span>
            </div>
            <div className="stat-card amber">
              <p>OCR confidence</p>
              <strong>{result.confidence}%</strong>
              <span>{result.quality} readability</span>
            </div>
          </section>

          <section className="panel">
            <div className="quality-header">
              <div>
                <p className="eyebrow">Document quality checker</p>
                <h3>{result.uploadDecision.message}</h3>
              </div>
              <span className={`status-pill ${result.uploadDecision.risk === "Low" ? "ok" : result.uploadDecision.risk === "Medium" ? "warn" : "bad"}`}>
                {result.uploadDecision.risk} risk
              </span>
            </div>
            <div className="field-grid">
              {result.fieldVisibility.fields.map((field) => (
                <article className={`field-card ${field.detected ? "detected" : "missing"}`} key={field.field}>
                  <strong>{field.field}</strong>
                  <span>{field.detected ? "Detected" : "Not clear"}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="two-column">
            <div className="panel">
              <h3>Detected issues</h3>
              <div className="diagnosis-list">
                {result.issues.map((item) => (
                  <p className={item.startsWith("No major") ? "ok-text" : "warn-text"} key={item}>
                    <AlertTriangle size={16} /> {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="panel">
              <h3>Student guidance</h3>
              <div className="diagnosis-list">
                {result.suggestions.map((item) => (
                  <p className="ok-text" key={item}>
                    <ShieldCheck size={16} /> {item}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {result.statusFindings.length > 0 ? (
            <section className="panel">
              <h3>Scholarship status explanation</h3>
              <div className="diagnosis-grid">
                {result.statusFindings.map((finding) => (
                  <article className="diagnosis-card warn" key={finding.issue}>
                    <FileScan size={22} />
                    <div>
                      <h3>{finding.issue}</h3>
                      <p><strong>Meaning:</strong> {finding.meaning}</p>
                      <p><strong>Action:</strong> {finding.action}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel">
            <h3>Extracted OCR text preview</h3>
            <pre className="ocr-text-preview">{result.extractedText || "No readable text detected."}</pre>
            <p className="muted-text">{result.safetyNote}</p>
          </section>
        </>
      ) : null}
    </div>
  );
}
