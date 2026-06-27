import React from "react";
import {
  CheckCircle2, RefreshCw, XCircle, Upload, FileText,
  AlertTriangle, ShieldCheck, Sparkles, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { documentApi } from "../services/api.js";

const KEY_DOCS = [
  { type: "Aadhaar Card",       why: "Required for identity verification on all scholarship portals" },
  { type: "Bank Passbook",      why: "Required for scholarship money to reach your account" },
  { type: "Income Certificate", why: "Proves your family income is within scholarship limit" },
  { type: "Marksheet",          why: "Proves your marks meet the scholarship requirement" },
  { type: "Caste Certificate",  why: "Required for SC/ST/OBC/Minority scholarship benefits" }
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
  return map[risk.check] || { title: risk.check, why: risk.impact, fix: risk.action };
}

function readinessPercent(uploadedTypes, allRisks) {
  const uploaded = KEY_DOCS.filter(d => uploadedTypes.includes(d.type)).length;
  const docScore = Math.round((uploaded / KEY_DOCS.length) * 70);
  const criticalCount = allRisks.filter(r => r.severity === "Critical").length;
  const highCount = allRisks.filter(r => r.severity === "High" && r.status !== "MISSING").length;
  return Math.max(0, Math.min(100, docScore + 30 - criticalCount * 15 - highCount * 10));
}

function StatusBar({ percent }) {
  const barColor = percent >= 80
    ? "linear-gradient(90deg,#0d9488,#22c55e)"
    : percent >= 50
    ? "linear-gradient(90deg,#2563eb,#0891b2)"
    : "linear-gradient(90deg,#dc2626,#f97316)";
  const textColor = percent >= 80 ? "#0d9488" : percent >= 50 ? "#2563eb" : "#dc2626";
  const label = percent >= 80 ? "Almost ready to apply" : percent >= 50 ? "Getting there — fix the issues below" : "Not ready yet — action needed";

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: textColor }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: textColor }}>{percent}%</span>
      </div>
      <div style={{ height: 10, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${percent}%`, background: barColor, borderRadius: 99, transition: "width .7s ease" }} />
      </div>
    </div>
  );
}

function FieldRow({ label, value, highlight }) {
  const color = highlight === "error" ? "#dc2626" : highlight === "warn" ? "#d97706" : "#1e293b";
  const bg = highlight === "error" ? "#fef2f2" : highlight === "warn" ? "#fffbeb" : "transparent";
  return (
    <div style={{
      display: "flex", gap: 12, padding: "8px 10px", borderRadius: 8,
      alignItems: "flex-start", background: bg, marginBottom: 2
    }}>
      <span style={{ fontSize: 13, color: "#64748b", minWidth: 160, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color, lineHeight: 1.4 }}>{value}</span>
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
    severity: "High", status: "MISSING",
    check: `${d.type} not uploaded`, impact: d.why,
    action: `Upload your ${d.type} in Document Vault`, link: "/document-vault"
  }));

  const allActions = [
    ...risks.filter(r => r.severity === "Critical"),
    ...risks.filter(r => r.severity === "High" && r.status !== "MISSING"),
    ...missingRisks,
    ...risks.filter(r => r.severity === "Medium")
  ];

  const readiness  = data ? readinessPercent(uploaded, allActions) : 0;
  const isReady    = allActions.length === 0;
  const hasCritical = allActions.some(r => r.severity === "Critical");

  return (
    <div className="page-stack">

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#0d9488", margin: "0 0 6px" }}>
            Scholarship Health Check
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-.02em" }}>
            Is your scholarship application ready?
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            We check your documents and tell you exactly what to fix before you apply.
          </p>
        </div>
        <button onClick={load} disabled={loading} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0",
          background: "white", color: "#475569", fontWeight: 700, fontSize: 13.5,
          cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginTop: 6,
          transition: "all .15s"
        }}>
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          {loading ? "Checking…" : "Re-check"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ background: "white", borderRadius: 16, padding: 48, textAlign: "center", boxShadow: "0 2px 12px rgba(15,23,42,.07)" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Checking your documents…</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── Status Banner ── */}
          <div style={{
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 2px 16px rgba(15,23,42,.08)",
            border: `1.5px solid ${isReady ? "#bbf7d0" : hasCritical ? "#fecdd3" : "#bfdbfe"}`
          }}>
            {/* Top color stripe */}
            <div style={{
              height: 5,
              background: isReady
                ? "linear-gradient(90deg,#0d9488,#22c55e)"
                : hasCritical
                ? "linear-gradient(90deg,#dc2626,#f97316)"
                : "linear-gradient(90deg,#2563eb,#0891b2)"
            }} />

            <div style={{ padding: "22px 24px", background: "white" }}>
              <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px" }}>
                Will my scholarship be rejected?
              </p>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: isReady ? "#f0fdf4" : hasCritical ? "#fef2f2" : "#eff6ff",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {isReady
                    ? <ShieldCheck size={22} color="#16a34a" />
                    : hasCritical
                    ? <AlertTriangle size={22} color="#dc2626" />
                    : <AlertTriangle size={22} color="#2563eb" />
                  }
                </div>
                <div>
                  <h3 style={{
                    fontSize: 20, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-.01em",
                    color: isReady ? "#16a34a" : hasCritical ? "#dc2626" : "#2563eb"
                  }}>
                    {isReady
                      ? "Your application looks good!"
                      : hasCritical
                      ? `Yes — ${allActions.filter(r => r.severity === "Critical").length} critical issue${allActions.filter(r => r.severity === "Critical").length > 1 ? "s" : ""} will cause rejection`
                      : `Possibly — fix ${allActions.length} item${allActions.length > 1 ? "s" : ""} to be safe`
                    }
                  </h3>
                  <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
                    {isReady
                      ? "All uploaded documents passed our checks."
                      : `${allActions.length} item${allActions.length > 1 ? "s" : ""} need your attention. Follow the step-by-step guide below.`
                    }
                  </p>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Scholarship Readiness</p>
                <StatusBar percent={readiness} />
              </div>
            </div>
          </div>

          {/* ── Required Documents ── */}
          <div style={{ background: "white", borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 12px rgba(15,23,42,.07)", border: "1px solid #f1f5f9" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Required Documents</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>
              These 5 documents are required for most scholarships.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {KEY_DOCS.map(({ type, why }) => {
                const done = uploaded.includes(type);
                return (
                  <div key={type} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "13px 16px", borderRadius: 12,
                    background: done ? "#f0fdf4" : "#fef2f2",
                    border: `1.5px solid ${done ? "#bbf7d0" : "#fecdd3"}`
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: done ? "#dcfce7" : "#fee2e2",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {done
                        ? <CheckCircle2 size={18} color="#16a34a" />
                        : <XCircle     size={18} color="#dc2626" />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", margin: "0 0 2px" }}>{type}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{why}</p>
                    </div>
                    {done
                      ? <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", background: "#dcfce7", padding: "4px 12px", borderRadius: 20, flexShrink: 0 }}>✓ Uploaded</span>
                      : (
                        <button onClick={() => navigate("/document-vault")} style={{
                          fontSize: 12.5, fontWeight: 800, padding: "7px 14px", borderRadius: 9,
                          background: "linear-gradient(135deg,#dc2626,#ef4444)",
                          color: "#fff", border: "none", cursor: "pointer", flexShrink: 0,
                          display: "flex", alignItems: "center", gap: 5,
                          boxShadow: "0 2px 8px rgba(220,38,38,.3)"
                        }}>
                          <Upload size={12} /> Upload
                        </button>
                      )
                    }
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── What OCR Read ── */}
          {data.documentDetails?.length > 0 && (
            <div style={{ background: "white", borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 12px rgba(15,23,42,.07)", border: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>What We Read From Your Documents</h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>
                These values are cross-checked. If anything looks wrong, re-upload a clearer photo.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {data.documentDetails.map((d, i) => {
                  const f = d.extractedFields;
                  const hasFields = f && Object.values(f).some(v => v !== null && v !== false);

                  if (!hasFields) {
                    return (
                      <div key={i} style={{
                        padding: "16px 18px", borderRadius: 12,
                        background: "#fffbeb", border: "1.5px solid #fde68a",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
                      }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14.5, color: "#0f172a", margin: "0 0 4px" }}>{d.type}</p>
                          <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
                            Fields could not be extracted. Delete this document and re-upload a clearer photo.
                          </p>
                        </div>
                        <button onClick={() => navigate("/document-vault")} style={{
                          fontSize: 13, fontWeight: 800, padding: "8px 16px", borderRadius: 9,
                          background: "#f59e0b", color: "#fff", border: "none",
                          cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 8px rgba(245,158,11,.3)"
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
                    if (f.applicantName)        rows.push({ label: "Name on Certificate", value: f.applicantName });
                    if (f.annualIncome != null) rows.push({ label: "Annual Income", value: `₹ ${Number(f.annualIncome).toLocaleString("en-IN")}` });
                    if (f.issueDate)            rows.push({ label: "Issue Date", value: f.issueDate + (f.isExpired ? " — EXPIRED" : ""), h: f.isExpired ? "error" : null });
                    if (f.issuingAuthority)     rows.push({ label: "Issuing Authority", value: f.issuingAuthority });
                  }
                  if (d.type === "Caste Certificate") {
                    if (f.applicantName) rows.push({ label: "Name", value: f.applicantName });
                    if (f.category)      rows.push({ label: "Category", value: f.category });
                    if (f.issueDate)     rows.push({ label: "Issue Date", value: f.issueDate });
                  }

                  return (
                    <div key={i} style={{
                      padding: "16px 18px", borderRadius: 12,
                      background: "#f8fafc", border: "1.5px solid #e2e8f0"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: "linear-gradient(135deg,#eff6ff,#e0f2fe)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: "1px solid #bfdbfe"
                          }}>
                            <FileText size={16} color="#2563eb" />
                          </div>
                          <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{d.type}</span>
                        </div>
                        {d.ocrConfidence != null && (
                          <span style={{
                            fontSize: 11.5, fontWeight: 800, padding: "4px 12px", borderRadius: 20,
                            background: "#f0fdf4", color: "#16a34a",
                            border: "1.5px solid #bbf7d0"
                          }}>
                            ✓ OCR Read {Math.round(d.ocrConfidence)}%
                          </span>
                        )}
                      </div>
                      {rows.length > 0
                        ? <div style={{ background: "white", borderRadius: 10, padding: "6px 8px", border: "1px solid #f1f5f9" }}>
                            {rows.map(({ label, value, h }) => (
                              <FieldRow key={label} label={label} value={value} highlight={h} />
                            ))}
                          </div>
                        : <p style={{ fontSize: 13, color: "#d97706", margin: 0 }}>
                            Document accepted but specific fields were not readable. Re-upload a clearer photo for better results.
                          </p>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Action Plan ── */}
          {allActions.length > 0 && (
            <div style={{ background: "white", borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 12px rgba(15,23,42,.07)", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>What You Need to Fix</h3>
                <span style={{
                  fontSize: 11.5, fontWeight: 800, padding: "3px 12px",
                  borderRadius: 20, background: "#fef2f2", color: "#dc2626",
                  border: "1.5px solid #fecdd3"
                }}>
                  {allActions.length} action{allActions.length > 1 ? "s" : ""} needed
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
                Fix these in order — start from number 1. Each one is important for getting your scholarship.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {allActions.map((risk, i) => {
                  const h = humaniseRisk(risk);
                  const isCritical = risk.severity === "Critical";
                  const isMissing  = risk.status === "MISSING";

                  const accent = isCritical ? "#dc2626" : isMissing ? "#7c3aed" : "#2563eb";
                  const accentBg = isCritical ? "#fef2f2" : isMissing ? "#f5f3ff" : "#eff6ff";
                  const accentBorder = isCritical ? "#fecdd3" : isMissing ? "#ddd6fe" : "#bfdbfe";
                  const label = isCritical ? "Fix immediately" : isMissing ? "Upload needed" : "Fix before applying";

                  return (
                    <div key={i} style={{
                      borderRadius: 14, overflow: "hidden",
                      border: `1.5px solid ${accentBorder}`,
                      boxShadow: "0 2px 8px rgba(15,23,42,.05)"
                    }}>
                      {/* Colored top stripe */}
                      <div style={{ height: 4, background: accent }} />

                      <div style={{ padding: "18px 20px", background: accentBg }}>
                        {/* Number + title row */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                          <div style={{
                            minWidth: 34, height: 34, borderRadius: 10,
                            background: accent, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 900, flexShrink: 0,
                            boxShadow: `0 3px 10px ${accent}40`
                          }}>
                            {i + 1}
                          </div>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.4 }}>
                              {h.title}
                            </p>
                            <span style={{
                              fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                              background: "white", color: accent, border: `1.5px solid ${accentBorder}`
                            }}>
                              {label}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginLeft: 48, display: "flex", flexDirection: "column", gap: 10 }}>
                          {/* Why it matters */}
                          <div style={{ background: "white", borderRadius: 10, padding: "12px 14px", border: `1px solid ${accentBorder}` }}>
                            <p style={{ fontSize: 10.5, fontWeight: 800, color: "#94a3b8", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".09em" }}>
                              Why this matters
                            </p>
                            <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.7, margin: 0 }}>{h.why}</p>
                          </div>

                          {/* What to do */}
                          <div style={{ background: "white", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                            <p style={{ fontSize: 10.5, fontWeight: 800, color: "#0d9488", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".09em" }}>
                              What to do
                            </p>
                            <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.7, margin: 0 }}>{h.fix}</p>
                          </div>

                          {/* Detected mismatch */}
                          {risk.detail && !isMissing && (
                            <p style={{ fontSize: 12.5, color: "#64748b", fontStyle: "italic", margin: 0 }}>
                              Detected: {risk.detail}
                            </p>
                          )}

                          {/* Upload button */}
                          {isMissing && (
                            <button onClick={() => navigate("/document-vault")} style={{
                              alignSelf: "flex-start", fontSize: 13.5, fontWeight: 800,
                              padding: "10px 20px", borderRadius: 10, cursor: "pointer",
                              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                              color: "#fff", border: "none",
                              display: "flex", alignItems: "center", gap: 8,
                              boxShadow: "0 3px 12px rgba(124,58,237,.3)"
                            }}>
                              <Upload size={14} /> Upload {risk.check.replace(" not uploaded", "")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── All good ── */}
          {isReady && (
            <div style={{
              background: "white", borderRadius: 16, padding: "44px 24px",
              textAlign: "center", boxShadow: "0 2px 12px rgba(15,23,42,.07)",
              border: "1.5px solid #bbf7d0"
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 18px",
                background: "linear-gradient(135deg,#dcfce7,#d1fae5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(22,163,74,.2)"
              }}>
                <ShieldCheck size={34} color="#16a34a" />
              </div>
              <h3 style={{ color: "#16a34a", marginBottom: 10, fontSize: 22, fontWeight: 900 }}>All checks passed!</h3>
              <p style={{ fontSize: 14.5, color: "#475569", maxWidth: 440, margin: "0 auto", lineHeight: 1.8 }}>
                Your uploaded documents passed all our checks. You can now apply for scholarships with confidence.
                Upload any missing documents to unlock even more checks.
              </p>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
