import React from "react";
import { ExternalLink, Search } from "lucide-react";
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

      <section className="scholarship-grid">
        {data.scholarships.map((scholarship) => (
          <article className="scholarship-card" key={scholarship.id || scholarship._id}>
            <div className="scholarship-card-header">
              <div>
                <p className="eyebrow">{scholarship.provider}</p>
                <h3>{scholarship.name}</h3>
              </div>
              <span
                className={`status-pill ${
                  scholarship.eligibility?.status === "Eligible"
                    ? "ok"
                    : scholarship.eligibility?.status === "Not Eligible"
                      ? "bad"
                      : "warn"
                }`}
              >
                {scholarship.eligibility?.status || scholarship.status}
              </span>
            </div>

            {scholarship.eligibility ? (
              <div className="eligibility-strip">
                <strong>{scholarship.eligibility.matchScore}% match</strong>
                <span>{scholarship.eligibility.daysLeft ?? "No"} day(s) left</span>
              </div>
            ) : null}

            <p className="muted-text">{scholarship.description}</p>

            <div className="scholarship-meta">
              <span>State: {scholarship.state}</span>
              <span>Income limit: Rs. {Number(scholarship.incomeLimit).toLocaleString("en-IN")}</span>
              <span>Min marks: {scholarship.minMarks}%</span>
              <span>Deadline: {scholarship.deadline}</span>
            </div>

            <div className="tag-list">
              {scholarship.categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>

            <div className="document-list">
              <strong>Required documents</strong>
              <p>{scholarship.requiredDocuments.join(", ")}</p>
            </div>

            {scholarship.eligibility ? (
              <div className="diagnosis-list">
                {scholarship.eligibility.failed.slice(0, 2).map((item) => (
                  <p className="bad-text" key={item}>{item}</p>
                ))}
                {scholarship.eligibility.warnings.slice(0, 3).map((item) => (
                  <p className="warn-text" key={item}>{item}</p>
                ))}
                {scholarship.eligibility.failed.length === 0 && scholarship.eligibility.warnings.length === 0 ? (
                  <p className="ok-text">All major eligibility rules matched. Verify official portal before applying.</p>
                ) : null}
              </div>
            ) : null}

            <a className="text-link" href={scholarship.applicationLink} target="_blank" rel="noreferrer">
              Official link <ExternalLink size={15} />
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
