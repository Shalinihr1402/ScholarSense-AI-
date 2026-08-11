import React from "react";
import { X, CheckCircle2, AlertCircle, Download, ExternalLink, FileText } from "lucide-react";
import { documentApi } from "../services/api.js";

export default function DocumentKitModal({ scholarship, onClose }) {
  const [kit, setKit] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const scholarshipId = scholarship._id || scholarship.id;

  React.useEffect(() => {
    documentApi.kit(scholarshipId)
      .then(setKit)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [scholarshipId]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 20, width: "100%", maxWidth: 520,
        boxShadow: "0 20px 60px rgba(15,23,42,0.25)", overflow: "hidden"
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e3a5f,#0891b2)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>Document Kit</p>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "white", lineHeight: 1.4 }}>{scholarship.name}</h3>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "white", display: "flex", alignItems: "center" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "calc(90vh - 80px)", overflowY: "auto" }}>

          {loading && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#64748b" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
              Checking your documents…
            </div>
          )}

          {error && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecdd3", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>{error}</div>}

          {kit && (
            <>
              {/* Ready banner */}
              {kit.readyToApply ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12 }}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#15803d" }}>All documents ready!</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>Download the ZIP and upload to the portal.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 12 }}>
                  <AlertCircle size={20} color="#ea580c" />
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#c2410c" }}>{kit.missing.length} document(s) missing</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#9a3412" }}>Upload missing docs in the Documents page first.</p>
                  </div>
                </div>
              )}

              {/* Matched documents */}
              {kit.matched.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em" }}>
                    ✅ Ready ({kit.matched.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {kit.matched.map(doc => (
                      <div key={doc.docId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                        <FileText size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{doc.type}</p>
                          <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.originalName}</p>
                        </div>
                        <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing documents */}
              {kit.missing.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em" }}>
                    ❌ Missing ({kit.missing.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {kit.missing.map(type => (
                      <div key={type} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecdd3" }}>
                        <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#dc2626", flex: 1 }}>{type}</p>
                        <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>Not uploaded</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {kit.matched.length > 0 && (
                  <a
                    href={documentApi.bundleUrl(scholarshipId)}
                    download
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: "linear-gradient(135deg,#2563eb,#0891b2)", color: "white",
                      textDecoration: "none", border: "none"
                    }}
                  >
                    <Download size={15} />
                    Download ZIP ({kit.matched.length} docs)
                  </a>
                )}
                {kit.applicationLink && (
                  <a
                    href={kit.applicationLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: kit.matched.length > 0 ? "0 0 auto" : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: "#f1f5f9", color: "#475569",
                      textDecoration: "none", border: "1.5px solid #e2e8f0"
                    }}
                  >
                    <ExternalLink size={15} />
                    NSP/SSP Portal
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
