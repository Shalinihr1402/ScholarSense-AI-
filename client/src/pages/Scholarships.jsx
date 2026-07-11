import React from "react";
import { ExternalLink, Search, FolderOpen } from "lucide-react";
import { scholarshipApi } from "../services/api.js";
import DocumentKitModal from "../components/DocumentKitModal.jsx";

export default function Scholarships() {
  const [filters, setFilters] = React.useState({ search: "", state: "", category: "" });
  const [data, setData] = React.useState({ scholarships: [], count: 0 });
  const [personalized, setPersonalized] = React.useState(null);
  const [mode, setMode] = React.useState("personalized");
  const [status, setStatus] = React.useState({ loading: true, error: "" });
  const [kitScholarship, setKitScholarship] = React.useState(null);

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

  function getTag(elig) {
    if (!elig) return { label: "Complete Profile", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" };
    if (elig.status === "Eligible") return { label: "✓ Eligible", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" };
    if (elig.status === "Not Eligible") return { label: "✗ Not Eligible", color: "#dc2626", bg: "#fef2f2", border: "#fecdd3" };
    return { label: "⚠ Check Eligibility", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Scholarship database</p>
        <h2>Find scholarships you qualify for</h2>
      </div>

      <section className="panel">
        <div className="segmented-control">
          <button className={mode === "personalized" ? "active" : ""} type="button" onClick={() => setMode("personalized")}>
            My Eligibility
          </button>
          <button className={mode === "database" ? "active" : ""} type="button" onClick={() => setMode("database")}>
            Browse All
          </button>
        </div>
        <div className="filter-row">
          <label className="search-box full">
            <Search size={17} />
            <input name="search" value={filters.search} onChange={updateFilter} placeholder="Search scholarships..." />
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

      {mode === "personalized" && (
        <section className="stats-grid">
          <div className="stat-card green">
            <p>Eligible</p>
            <strong>{personalized?.summary?.Eligible ?? "—"}</strong>
            <span>You can apply now</span>
          </div>
          <div className="stat-card amber">
            <p>Check Required</p>
            <strong>{personalized?.summary?.Check ?? "—"}</strong>
            <span>Verify one condition</span>
          </div>
          <div className="stat-card red" style={{ "--card-color": "#dc2626", "--card-bg": "#fef2f2" }}>
            <p>Not Eligible</p>
            <strong>{personalized?.summary?.["Not Eligible"] ?? "—"}</strong>
            <span>Rules don't match</span>
          </div>
          <div className="stat-card blue">
            <p>Total Schemes</p>
            <strong>{data.count}</strong>
            <span>In the database</span>
          </div>
        </section>
      )}

      {status.error && <div className="form-alert error">{status.error}</div>}

      {mode === "personalized" && personalized && !personalized.profileFound && (
        <div className="form-alert error">
          Complete your Profile first to see personalized eligibility results.
        </div>
      )}

      {status.loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          Loading scholarships…
        </div>
      )}

      <section className="scholarship-grid">
        {!status.loading && data.scholarships.map((s) => {
          const elig = s.eligibility;
          const tag = getTag(elig);

          return (
            <article key={s.id || s._id} style={{
              background: "white", borderRadius: 14, overflow: "hidden",
              boxShadow: "0 2px 10px rgba(15,23,42,.07)",
              border: `1.5px solid ${tag.border}`,
              display: "flex", flexDirection: "column"
            }}>
              <div style={{ height: 3, background: tag.color }} />

              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>

                {/* Name + tag */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#94a3b8" }}>
                      {s.ministry || s.provider}
                    </p>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>{s.name}</h3>
                  </div>
                  <span style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 800, flexShrink: 0, whiteSpace: "nowrap",
                    background: tag.bg, color: tag.color, border: `1.5px solid ${tag.border}`
                  }}>
                    {tag.label}
                  </span>
                </div>

                {/* Amount + Deadline */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {s.amount && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 10px", borderRadius: 8 }}>
                      ₹ {s.amount}
                    </span>
                  )}
                  {s.deadline && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "3px 10px", borderRadius: 8 }}>
                      📅 Apply by {s.deadline}
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4 }}>
                  <button
                    onClick={() => setKitScholarship(s)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "9px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      background: elig?.status === "Eligible" ? "linear-gradient(135deg,#2563eb,#0891b2)" : "#f1f5f9",
                      color: elig?.status === "Eligible" ? "white" : "#475569",
                      border: elig?.status === "Eligible" ? "none" : "1.5px solid #e2e8f0"
                    }}
                  >
                    <FolderOpen size={13} /> Get Document Kit
                  </button>
                  <a href={s.applicationLink} target="_blank" rel="noreferrer" style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "9px 12px", borderRadius: 9, textDecoration: "none", fontSize: 11.5, fontWeight: 700,
                    background: "#f1f5f9", color: "#475569", border: "1.5px solid #e2e8f0", whiteSpace: "nowrap"
                  }}>
                    {s.applicationLink?.includes("ssp.karnataka") ? "SSP Portal" : "NSP Portal"}
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {kitScholarship && (
        <DocumentKitModal scholarship={kitScholarship} onClose={() => setKitScholarship(null)} />
      )}
    </div>
  );
}
