import React from "react";
import { CheckCircle2, RefreshCw, XCircle, Upload, FileText, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { documentApi } from "../services/api.js";

const KEY_DOCS = [
  { type: "Aadhaar Card",        why: "Required for identity verification on all scholarship portals" },
  { type: "Bank Passbook",       why: "Required for scholarship money to reach your account" },
  { type: "Income Certificate",  why: "Proves your family income is within scholarship limit" },
  { type: "Marksheet",           why: "Proves your marks meet the scholarship requirement" },
  { type: "Caste Certificate",   why: "Required for SC/ST/OBC/Minority scholarship benefits" }
];

function humaniseRisk(risk) {
  const map = {
    "Name: Aadhaar ↔ Bank Passbook": {
      title: "Your name in Aadhaar and Bank Passbook are different",
      why: "Scholarship money is sent directly to your bank. If the name doesn't match Aadhaar, the bank rejects the payment and your money comes back.",
      fix: "Go to your bank branch with your original Aadhaar. Ask them to update the name in your account to match exactly what is written on Aadhaar."
    },
    "Name: Aadhaar ↔ Income Certificate": {
      title: "Your name in Aadhaar and Income Certificate are different",
      why: "Your college checks that all documents have the same name. A mismatch causes rejection at the college verification stage.",
      fix: "Get a new income certificate from your Tahsildar office with the name spelled exactly as it appears on your Aadhaar card."
    },
    "Date of Birth: Aadhaar ↔ Marksheet": {
      title: "Your date of birth in Aadhaar and Marksheet are different",
      why: "If date of birth is different in two documents, the portal treats it as a fraud attempt and rejects the application automatically.",
      fix: "Find out which document has the correct date. If Aadhaar is wrong, apply for correction at your nearest Aadhaar centre."
    },
    "Income Certificate Expired": {
      title: "Your Income Certificate is more than 1 year old",
      why: "Income certificates are valid for only 1 year. The scholarship portal automatically rejects any certificate older than that — no exceptions.",
      fix: "Apply immediately for a fresh income certificate at your Tahsildar office. Carry your Aadhaar card, ration card, and old income certificate."
    },
    "IFSC Code Missing — Bank Passbook": {
      title: "IFSC code was not found in your Bank Passbook",
      why: "Without the IFSC code, the government payment system (PFMS) cannot transfer scholarship money to your account.",
      fix: "Upload the first/front page of your bank passbook where IFSC is clearly printed, or upload a bank statement that shows the IFSC code."
    },
    "Account Number Not Clear — Bank Passbook": {
      title: "Bank account number is not clearly visible",
      why: "The portal needs your full account number to send payment. If it cannot be read clearly, the payment will fail.",
      fix: "Take a new photo of your passbook in good lighting. Make sure the entire account number is fully visible and not cut off."
    },
    "Bank Passbook not uploaded": {
      title: "Bank Passbook is missing — upload it",
      why: "Without a bank passbook, scholarship money cannot be sent to you. This is mandatory for all portals.",
      fix: "Upload the first page of your bank passbook in Document Vault.",
      link: "/document-vault"
    },
    "Aadhaar Card not uploaded": {
      title: "Aadhaar Card is missing — upload it",
      why: "Aadhaar is the most important document. All name checks, identity verification, and bank linking require Aadhaar.",
      fix: "Upload a clear photo of your Aadhaar card (front side) in Document Vault.",
      link: "/document-vault"
    }
  };

  return map[risk.check] || {
    title: risk.check,
    why: risk.impact,
    fix: risk.action
  };
}

function readinessPercent(uploadedTypes, allRisks) {
  const uploaded = KEY_DOCS.filter(d => uploadedTypes.includes(d.type)).length;
  const docScore = Math.round((uploaded / KEY_DOCS.length) * 70);
  const criticalCount = allRisks.filter(r => r.severity === "Critical").length;
  const highCount = allRisks.filter(r => r.severity === "High" && r.status !== "MISSING").length;
  return Math.max(0, Math.min(100, docScore + 30 - criticalCount * 15 - highCount * 10));
}

function StatusBar({ percent }) {
  const color = percent >= 80 ? "#22c55e" : percent >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>
          {percent >= 80 ? "Almost ready to apply" : percent >= 50 ? "Getting there — fix the issues below" : "Not ready yet — action needed"}
        </span>
        <span style={{ fontSize: 18, fontWeight: 800, color }}>{percent}%</span>
      </div>
      <div style={{ height: 12, background: "rgba(0,0,0,0.2)", borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${percent}%`, background: color, borderRadius: 99, transition: "width .6s ease" }} />
      </div>
    </div>
  );
}

// ── Field row: clearly readable label + bold value ──
function FieldRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "flex-start" }}>
      <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 150, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: 700,
        color: highlight === "error" ? "#ef4444" : highlight === "warn" ? "#f59e0b" : "#f0f0f0"
      }}>
        {value}
      </span>
    </div>
  );
}

export default function RiskAnalyzer() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const navigate = useNavigate();

  function load() {
    setLoading(true); setError("");
    documentApi.riskReport()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }

  React.useEffect(() => { load(); }, []);

  const report   = data?.report;
  const uploaded = data?.uploadedTypes || [];
  const risks    = report?.risks || [];

  const missingDocs = KEY_DOCS.filter(d => !uploaded.includes(d.type));
  const missingRisks = missingDocs.map(d => ({
    severity: "High",
    status: "MISSING",
    check: `${d.type} not uploaded`,
    impact: d.why,
    action: `Upload your ${d.type} in Document Vault`,
    link: "/document-vault"
  }));

  const allActions = [
    ...risks.filter(r => r.severity === "Critical"),
    ...risks.filter(r => r.severity === "High" && r.status !== "MISSING"),
    ...missingRisks,
    ...risks.filter(r => r.severity === "Medium")
  ];

  const readiness = data ? readinessPercent(uploaded, allActions) : 0;
  const isReady = allActions.length === 0;
  const hasCritical = allActions.some(r => r.severity === "Critical");

  return (
    <div className="page-stack">

      {/* Header */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="eyebrow">Scholarship Health Check</p>
          <h2>Is your scholarship application ready?</h2>
          <p className="muted-text">We check your documents and tell you exactly what to fix before you apply.</p>
        </div>
        <button className="secondary-btn" onClick={load} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          {loading ? "Checking..." : "Re-check"}
        </button>
      </div>

      {error && <div className="form-alert error">{error}</div>}

      {loading && (
        <div className="panel" style={{ textAlign: "center", padding: 48 }}>
          <p className="muted-text">Checking your documents...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── Status banner ── */}
          <section className="panel" style={{
            borderLeft: `5px solid ${isReady ? "#22c55e" : hasCritical ? "#ef4444" : "#f59e0b"}`
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>
              Will my scholarship be rejected?
            </p>
            <h3 style={{
              fontSize: 22, fontWeight: 800, marginBottom: 8,
              color: isReady ? "#22c55e" : hasCritical ? "#ef4444" : "#f59e0b"
            }}>
              {isReady
                ? "✓ Your application looks good!"
                : hasCritical
                  ? `⚠ Yes — ${allActions.filter(r => r.severity === "Critical").length} critical issue${allActions.filter(r => r.severity === "Critical").length > 1 ? "s" : ""} will cause rejection`
                  : `⚠ Possibly — fix ${allActions.length} item${allActions.length > 1 ? "s" : ""} to be safe`
              }
            </h3>
            <p style={{ fontSize: 14, color: "#d1d5db", marginBottom: 16 }}>
              {isReady
                ? "All uploaded documents passed our checks."
                : `${allActions.length} item${allActions.length > 1 ? "s" : ""} need your attention. Follow the step-by-step guide below.`
              }
            </p>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Scholarship Readiness</p>
              <StatusBar percent={readiness} />
            </div>
          </section>

          {/* ── Document checklist ── */}
          <section className="panel">
            <h3 style={{ marginBottom: 4, fontSize: 18 }}>Required Documents</h3>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
              These 5 documents are required for most scholarships.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {KEY_DOCS.map(({ type, why }) => {
                const done = uploaded.includes(type);
                return (
                  <div key={type} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 10,
                    background: done ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
                    border: `1px solid ${done ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`
                  }}>
                    {done
                      ? <CheckCircle2 size={22} color="#22c55e" style={{ flexShrink: 0 }} />
                      : <XCircle     size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: "#f0f0f0", marginBottom: 2 }}>{type}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>{why}</p>
                    </div>
                    {done
                      ? <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", flexShrink: 0 }}>✓ Uploaded</span>
                      : (
                        <button onClick={() => navigate("/document-vault")} style={{
                          fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
                          background: "#ef4444", color: "#fff", border: "none",
                          cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 5
                        }}>
                          <Upload size={13} /> Upload
                        </button>
                      )
                    }
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── What OCR Read ── */}
          {data.documentDetails?.length > 0 && (
            <section className="panel">
              <h3 style={{ marginBottom: 4, fontSize: 18 }}>What We Read From Your Documents</h3>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
                These values are cross-checked. If anything looks wrong, re-upload a clearer photo.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.documentDetails.map((d, i) => {
                  const f = d.extractedFields;
                  const hasFields = f && Object.values(f).some(v => v !== null && v !== false);

                  if (!hasFields) {
                    return (
                      <div key={i} style={{
                        padding: "14px 16px", borderRadius: 10,
                        background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
                      }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: "#f0f0f0", marginBottom: 4 }}>{d.type}</p>
                          <p style={{ fontSize: 13, color: "#f59e0b" }}>
                            Fields could not be extracted. Delete this document and re-upload a clearer photo.
                          </p>
                        </div>
                        <button onClick={() => navigate("/document-vault")} style={{
                          fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
                          background: "#f59e0b", color: "#000", border: "none",
                          cursor: "pointer", flexShrink: 0
                        }}>
                          Re-upload
                        </button>
                      </div>
                    );
                  }

                  const rows = [];
                  if (d.type === "Aadhaar Card") {
                    if (f.name) rows.push({ label: "Name on Aadhaar", value: f.name });
                    if (f.dob)  rows.push({ label: "Date of Birth", value: f.dob });
                    rows.push({ label: "Aadhaar number visible", value: f.aadhaarVisible ? "Yes" : "Not detected", h: f.aadhaarVisible ? null : "warn" });
                  }
                  if (d.type === "Bank Passbook") {
                    if (f.accountHolderName) rows.push({ label: "Account Holder Name", value: f.accountHolderName });
                    if (f.ifscCode)          rows.push({ label: "IFSC Code", value: f.ifscCode });
                    if (f.accountNumber)     rows.push({ label: "Account Number", value: f.accountNumber });
                    if (f.bankName)          rows.push({ label: "Bank Name", value: f.bankName });
                  }
                  if (d.type === "Marksheet") {
                    if (f.fullName)               rows.push({ label: "Student Name", value: f.fullName });
                    if (f.marksPercentage != null) rows.push({ label: "Marks / Percentage", value: `${f.marksPercentage}%` });
                    if (f.dob)                    rows.push({ label: "Date of Birth", value: f.dob });
                    if (f.boardName)              rows.push({ label: "Board / University", value: f.boardName });
                    if (f.instituteName)          rows.push({ label: "School / College", value: f.instituteName });
                  }
                  if (d.type === "Income Certificate") {
                    if (f.applicantName)          rows.push({ label: "Name on Certificate", value: f.applicantName });
                    if (f.annualIncome != null)   rows.push({ label: "Annual Income", value: `₹ ${Number(f.annualIncome).toLocaleString("en-IN")}` });
                    if (f.issueDate)              rows.push({ label: "Issue Date", value: f.issueDate + (f.isExpired ? " — EXPIRED" : ""), h: f.isExpired ? "error" : null });
                    if (f.issuingAuthority)       rows.push({ label: "Issuing Authority", value: f.issuingAuthority });
                  }
                  if (d.type === "Caste Certificate") {
                    if (f.applicantName) rows.push({ label: "Name", value: f.applicantName });
                    if (f.category)      rows.push({ label: "Category", value: f.category });
                    if (f.issueDate)     rows.push({ label: "Issue Date", value: f.issueDate });
                  }

                  return (
                    <div key={i} style={{
                      padding: "16px 18px", borderRadius: 10,
                      background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <FileText size={18} color="#22c55e" />
                          <span style={{ fontWeight: 700, fontSize: 16, color: "#f0f0f0" }}>{d.type}</span>
                        </div>
                        {d.ocrConfidence != null && (
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                            background: "rgba(34,197,94,0.15)", color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.3)"
                          }}>
                            ✓ OCR Read {Math.round(d.ocrConfidence)}%
                          </span>
                        )}
                      </div>
                      {rows.length > 0 ? (
                        <div>
                          {rows.map(({ label, value, h }) => (
                            <FieldRow key={label} label={label} value={value} highlight={h} />
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: "#f59e0b" }}>
                          Document accepted but specific fields were not readable. Re-upload a clearer photo for better results.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Action plan ── */}
          {allActions.length > 0 && (
            <section className="panel">
              <h3 style={{ marginBottom: 4, fontSize: 18 }}>
                What You Need to Fix
                <span style={{
                  marginLeft: 10, fontSize: 12, fontWeight: 700, padding: "3px 12px",
                  borderRadius: 20, background: "rgba(239,68,68,0.15)", color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.3)", verticalAlign: "middle"
                }}>
                  {allActions.length} action{allActions.length > 1 ? "s" : ""} needed
                </span>
              </h3>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
                Fix these in order — start from number 1. Each one is important for getting your scholarship.
              </p>

              {allActions.map((risk, i) => {
                const h = humaniseRisk(risk);
                const isCritical = risk.severity === "Critical";
                const isMissing  = risk.status === "MISSING";
                const borderColor = isCritical ? "#ef4444" : isMissing ? "#6366f1" : "#f59e0b";
                const label       = isCritical ? "Fix immediately" : isMissing ? "Upload needed" : "Fix before applying";

                return (
                  <div key={i} style={{
                    borderLeft: `5px solid ${borderColor}`,
                    borderRadius: 10,
                    background: isCritical ? "rgba(239,68,68,0.07)" : isMissing ? "rgba(99,102,241,0.07)" : "rgba(245,158,11,0.07)",
                    border: `1px solid ${borderColor}30`,
                    borderLeftWidth: 5,
                    padding: "20px 20px 20px 18px",
                    marginBottom: 16
                  }}>
                    {/* Title row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                      <div style={{
                        minWidth: 32, height: 32, borderRadius: "50%",
                        background: borderColor, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 800, flexShrink: 0
                      }}>
                        {i + 1}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 16, color: "#f0f0f0", marginBottom: 6, lineHeight: 1.4 }}>{h.title}</p>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 10px",
                          borderRadius: 20, background: `${borderColor}20`, color: borderColor,
                          border: `1px solid ${borderColor}40`
                        }}>
                          {label}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginLeft: 44, display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Why it matters */}
                      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "12px 14px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>
                          Why this matters
                        </p>
                        <p style={{ fontSize: 14, color: "#e5e7eb", lineHeight: 1.7 }}>{h.why}</p>
                      </div>

                      {/* What to do */}
                      <div style={{ background: "rgba(34,197,94,0.08)", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>
                          What to do
                        </p>
                        <p style={{ fontSize: 14, color: "#e5e7eb", lineHeight: 1.7 }}>{h.fix}</p>
                      </div>

                      {/* Detected mismatch detail */}
                      {risk.detail && !isMissing && (
                        <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic", padding: "4px 0" }}>
                          Detected: {risk.detail}
                        </p>
                      )}

                      {/* Upload button for missing docs */}
                      {isMissing && (
                        <button onClick={() => navigate("/document-vault")} style={{
                          alignSelf: "flex-start", fontSize: 14, fontWeight: 700,
                          padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                          background: borderColor, color: "#fff", border: "none",
                          display: "flex", alignItems: "center", gap: 7
                        }}>
                          <Upload size={14} /> Upload {risk.check.replace(" not uploaded", "")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* ── All good ── */}
          {isReady && (
            <section className="panel" style={{ textAlign: "center", padding: "40px 24px" }}>
              <CheckCircle2 size={56} color="#22c55e" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: "#22c55e", marginBottom: 10, fontSize: 22 }}>All checks passed!</h3>
              <p style={{ fontSize: 15, color: "#d1d5db", maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
                Your uploaded documents passed all our checks. You can now apply for scholarships with confidence.
                Upload any missing documents to unlock even more checks.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
