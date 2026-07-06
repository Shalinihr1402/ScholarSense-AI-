import React from "react";
import { ExternalLink, Search, IndianRupee, Calendar, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { scholarshipApi } from "../services/api.js";

export default function Scholarships() {
  const [filters, setFilters] = React.useState({ search: "", state: "", category: "" });
  const [data, setData] = React.useState({ scholarships: [], count: 0 });
  const [personalized, setPersonalized] = React.useState(null);
  const [mode, setMode] = React.useState("personalized");
  const [status, setStatus] = React.useState({ loading: true, error: "" });

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setStatus({ loading: true, error: "" });
      const request = mode === "personalized" ? scholarshipApi.personalized() : scholarshipApi.list(filters);
      request
        .then((response) => {
          setData(response);
          setPersonalized(mode === "personalized" ? response : null);
          setStatus({ loading: false, error: "" });
        })
        .catch((error) => setStatus({ loading: false, error: error.message }));
    }, 250);

    return () => clearTimeout(timeout);
  }, [filters, mode]);

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Scholarship database</p>
        <h2>Eligibility predictor and scholarship rules</h2>
      </div>

      <section className="panel">
        <div className="segmented-control">
          <button className={mode === "personalized" ? "active" : ""} type="button" onClick={() => setMode("personalized")}>
            Personalized eligibility
          </button>
          <button className={mode === "database" ? "active" : ""} type="button" onClick={() => setMode("database")}>
            Browse database
          </button>
        </div>
        <div className="filter-row">
          <label className="search-box full">
            <Search size={17} />
            <input
              name="search"
              value={filters.search}
              onChange={updateFilter}
              placeholder="Search NSP, SSP, AICTE, DBT, post-matric..."
            />
          </label>
          <select name="state" value={filters.state} onChange={updateFilter}>
            <option value="">All states</option>
            <option>Karnataka</option>
            <option>All India</option>
          </select>
          <select name="category" value={filters.category} onChange={updateFilter}>
            <option value="">All categories</option>
            <option>General</option>
            <option>OBC</option>
            <option>SC</option>
            <option>ST</option>
            <option>Minority</option>
            <option>EWS</option>
          </select>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card blue">
          <p>{mode === "personalized" ? "Eligible" : "Total schemes"}</p>
          <strong>{mode === "personalized" ? personalized?.summary?.Eligible ?? 0 : data.count}</strong>
          <span>{status.loading ? "Loading..." : "Based on saved profile"}</span>
        </div>
        <div className="stat-card teal">
          <p>Needs checking</p>
          <strong>{mode === "personalized" ? personalized?.summary?.Check ?? 0 : "Rules"}</strong>
          <span>Warnings or missing documents</span>
        </div>
        <div className="stat-card amber">
          <p>Not eligible</p>
          <strong>{mode === "personalized" ? personalized?.summary?.["Not Eligible"] ?? 0 : "Filter"}</strong>
          <span>Hard rule mismatch</span>
        </div>
        <div className="stat-card green">
          <p>Documents</p>
          <strong>Checklist</strong>
          <span>Used for readiness score</span>
        </div>
      </section>

      {status.error ? <div className="form-alert error">{status.error}</div> : null}
      {mode === "personalized" && personalized && !personalized.profileFound ? (
        <div className="form-alert error">Complete and save your Profile page before using personalized eligibility.</div>
      ) : null}

      {status.loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          Loading scholarships…
        </div>
      )}

      <section className="scholarship-grid">
        {!status.loading && data.scholarships.map((s) => {
          const elig = s.eligibility;
          const statusColor = elig?.status === "Eligible" ? "#16a34a" : elig?.status === "Not Eligible" ? "#dc2626" : "#d97706";
          const statusBg    = elig?.status === "Eligible" ? "#f0fdf4" : elig?.status === "Not Eligible" ? "#fef2f2" : "#fffbeb";
          const statusBorder= elig?.status === "Eligible" ? "#bbf7d0" : elig?.status === "Not Eligible" ? "#fecdd3" : "#fde68a";
          const missingDocs = elig?.missingDocuments || [];

          return (
            <article key={s.id || s._id} style={{
              background: "white", borderRadius: 16, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(15,23,42,.07)",
              border: `1.5px solid ${elig ? statusBorder : "#e2e8f0"}`,
              display: "flex", flexDirection: "column", gap: 0
            }}>
              {/* Top colour bar based on eligibility */}
              <div style={{ height: 4, background: elig?.status === "Eligible" ? "linear-gradient(90deg,#16a34a,#0d9488)" : elig?.status === "Not Eligible" ? "linear-gradient(90deg,#dc2626,#f97316)" : "linear-gradient(90deg,#d97706,#f59e0b)" }} />

              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 3px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b" }}>
                      {s.ministry || s.provider}
                    </p>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>{s.name}</h3>
                  </div>
                  {elig && (
                    <div style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 800,
                      background: statusBg, color: statusColor, border: `1.5px solid ${statusBorder}`,
                      flexShrink: 0, whiteSpace: "nowrap"
                    }}>
                      {elig.status === "Eligible" ? "✓ " : elig.status === "Not Eligible" ? "✗ " : "⚠ "}
                      {elig.status}
                    </div>
                  )}
                </div>

                {/* Match score bar */}
                {elig && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                      <span>Match Score</span>
                      <span style={{ color: statusColor }}>{elig.matchScore}%</span>
                    </div>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${elig.matchScore}%`, height: "100%", borderRadius: 99, background: elig.status === "Eligible" ? "linear-gradient(90deg,#16a34a,#0d9488)" : elig.status === "Not Eligible" ? "linear-gradient(90deg,#dc2626,#ef4444)" : "linear-gradient(90deg,#d97706,#f59e0b)", transition: "width .4s" }} />
                    </div>
                  </div>
                )}

                {/* Amount + Deadline row */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {s.amount && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <IndianRupee size={12} color="#16a34a" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>{s.amount}</span>
                    </div>
                  )}
                  {s.deadline && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: elig?.daysLeft !== null && elig?.daysLeft <= 15 ? "#fff7ed" : "#f8fafc", border: `1px solid ${elig?.daysLeft !== null && elig?.daysLeft <= 15 ? "#fed7aa" : "#e2e8f0"}` }}>
                      <Calendar size={12} color={elig?.daysLeft !== null && elig?.daysLeft <= 15 ? "#ea580c" : "#64748b"} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: elig?.daysLeft !== null && elig?.daysLeft <= 15 ? "#ea580c" : "#475569" }}>
                        Apply by {s.deadline}{elig?.daysLeft != null ? ` (${elig.daysLeft}d left)` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Category tags */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {s.categories?.map(cat => (
                    <span key={cat} style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>{cat}</span>
                  ))}
                  {s.state !== "All India" && (
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" }}>{s.state}</span>
                  )}
                  {s.gender !== "Any" && (
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#fdf2f8", color: "#9d174d", border: "1px solid #fbcfe8" }}>{s.gender} only</span>
                  )}
                  {s.disabilityRequired && (
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe" }}>Disability cert required</span>
                  )}
                </div>

                {/* Key criteria */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 12, color: "#475569" }}>
                  <span>📍 {s.state}</span>
                  <span>💰 Income: {s.incomeLimit === 0 ? "No limit" : `≤ ₹${Number(s.incomeLimit).toLocaleString("en-IN")}`}</span>
                  <span>📊 Min marks: {s.minMarks === 0 ? "None" : `${s.minMarks}%`}</span>
                  <span>🎓 {s.courseLevels?.join(", ") || "All levels"}</span>
                </div>

                {/* Eligibility reasons */}
                {elig && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {elig.failed.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: "6px 10px", borderRadius: 8, border: "1px solid #fecdd3" }}>
                        <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                        {f}
                      </div>
                    ))}
                    {elig.warnings.map((w, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 12, color: "#92400e", background: "#fffbeb", padding: "6px 10px", borderRadius: 8, border: "1px solid #fde68a" }}>
                        <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                        {w}
                      </div>
                    ))}
                    {elig.failed.length === 0 && elig.warnings.length === 0 && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#15803d", background: "#f0fdf4", padding: "6px 10px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                        <CheckCircle2 size={13} />
                        All eligibility rules matched. You can apply on the official portal.
                      </div>
                    )}
                  </div>
                )}

                {/* Missing documents */}
                {missingDocs.length > 0 && (
                  <div style={{ fontSize: 12, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 10px" }}>
                    <strong style={{ color: "#c2410c", display: "block", marginBottom: 3 }}>⚠ Missing {missingDocs.length} document(s):</strong>
                    <span style={{ color: "#92400e" }}>{missingDocs.join(" • ")}</span>
                  </div>
                )}

                {/* Description */}
                <p style={{ margin: 0, fontSize: 12.5, color: "#64748b", lineHeight: 1.6 }}>{s.description}</p>

                {/* Apply button */}
                <a href={s.applicationLink} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none",
                  background: elig?.status === "Eligible" ? "linear-gradient(135deg,#2563eb,#0891b2)" : "#f1f5f9",
                  color: elig?.status === "Eligible" ? "white" : "#475569",
                  border: elig?.status === "Eligible" ? "none" : "1.5px solid #e2e8f0",
                  boxShadow: elig?.status === "Eligible" ? "0 3px 10px rgba(37,99,235,.25)" : "none",
                  marginTop: "auto"
                }}>
                  Apply on Official Portal <ExternalLink size={14} />
                </a>
              </div>
            </article>
          );
        })}
      </section>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
