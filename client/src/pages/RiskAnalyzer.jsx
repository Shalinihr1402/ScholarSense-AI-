import React from "react";
import { AlertCircle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { documentApi } from "../services/api.js";

const KEY_DOCS = [
  { type: "Aadhaar Card",        why: "Required for identity verification on all scholarship portals" },
  { type: "Bank Passbook",       why: "Required for scholarship money to reach your account" },
  { type: "Income Certificate",  why: "Proves your family income is within scholarship limit" },
  { type: "Marksheet",           why: "Proves your marks meet the scholarship requirement" },
  { type: "Caste Certificate",   why: "Required for SC/ST/OBC/Minority scholarship benefits" }
];

// Plain-language versions of technical risk messages
function humaniseRisk(risk) {
  const map = {
    "Name: Aadhaar ↔ Bank Passbook": {
      title: "Your name in Aadhaar and Bank Passbook are different",
      why: "Scholarship money is sent to your bank account. If the name doesn't match Aadhaar, the bank will reject the payment and your money will come back.",
      do: "Go to your bank with your original Aadhaar card. Ask them to update the name in your bank account to exactly match your Aadhaar."
    },
    "Name: Aadhaar ↔ Income Certificate": {
      title: "Your name in Aadhaar and Income Certificate are different",
      why: "Your college checks that all documents have the same name. A mismatch will cause your application to be rejected at the college level.",
      do: "Get a new income certificate from your Tahsildar office. Make sure the name is spelled exactly as it appears on your Aadhaar."
    },
    "Date of Birth: Aadhaar ↔ Marksheet": {
      title: "Your date of birth in Aadhaar and Marksheet are different",
      why: "If your date of birth is different in two documents, the portal treats it as fraud and rejects the application automatically.",
      do: "Check which document has the correct date of birth. Apply for a correction at your nearest Aadhaar centre if Aadhaar is wrong."
    },
    "Income Certificate Expired": {
      title: "Your Income Certificate is more than 1 year old",
      why: "Income certificates are only valid for 1 year. The scholarship portal automatically rejects old certificates — no matter how good your other documents are.",
      do: "Apply for a fresh income certificate from your Tahsildar office right away. Carry your Aadhaar, ration card, and old income certificate."
    },
    "IFSC Code Missing — Bank Passbook": {
      title: "IFSC code not found in your Bank Passbook",
      why: "Without the IFSC code, the government system (PFMS) cannot transfer scholarship money to your account.",
      do: "Upload the first page of your bank passbook where the IFSC code is printed. Or get a bank statement that shows IFSC clearly."
    },
    "Account Number Not Clear — Bank Passbook": {
      title: "Bank account number is not clearly visible",
      why: "The portal needs your account number to send payment. If it cannot read it, your payment will fail.",
      do: "Take a clearer photo of your passbook page in good lighting. Make sure the account number is fully visible."
    },
    "Bank Passbook not uploaded": {
      title: "Bank Passbook not uploaded yet",
      why: "Without a bank passbook, we cannot check if your account details are correct. Scholarship money goes directly to your bank — any error here means you won't receive it.",
      do: "Upload the first page of your bank passbook in Document Vault."
    },
    "Aadhaar Card not uploaded": {
      title: "Aadhaar Card not uploaded yet",
      why: "Aadhaar is the most important document for scholarship verification. All name checks and bank linking require Aadhaar.",
      do: "Upload a clear photo of your Aadhaar card (front side) in Document Vault."
    }
  };

  return map[risk.check] || {
    title: risk.check,
    why: risk.impact,
    do: risk.action
  };
}

function readinessPercent(uploadedTypes, risks) {
  const uploaded = KEY_DOCS.filter(d => uploadedTypes.includes(d.type)).length;
  const docScore = Math.round((uploaded / KEY_DOCS.length) * 70); // 70% weight on documents
  const criticalCount = risks.filter(r => r.severity === "Critical").length;
  const highCount = risks.filter(r => r.severity === "High" && r.status !== "MISSING").length;
  const riskDeduction = criticalCount * 15 + highCount * 10;
  return Math.max(0, Math.min(100, docScore + 30 - riskDeduction)); // base 30 for being logged in
}

function StatusBar({ percent }) {
  const color = percent >= 80 ? "#22c55e" : percent >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>
          {percent >= 80 ? "Almost ready to apply" : percent >= 50 ? "Getting there — fix the issues below" : "Not ready yet — action needed"}
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color }}>{percent}%</span>
      </div>
      <div style={{ height: 10, background: "#1e2130", borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${percent}%`, background: color, borderRadius: 99, transition: "width .6s ease" }} />
      </div>
    </div>
  );
}

export default function RiskAnalyzer() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  function load() {
    setLoading(true); setError("");
    documentApi.riskReport()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }

  React.useEffect(() => { load(); }, []);

  const report   = data?.report;
  const uploaded = data?.uploadedTypes || [];
  const missing  = KEY_DOCS.filter(d => !uploaded.includes(d.type));
  const present  = KEY_DOCS.filter(d => uploaded.includes(d.type));
  const risks    = report?.risks || [];
  const readiness = data ? readinessPercent(uploaded, risks) : 0;

  // Sort: Critical first, then High, then MISSING
  const sortedRisks = [...risks].sort((a, b) => {
    const order = { Critical: 0, High: 1, Medium: 2, MISSING: 3 };
    const sa = a.status === "MISSING" ? "MISSING" : a.severity;
    const sb = b.status === "MISSING" ? "MISSING" : b.severity;
    return (order[sa] ?? 4) - (order[sb] ?? 4);
  });

  const isReady = risks.filter(r => r.severity === "Critical" || r.severity === "High").length === 0 && missing.length === 0;

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
          {/* ── Section 1: Will my scholarship be rejected? ── */}
          <section className="panel" style={{
            borderLeft: `4px solid ${isReady ? "#22c55e" : risks.some(r => r.severity === "Critical") ? "#ef4444" : "#f59e0b"}`
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary,#8a8a9a)", marginBottom: 6 }}>
              WILL MY SCHOLARSHIP BE REJECTED?
            </p>
            <h3 style={{
              fontSize: 20, fontWeight: 800, marginBottom: 8,
              color: isReady ? "#22c55e" : risks.some(r => r.severity === "Critical") ? "#ef4444" : "#f59e0b"
            }}>
              {isReady
                ? "✓ Your application looks good!"
                : risks.some(r => r.severity === "Critical")
                  ? `⚠ Yes — ${risks.filter(r => r.severity === "Critical").length} critical issue${risks.filter(r => r.severity === "Critical").length > 1 ? "s" : ""} will cause rejection`
                  : `⚠ Possibly — fix ${sortedRisks.length} issue${sortedRisks.length > 1 ? "s" : ""} to be safe`
              }
            </h3>
            <p className="muted-text" style={{ fontSize: 13, marginBottom: 16 }}>
              {isReady
                ? "All uploaded documents passed our checks. Upload any missing documents to complete your profile."
                : `Your application has ${sortedRisks.length} issue${sortedRisks.length > 1 ? "s" : ""} that need to be fixed. See the step-by-step guide below.`
              }
            </p>

            {/* Scholarship Readiness bar */}
            <div>
              <p style={{ fontSize: 12, color: "var(--text-secondary,#8a8a9a)", marginBottom: 2 }}>
                Scholarship Readiness
              </p>
              <StatusBar percent={readiness} />
            </div>
          </section>

          {/* ── Section 2: Document checklist ── */}
          <section className="panel">
            <h3 style={{ marginBottom: 4 }}>Required Documents</h3>
            <p className="muted-text" style={{ fontSize: 12, marginBottom: 16 }}>
              These 5 documents are needed for most scholarships. Upload any missing ones in Document Vault.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {KEY_DOCS.map(({ type, why }) => {
                const done = uploaded.includes(type);
                return (
                  <div key={type} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 14px", borderRadius: 8,
                    background: done ? "#22c55e0d" : "#ef44440d",
                    border: `1px solid ${done ? "#22c55e30" : "#ef444430"}`
                  }}>
                    {done
                      ? <CheckCircle2 size={20} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                      : <XCircle     size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                    }
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>
                        {done ? "✓ " : "✗ "}{type} {done ? <span style={{ color: "#22c55e", fontSize: 11 }}>Uploaded</span> : <span style={{ color: "#ef4444", fontSize: 11 }}>Missing</span>}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-secondary,#8a8a9a)", marginTop: 2 }}>{why}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Section 3: What to fix — numbered action plan ── */}
          {sortedRisks.length > 0 && (
            <section className="panel">
              <h3 style={{ marginBottom: 4 }}>
                What You Need to Fix
                <span style={{
                  marginLeft: 10, fontSize: 11, fontWeight: 700, padding: "2px 10px",
                  borderRadius: 10, background: "#ef444420", color: "#ef4444", border: "1px solid #ef444430"
                }}>
                  {sortedRisks.length} action{sortedRisks.length > 1 ? "s" : ""} needed
                </span>
              </h3>
              <p className="muted-text" style={{ fontSize: 12, marginBottom: 16 }}>
                Fix these in order — start from the top. Each one is important.
              </p>

              {sortedRisks.map((risk, i) => {
                const h = humaniseRisk(risk);
                const isCritical = risk.severity === "Critical";
                const isMissing  = risk.status === "MISSING";
                const borderColor = isCritical ? "#ef4444" : isMissing ? "#8a8a9a" : "#f59e0b";
                const bgColor     = isCritical ? "#ef444410" : isMissing ? "#8a8a9a10" : "#f59e0b10";
                const label       = isCritical ? "Fix immediately" : isMissing ? "Upload needed" : "Fix before applying";
                const labelColor  = isCritical ? "#ef4444" : isMissing ? "#8a8a9a" : "#f59e0b";

                return (
                  <div key={i} style={{
                    border: `1px solid ${borderColor}40`,
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius: 8, background: bgColor,
                    padding: "16px 18px", marginBottom: 14
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: borderColor, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800, flexShrink: 0
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary,#f0f0f0)" }}>
                          {h.title}
                        </span>
                        <span style={{
                          marginLeft: 10, fontSize: 10, fontWeight: 700, padding: "1px 7px",
                          borderRadius: 8, background: `${borderColor}20`, color: labelColor,
                          border: `1px solid ${borderColor}40`
                        }}>
                          {label}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginLeft: 36 }}>
                      <div style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary,#8a8a9a)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>
                          Why this matters
                        </p>
                        <p style={{ fontSize: 13, color: "var(--text-primary,#e0e0e0)", lineHeight: 1.6 }}>{h.why}</p>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "10px 14px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>
                          What to do
                        </p>
                        <p style={{ fontSize: 13, color: "var(--text-primary,#e0e0e0)", lineHeight: 1.6 }}>{h.do}</p>
                      </div>

                      {/* Show detected values for mismatch issues */}
                      {risk.detail && !isMissing && (
                        <p style={{ fontSize: 11, color: "var(--text-secondary,#8a8a9a)", marginTop: 8, fontStyle: "italic" }}>
                          Detected: {risk.detail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* ── Section 4: All good state ── */}
          {isReady && (
            <section className="panel" style={{ textAlign: "center", padding: "36px 24px" }}>
              <CheckCircle2 size={52} color="#22c55e" style={{ margin: "0 auto 14px" }} />
              <h3 style={{ color: "#22c55e", marginBottom: 8 }}>All checks passed!</h3>
              <p className="muted-text" style={{ maxWidth: 420, margin: "0 auto" }}>
                Your uploaded documents passed all our checks. You can now apply for scholarships with confidence.
                Upload any missing documents to unlock even more checks.
              </p>
            </section>
          )}

          {/* ── Section 5: What OCR found — collapsed detail ── */}
          {data.documentDetails?.some(d => d.extractedFields) && (
            <ExtractedSummary details={data.documentDetails} />
          )}
        </>
      )}
    </div>
  );
}

function ExtractedSummary({ details }) {
  const [open, setOpen] = React.useState(false);
  const filled = details.filter(d => d.extractedFields);

  return (
    <section className="panel">
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          width: "100%", color: "var(--text-primary,#f0f0f0)"
        }}
      >
        <div>
          <h3 style={{ marginBottom: 2 }}>What we read from your documents</h3>
          <p style={{ fontSize: 12, color: "var(--text-secondary,#8a8a9a)" }}>
            Values extracted by OCR — review these to make sure they are correct
          </p>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-secondary,#8a8a9a)" }}>{open ? "▲ Hide" : "▼ Show"}</span>
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          {filled.map(detail => {
            const f = detail.extractedFields;
            const rows = [];

            if (detail.type === "Aadhaar Card") {
              if (f.name) rows.push(["Name on Aadhaar", f.name]);
              if (f.dob)  rows.push(["Date of birth", f.dob]);
              rows.push(["Aadhaar number visible", f.aadhaarVisible ? "Yes" : "Not detected"]);
            }
            if (detail.type === "Bank Passbook") {
              if (f.accountHolderName) rows.push(["Account holder name", f.accountHolderName]);
              if (f.ifscCode)          rows.push(["IFSC code", f.ifscCode]);
              if (f.accountNumber)     rows.push(["Account number", f.accountNumber]);
              if (f.bankName)          rows.push(["Bank", f.bankName]);
            }
            if (detail.type === "Income Certificate") {
              if (f.applicantName) rows.push(["Name on certificate", f.applicantName]);
              if (f.annualIncome != null) rows.push(["Annual income", `₹ ${Number(f.annualIncome).toLocaleString("en-IN")}`]);
              if (f.issueDate)     rows.push(["Issue date", `${f.issueDate}${f.isExpired ? " ⚠ EXPIRED" : ""}`]);
            }
            if (detail.type === "Marksheet") {
              if (f.fullName)          rows.push(["Student name", f.fullName]);
              if (f.marksPercentage != null) rows.push(["Marks %", `${f.marksPercentage}%`]);
              if (f.dob)               rows.push(["DOB on marksheet", f.dob]);
              if (f.boardName)         rows.push(["Board / University", f.boardName]);
            }
            if (detail.type === "Caste Certificate") {
              if (f.applicantName) rows.push(["Name", f.applicantName]);
              if (f.category)      rows.push(["Category", f.category]);
              if (f.issueDate)     rows.push(["Issue date", f.issueDate]);
            }

            if (!rows.length) return null;

            return (
              <div key={detail.type} style={{
                background: "var(--surface,#1a1d27)", borderRadius: 8,
                padding: "12px 14px", marginBottom: 10
              }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                  {detail.type}
                  {detail.ocrConfidence != null && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: "var(--text-secondary,#8a8a9a)", fontWeight: 400 }}>
                      OCR confidence: {Math.round(detail.ocrConfidence)}%
                    </span>
                  )}
                </p>
                {rows.map(([label, value]) => (
                  <div key={label} style={{ display: "flex", gap: 10, fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary,#8a8a9a)", minWidth: 160 }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: "var(--text-secondary,#8a8a9a)", marginTop: 6 }}>
                  If any value above looks wrong, the document photo may be unclear. Re-upload a better photo.
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
