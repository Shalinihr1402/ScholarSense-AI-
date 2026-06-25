import React from "react";
import { AlertTriangle, CheckCircle2, FileSearch, RefreshCw, XCircle } from "lucide-react";
import { ocrApi } from "../services/api.js";

const DOC_TYPES = [
  "Marksheet",
  "Aadhaar Card",
  "Bank Passbook",
  "Income Certificate",
  "Caste Certificate",
  "Bonafide Certificate",
  "Fee Receipt",
];

// Minimum keywords that MUST appear for each document type
const DOC_KEYWORDS = {
  "Marksheet": ["marks", "percentage", "board", "examination", "grade", "total", "subject", "score", "cgpa", "university", "result", "pass"],
  "Aadhaar Card": ["aadhaar", "uidai", "unique identification", "government of india", "dob", "enrollment"],
  "Bank Passbook": ["bank", "account", "ifsc", "branch", "passbook", "balance", "a/c"],
  "Income Certificate": ["income", "certificate", "tahsildar", "annual", "issued", "revenue", "rupees"],
  "Caste Certificate": ["caste", "certificate", "category", "scheduled", "obc", "tahsildar", "issued"],
  "Bonafide Certificate": ["bonafide", "bona fide", "study certificate", "college", "student", "course", "principal"],
  "Fee Receipt": ["receipt", "fee", "paid", "amount", "tuition", "college", "date"],
};

// Minimum OCR confidence to be "readable"
const MIN_CONFIDENCE = 35;
// Minimum text length
const MIN_TEXT_LENGTH = 80;
// How many keywords must match
const MIN_KEYWORD_MATCHES = 2;

function checkReadability(text, confidence, documentType) {
  const lower = text.toLowerCase();
  const keywords = DOC_KEYWORDS[documentType] || [];
  const matched = keywords.filter(k => lower.includes(k));
  const keywordScore = matched.length;

  const isLowConfidence = confidence < MIN_CONFIDENCE;
  const isTooShort = text.trim().length < MIN_TEXT_LENGTH;
  const isWrongType = keywordScore < MIN_KEYWORD_MATCHES;

  if (isTooShort && confidence < 20) {
    return {
      status: "unreadable",
      icon: "x",
      title: "Image is too blurry or dark to read",
      message: "The document could not be read at all. Please retake the photo in good lighting, keeping the camera steady and the full document in frame.",
      color: "#ef4444",
      bg: "#ef444415",
      border: "#ef444440",
    };
  }

  if (isWrongType && !isTooShort) {
    return {
      status: "wrong_type",
      icon: "warn",
      title: `This does not look like a ${documentType}`,
      message: `The text found in this image does not match what a ${documentType} should contain. Please make sure you selected the correct document type, or re-upload the right file.`,
      color: "#f59e0b",
      bg: "#f59e0b15",
      border: "#f59e0b40",
      matched,
      keywords,
    };
  }

  if (isLowConfidence || isTooShort) {
    return {
      status: "blurry",
      icon: "warn",
      title: "Image is readable but quality is low",
      message: "Some text was found but the image is not sharp enough. Scholarship portals may reject a blurry scan. Retake the photo in natural light with all edges visible.",
      color: "#f59e0b",
      bg: "#f59e0b15",
      border: "#f59e0b40",
      matched,
    };
  }

  return {
    status: "ok",
    icon: "check",
    title: `This looks like a ${documentType} — readable enough for scholarship upload`,
    message: "The document is clear and the content matches. You can safely upload this to your Document Vault.",
    color: "#22c55e",
    bg: "#22c55e15",
    border: "#22c55e40",
    matched,
  };
}

