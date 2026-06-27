import React from "react";
import { AlertTriangle, CheckCircle2, FileText, Info, ShieldCheck, Trash2, Upload } from "lucide-react";
import { documentApi } from "../services/api.js";

const DOC_TYPES = [
  "Aadhaar Card",
  "Bank Passbook",
  "Income Certificate",
  "Caste Certificate",
  "Marksheet",
  "Bonafide Certificate",
  "Fee Receipt",
  "Other"
];

// What each document should visibly contain — shown in the confirmation step
const DOC_CHECKLIST = {
  "Aadhaar Card": {
    mustContain: [
      "Your full name exactly as in school/college records",
      "Your 12-digit Aadhaar number",
      "Your date of birth",
      "Your photo",
      "UIDAI / Government of India text",
    ],
    warning: "A selfie, PAN card, driving licence, or voter ID will NOT work here.",
  },
  "Bank Passbook": {
    mustContain: [
      "Your name as account holder",
      "Bank name and branch",
      "Account number (at least partial)",
      "IFSC code",
      "Passbook cover page or first page with your details",
    ],
    warning: "A bank statement printout without IFSC or account number will be rejected.",
  },
  "Income Certificate": {
    mustContain: [
      "Your family's annual income in rupees",
      "Issued by a Tahsildar, SDM, or government officer",
      "Applicant / guardian name",
      "Official seal and signature",
      "Issue date (must be recent — within 1–2 years)",
    ],
    warning: "Salary slip, Form 16, or IT return is NOT an income certificate.",
  },
  "Caste Certificate": {
    mustContain: [
      "Your name",
      "Caste / sub-caste name (SC / ST / OBC etc.)",
      "Issued by a Tahsildar or district authority",
      "Official seal and signature",
    ],
    warning: "A community letter from a local leader or temple is NOT a government caste certificate.",
  },
  "Marksheet": {
    mustContain: [
      "Your full name",
      "Board or university name",
      "Subject-wise marks or grades",
      "Total percentage or CGPA",
      "Year / semester",
    ],
    warning: "A hall ticket, admit card, result screenshot, or provisional certificate is NOT a marksheet.",
  },
  "Bonafide Certificate": {
    mustContain: [
      "Your name and roll number / USN",
      "Name of your college or institution",
      "Course and year of study",
      "Principal's signature and college seal",
    ],
    warning: "A fee receipt or ID card alone is NOT a bonafide certificate.",
  },
  "Fee Receipt": {
    mustContain: [
      "Your name",
      "College / institution name",
      "Tuition / hostel fees paid amount",
      "Academic year",
      "Receipt number and date",
    ],
    warning: "A challan number alone or a screenshot of payment without a college stamp is NOT accepted.",
  },
  "Other": {
    mustContain: ["Relevant personal or academic information as required by the scholarship"],
    warning: "Upload only documents specifically asked for by the scholarship you are applying to.",
  },
};

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

