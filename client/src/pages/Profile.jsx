import React from "react";
import { profileApi } from "../services/api.js";

const documentOptions = [
  "Aadhaar Card",
  "Bank Passbook",
  "Income Certificate",
  "Caste Certificate",
  "Marksheet",
  "Bonafide Certificate",
  "Fee Receipt"
];

const initialProfile = {
  fullName: "",
  state: "Karnataka",
  district: "",
  collegeName: "",
  course: "",
  semester: "",
  category: "",
  annualIncome: "",
  marksPercentage: "",
  gender: "",
  disabilityStatus: "Unknown",
  aadhaarBankLinked: "Unknown",
  dbtEnabled: "Unknown",
  bankAccountActive: "Unknown",
  availableDocuments: []
};

export default function Profile() {
  const [form, setForm] = React.useState(initialProfile);
  const [insights, setInsights] = React.useState(null);
  const [status, setStatus] = React.useState({ loading: true, saving: false, error: "", success: "" });

  React.useEffect(() => {
    profileApi
      .getMine()
      .then((data) => {
        if (data.profile) {
          setForm({ ...initialProfile, ...data.profile });
        }
        setInsights(data.insights);
      })
      .catch((error) => setStatus((current) => ({ ...current, error: error.message })))
      .finally(() => setStatus((current) => ({ ...current, loading: false })));
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleDocument(documentName) {
    setForm((current) => {
      const exists = current.availableDocuments.includes(documentName);
      return {
        ...current,
        availableDocuments: exists
          ? current.availableDocuments.filter((item) => item !== documentName)
          : [...current.availableDocuments, documentName]
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, error: "", success: "" }));

    try {
      const data = await profileApi.saveMine(form);
      setForm({ ...initialProfile, ...data.profile });
      setInsights(data.insights);
      setStatus((current) => ({
        ...current,
        saving: false,
        success: "Profile saved successfully. Eligibility and readiness modules can now use this data."
      }));
    } catch (error) {
      setStatus((current) => ({ ...current, saving: false, error: error.message }));
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Student profile</p>
        <h2>Scholarship eligibility details</h2>
      </div>

      <section className="stats-grid">
        <div className="stat-card blue">
          <p>Profile completion</p>
          <strong>{insights?.completion ?? 0}%</strong>
          <span>{insights?.missingFields?.length ?? 0} fields pending</span>
        </div>
        <div className={`stat-card ${insights?.dbtReady ? "green" : "amber"}`}>
          <p>DBT readiness</p>
          <strong>{insights?.dbtReady ? "Ready" : "Check"}</strong>
          <span>Aadhaar, DBT, and bank status</span>
        </div>
        <div className="stat-card teal">
          <p>Documents available</p>
          <strong>{form.availableDocuments.length}</strong>
          <span>For scholarship verification</span>
        </div>
        <div className="stat-card amber">
          <p>Next module</p>
          <strong>Eligibility</strong>
          <span>Uses this profile data</span>
        </div>
      </section>

      <section className="panel">
        {status.loading ? <p className="muted-text">Loading profile...</p> : null}
        {status.error ? <div className="form-alert error">{status.error}</div> : null}
        {status.success ? <div className="form-alert success">{status.success}</div> : null}

        <form className="form-grid three" onSubmit={handleSubmit}>
          <label>
            Full name
            <input name="fullName" value={form.fullName} onChange={updateField} placeholder="Shalini H R" />
          </label>
          <label>
            State
            <input name="state" value={form.state} onChange={updateField} placeholder="Karnataka" />
          </label>
          <label>
            District
            <input name="district" value={form.district} onChange={updateField} placeholder="Davanagere" />
          </label>
          <label>
            College / Institute
            <input
              name="collegeName"
              value={form.collegeName}
              onChange={updateField}
              placeholder="GM University"
            />
          </label>
          <label>
            Course
            <input name="course" value={form.course} onChange={updateField} placeholder="BCA / B.Tech / Degree" />
          </label>
          <label>
            Semester / Class
            <input name="semester" value={form.semester} onChange={updateField} placeholder="4th Sem" />
          </label>
          <label>
            Category
            <select name="category" value={form.category} onChange={updateField}>
              <option value="">Select category</option>
              <option>General</option>
              <option>OBC</option>
              <option>SC</option>
              <option>ST</option>
              <option>Minority</option>
              <option>EWS</option>
            </select>
          </label>
          <label>
            Annual family income
            <input
              name="annualIncome"
              type="number"
              min="0"
              value={form.annualIncome}
              onChange={updateField}
              placeholder="180000"
            />
          </label>
          <label>
            Marks percentage
            <input
              name="marksPercentage"
              type="number"
              min="0"
              max="100"
              value={form.marksPercentage}
              onChange={updateField}
              placeholder="76"
            />
          </label>
          <label>
            Gender
            <select name="gender" value={form.gender} onChange={updateField}>
              <option value="">Select gender</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Disability status
            <select name="disabilityStatus" value={form.disabilityStatus} onChange={updateField}>
              <option>Unknown</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </label>
          <label>
            Aadhaar-bank linked
            <select name="aadhaarBankLinked" value={form.aadhaarBankLinked} onChange={updateField}>
              <option>Unknown</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </label>
          <label>
            DBT enabled
            <select name="dbtEnabled" value={form.dbtEnabled} onChange={updateField}>
              <option>Unknown</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </label>
          <label>
            Bank account active
            <select name="bankAccountActive" value={form.bankAccountActive} onChange={updateField}>
              <option>Unknown</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </label>

          <fieldset className="document-fieldset span-three">
            <legend>Available documents</legend>
            <div className="document-grid">
              {documentOptions.map((documentName) => (
                <label key={documentName} className="check-card">
                  <input
                    type="checkbox"
                    checked={form.availableDocuments.includes(documentName)}
                    onChange={() => toggleDocument(documentName)}
                  />
                  <span>{documentName}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button className="primary-btn span-three" type="submit" disabled={status.saving}>
            {status.saving ? "Saving Profile..." : "Save Profile"}
          </button>
        </form>
      </section>
    </div>
  );
}