export default function OcrAnalyzer() {
  const [docType, setDocType] = React.useState("Marksheet");
  const [file, setFile] = React.useState(null);
  const [check, setCheck] = React.useState(null); // result of readability check
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const fileRef = React.useRef(null);

  function reset() {
    setFile(null);
    setCheck(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleTypeChange(e) {
    setDocType(e.target.value);
    reset();
  }

  async function handleCheck() {
    if (!file) return;
    setLoading(true);
    setError("");
    setCheck(null);
    try {
      const data = await ocrApi.analyze(file);
      const result = data.result;
      const readability = checkReadability(
        result.extractedText || "",
        result.confidence || 0,
        docType
      );
      setCheck({ readability, result });
    } catch (err) {
      setError("Could not analyse the image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const r = check?.readability;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Document Readability Checker</p>
        <h2>Is this document good enough to upload?</h2>
        <p className="muted-text">
          Select the document type, upload a photo or scan, and we'll tell you if it's clear enough for a scholarship application.
        </p>
      </div>

      {/* Step 1 — Pick type + upload */}
      {!check && (
        <section className="panel" style={{ maxWidth: 560 }}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
              What document are you checking?
            </span>
            <select
              value={docType}
              onChange={handleTypeChange}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 15 }}
            >
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
              Upload a photo or scan of your {docType}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={e => { setFile(e.target.files?.[0] || null); setError(""); }}
            />
            {file && (
              <span style={{ display: "block", marginTop: 8, fontSize: 13, color: "var(--accent,#6366f1)", fontWeight: 600 }}>
                {file.name}
              </span>
            )}
          </label>

          {error && (
            <div className="form-alert error" style={{ marginBottom: 12 }}>{error}</div>
          )}

          <button
            className="primary-btn"
            onClick={handleCheck}
            disabled={!file || loading}
            style={{ width: "100%" }}
          >
            {loading
              ? <><RefreshCw size={15} style={{ marginRight: 8, animation: "spin 1s linear infinite" }} />Checking document...</>
              : <><FileSearch size={15} style={{ marginRight: 8 }} />Check this document</>
            }
          </button>
        </section>
      )}

      {/* Step 2 — Result */}
      {check && r && (
        <section style={{ maxWidth: 600 }}>
          {/* Main result banner */}
          <div style={{
            background: r.bg,
            border: `2px solid ${r.border}`,
            borderRadius: 14,
            padding: "24px 28px",
            marginBottom: 20,
            display: "flex",
            gap: 18,
            alignItems: "flex-start"
          }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              {r.icon === "check" && <CheckCircle2 size={36} style={{ color: r.color }} />}
              {r.icon === "warn" && <AlertTriangle size={36} style={{ color: r.color }} />}
              {r.icon === "x" && <XCircle size={36} style={{ color: r.color }} />}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 17, color: r.color, marginBottom: 6 }}>
                {r.title}
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary,#f0f0f0)" }}>
                {r.message}
              </p>
            </div>
          </div>

          {/* What we found inside */}
          {r.matched && r.matched.length > 0 && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 10 }}>Keywords found in this document:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {r.matched.map(k => (
                  <span key={k} style={{
                    background: "#22c55e20", border: "1px solid #22c55e50",
                    color: "#22c55e", borderRadius: 20, padding: "3px 12px", fontSize: 13, fontWeight: 600
                  }}>
                    ✓ {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What to fix — only for warn/error states */}
          {r.status !== "ok" && (
            <div className="panel" style={{ marginBottom: 16, background: "#f59e0b08", border: "1px solid #f59e0b30" }}>
              <p style={{ fontWeight: 600, marginBottom: 10 }}>How to fix this:</p>
              <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2, fontSize: 14 }}>
                {r.status === "unreadable" && <>
                  <li>Take the photo in a brightly lit room (near a window works well)</li>
                  <li>Keep your phone steady — use both hands or rest it on a surface</li>
                  <li>Make sure all 4 corners of the document are visible</li>
                  <li>Avoid flash glare — use natural light instead</li>
                </>}
                {r.status === "blurry" && <>
                  <li>Retake in better lighting — avoid shadows on the document</li>
                  <li>Hold phone at least 20 cm above the document</li>
                  <li>Make sure the text is in focus before tapping the shutter</li>
                </>}
                {r.status === "wrong_type" && <>
                  <li>Check that you selected the correct document type above</li>
                  <li>Make sure you uploaded the right file (not a photo or ID card)</li>
                  <li>If correct, the document may be damaged or unreadable — get a fresh copy</li>
                </>}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button className="secondary-btn" onClick={reset} style={{ flex: 1 }}>
              ← Check another document
            </button>
            {r.status === "ok" && (
              <a href="/document-vault" className="primary-btn" style={{ flex: 1, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
                <CheckCircle2 size={15} /> Upload to Vault
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