// Render extracted fields from OCR in a readable way
function ExtractedFields({ fields, docType }) {
  if (!fields) return null;

  const items = [];

  if (fields.name)              items.push({ label: "Name",            value: fields.name });
  if (fields.fullName)          items.push({ label: "Name",            value: fields.fullName });
  if (fields.accountHolderName) items.push({ label: "Account Holder",  value: fields.accountHolderName });
  if (fields.applicantName)     items.push({ label: "Applicant Name",  value: fields.applicantName });
  if (fields.dob)               items.push({ label: "Date of Birth",   value: fields.dob });
  if (fields.marksPercentage != null) items.push({ label: "Marks",     value: `${fields.marksPercentage}%` });
  if (fields.boardName)         items.push({ label: "Board",           value: fields.boardName });
  if (fields.instituteName)     items.push({ label: "College",         value: fields.instituteName });
  if (fields.ifscCode)          items.push({ label: "IFSC Code",       value: fields.ifscCode });
  if (fields.accountNumber)     items.push({ label: "Account No",      value: fields.accountNumber });
  if (fields.bankName)          items.push({ label: "Bank",            value: fields.bankName });
  if (fields.annualIncome)      items.push({ label: "Annual Income",   value: `₹${fields.annualIncome}` });
  if (fields.category)          items.push({ label: "Category",        value: fields.category });
  if (fields.issueDate)         items.push({ label: "Issue Date",      value: fields.issueDate });

  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: 8, background: "#22c55e10", border: "1px solid #22c55e30", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <CheckCircle2 size={12} /> OCR Read Successfully
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
        {items.map(item => (
          <span key={item.label} style={{ fontSize: 12 }}>
            <span style={{ color: "var(--text-muted,#9ca3af)" }}>{item.label}:</span>{" "}
            <strong>{item.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

// Step 1: Pick type + file  |  Step 2: Confirm checklist  |  Step 3: Uploading / result
export default function DocumentVault() {
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Upload flow state
  const [step, setStep] = React.useState(1); // 1 = pick, 2 = confirm
  const [selectedType, setSelectedType] = React.useState("Marksheet");
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [notice, setNotice] = React.useState({ type: "", msg: "" }); // type: "error" | "success" | "warn"

  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    documentApi.list()
      .then(data => setDocuments(data.documents || []))
      .catch(err => setNotice({ type: "error", msg: err.message }))
      .finally(() => setLoading(false));
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    setSelectedFile(file);
    setNotice({ type: "", msg: "" });
    if (file) setStep(2); // advance to confirmation
  }

  function handleTypeChange(e) {
    setSelectedType(e.target.value);
    setSelectedFile(null);
    setConfirmed(false);
    setStep(1);
    setNotice({ type: "", msg: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleBack() {
    setStep(1);
    setSelectedFile(null);
    setConfirmed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!selectedFile || !confirmed) return;
    setUploading(true);
    setNotice({ type: "", msg: "" });

    try {
      const result = await documentApi.upload(selectedFile, selectedType);

      if (result.duplicate) {
        const doc = result.document;
        setDocuments(prev => {
          const id = doc._id || doc.id;
          return prev.some(d => (d._id || d.id) === id) ? prev : [doc, ...prev];
        });
        setNotice({
          type: "warn",
          msg: `"${doc.originalName}" is already saved under "${doc.documentType}" (uploaded ${formatDate(doc.createdAt)}). No duplicate stored.`
        });
      } else {
        setDocuments(prev => [result.document, ...prev]);
        setNotice({ type: "success", msg: `"${selectedFile.name}" uploaded and secured in your vault.` });
      }

      setStep(1);
      setSelectedFile(null);
      setConfirmed(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      // Wrong document type — show prominent red block
      const msg = err.message?.includes("does not look like") || err.message?.includes("does not look like")
        ? err.message
        : err.message;
      setNotice({ type: "error", msg });
      // Keep step 2 open so student can go back and pick correct document
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await documentApi.remove(id);
      setDocuments(prev => prev.filter(d => (d._id || d.id) !== id));
    } catch (err) {
      setNotice({ type: "error", msg: err.message });
    }
  }

  const byType = DOC_TYPES.reduce((acc, type) => {
    acc[type] = documents.filter(d => d.documentType === type);
    return acc;
  }, {});

  const checklist = DOC_CHECKLIST[selectedType] || DOC_CHECKLIST["Other"];

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Module 1.3</p>
        <h2>Document Vault</h2>
        <p className="muted-text">Upload once, reuse forever. Every file is fingerprinted with SHA-256 to detect duplicates.</p>
      </div>

      <section className="stats-grid">
        <div className="stat-card blue">
          <p>Total documents</p>
          <strong>{documents.length}</strong>
          <span>Stored securely</span>
        </div>
        <div className="stat-card green">
          <p>Document types</p>
          <strong>{DOC_TYPES.filter(t => byType[t]?.length > 0).length} / {DOC_TYPES.length - 1}</strong>
          <span>Categories covered</span>
        </div>
        <div className="stat-card teal">
          <p>Deduplication</p>
          <strong>SHA-256</strong>
          <span>No duplicate files stored</span>
        </div>
      </section>

      {/* Upload section */}
      <section className="panel">
        <h3>Upload a document</h3>

        {/* Notice banner */}
        {notice.msg && (
          <div style={{
            marginBottom: 16,
            background: notice.type === "error" ? "#ef444418" : notice.type === "warn" ? "#f59e0b18" : "#22c55e18",
            border: `2px solid ${notice.type === "error" ? "#ef4444" : notice.type === "warn" ? "#f59e0b" : "#22c55e"}`,
            color: notice.type === "error" ? "#ef4444" : notice.type === "warn" ? "#f59e0b" : "#22c55e",
            borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12
          }}>
            {notice.type === "success"
              ? <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: 1 }} />
              : <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 1 }} />}
            <div>
              {notice.type === "error" && <p style={{ fontWeight: 700, marginBottom: 4 }}>❌ Wrong Document — Upload Rejected</p>}
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{notice.msg}</span>
              {notice.type === "error" && (
                <p style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                  Please go back, select the correct document type, and upload the right file.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Pick type and file */}
        {step === 1 && (
          <div className="form-grid two">
            <label>
              Document type
              <select value={selectedType} onChange={handleTypeChange}>
                {DOC_TYPES.filter(t => t !== "Other").map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Select file
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
              />
            </label>
            <p className="muted-text" style={{ fontSize: 12 }}>
              Accepted formats: JPEG, PNG, WebP, PDF · Max 10 MB · After selecting a file you will be asked to confirm the document.
            </p>
          </div>
        )}

        {/* STEP 2: Confirmation checklist */}
        {step === 2 && selectedFile && (
          <div>
            <div style={{
              background: "var(--surface-2,#1e2130)", borderRadius: 10, padding: "16px 20px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 12
            }}>
              <FileText size={22} style={{ color: "var(--accent,#6366f1)", flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block" }}>{selectedFile.name}</strong>
                <span className="muted-text" style={{ fontSize: 12 }}>{formatBytes(selectedFile.size)} · Selected for upload as: <strong>{selectedType}</strong></span>
              </div>
            </div>

            {/* What this document must contain */}
            <div style={{
              border: "1px solid #6366f130", borderRadius: 10, padding: "16px 20px", marginBottom: 16,
              background: "#6366f108"
            }}>
              <p style={{ fontWeight: 700, marginBottom: 10, color: "var(--text-primary,#f0f0f0)", display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={16} style={{ color: "#6366f1" }} />
                A valid <strong style={{ color: "#6366f1" }}>{selectedType}</strong> must contain all of the following:
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                {checklist.mustContain.map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14 }}>
                    <CheckCircle2 size={14} style={{ color: "#22c55e", flexShrink: 0, marginTop: 2 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div style={{
                marginTop: 14, background: "#f59e0b15", border: "1px solid #f59e0b40",
                borderRadius: 6, padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 8
              }}>
                <AlertTriangle size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "#f59e0b" }}>{checklist.warning}</span>
              </div>
            </div>

            {/* Confirmation checkbox */}
            <label style={{
              display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
              background: confirmed ? "#22c55e12" : "var(--surface-2,#1e2130)",
              border: `1px solid ${confirmed ? "#22c55e50" : "var(--border,#2d3244)"}`,
              borderRadius: 8, padding: "12px 16px", marginBottom: 20, transition: "all 0.2s"
            }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, cursor: "pointer", accentColor: "#22c55e" }}
              />
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>
                Yes, I have checked the file <strong>"{selectedFile.name}"</strong> and I confirm it is a valid <strong>{selectedType}</strong> that contains all the information listed above.
              </span>
            </label>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="secondary-btn"
                type="button"
                onClick={handleBack}
                disabled={uploading}
                style={{ flex: "0 0 auto" }}
              >
                ← Back
              </button>
              <button
                className="primary-btn"
                type="button"
                onClick={handleUpload}
                disabled={!confirmed || uploading}
                style={{ flex: 1, opacity: confirmed ? 1 : 0.5, cursor: confirmed ? "pointer" : "not-allowed" }}
              >
                {uploading
                  ? "Uploading & hashing..."
                  : <><Upload size={15} style={{ marginRight: 6 }} />Confirm &amp; Upload to Vault</>
                }
              </button>
            </div>
            {!confirmed && (
              <p className="muted-text" style={{ marginTop: 8, fontSize: 12, textAlign: "center" }}>
                Please check the box above to confirm before uploading.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Documents list */}
      <section className="panel">
        <h3>Your documents</h3>
        {loading && <p className="muted-text">Loading vault...</p>}
        {!loading && documents.length === 0 && (
          <p className="muted-text">No documents uploaded yet. Start by uploading your Aadhaar Card or Marksheet.</p>
        )}

        {DOC_TYPES.filter(t => byType[t]?.length > 0).map(type => (
          <div key={type} style={{ marginBottom: 24 }}>
            <p style={{ fontWeight: 600, marginBottom: 10, color: "var(--text-primary,#f0f0f0)" }}>{type}</p>
            {byType[type].map(doc => {
              const docId = doc._id || doc.id;
              return (
                <div key={docId} className="notification-item" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FileText size={20} style={{ flexShrink: 0, color: "var(--accent,#6366f1)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong>{doc.originalName}</strong>
                      {doc.extractedFields
                        ? <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 8, background: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e40" }}>✓ OCR Read</span>
                        : <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 8, background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40" }}>Pending OCR</span>
                      }
                    </div>
                    <p className="muted-text" style={{ fontSize: 12, margin: "2px 0" }}>
                      {formatBytes(doc.fileSize)} · Uploaded {formatDate(doc.createdAt)}
                    </p>
                    <ExtractedFields fields={doc.extractedFields} docType={doc.documentType} />
                    <p className="muted-text" style={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all", marginTop: 4 }}>
                      <ShieldCheck size={11} style={{ marginRight: 4 }} />
                      SHA-256: {doc.fileHash}
                    </p>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => handleDelete(docId, doc.originalName)}
                    title="Delete document"
                    style={{ color: "#ef4444" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
}
