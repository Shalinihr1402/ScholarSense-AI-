import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"
];

const CATEGORIES = ["General","OBC","SC","ST","Minority","EWS"];

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();

  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    name: "", email: "", password: "", confirmPassword: "", role: "student",
    dateOfBirth: "", state: "", category: "", annualIncome: "", course: ""
  });
  const [status, setStatus] = React.useState({ loading: false, error: "" });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  function updateField(e) {
    setForm(curr => ({ ...curr, [e.target.name]: e.target.value }));
  }

  function goToStep2(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setStatus({ loading: false, error: "Passwords do not match." });
      return;
    }
    setStatus({ loading: false, error: "" });
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "" });
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        dateOfBirth: form.dateOfBirth || undefined,
        state: form.state || undefined,
        category: form.category || undefined,
        annualIncome: form.annualIncome ? Number(form.annualIncome) : undefined,
        course: form.course || undefined
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
      setStep(2);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card wide">
        <p className="eyebrow">
          Step {step} of 2 — {step === 1 ? "Account setup" : "Scholarship profile"}
        </p>
        <h1>Create your ScholarSense AI account</h1>

        <div className="step-indicator">
          <span className={`step-dot ${step >= 1 ? "active" : ""}`}>1</span>
          <span className="step-line" />
          <span className={`step-dot ${step >= 2 ? "active" : ""}`}>2</span>
        </div>

        {step === 1 && (
          <form className="form-grid two" onSubmit={goToStep2}>
            <label>
              Full name
              <input name="name" placeholder="Shalini H R" value={form.name} onChange={updateField} required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="student@gmail.com" value={form.email} onChange={updateField} required />
            </label>
            <label>
              Password
              <input name="password" type="password" placeholder="Create password (min 6 chars)" value={form.password} onChange={updateField} minLength={6} required />
            </label>
            <label>
              Confirm password
              <input name="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={updateField} minLength={6} required />
            </label>
            <label className="span-two">
              Account type
              <select name="role" value={form.role} onChange={updateField}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            {status.error && <div className="form-alert error span-two">{status.error}</div>}
            <button className="primary-btn span-two" type="submit">
              Next — Scholarship profile →
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="form-grid two" onSubmit={handleSubmit}>
            <p className="muted-text span-two" style={{ marginBottom: 4 }}>
              These details let us instantly match you with scholarships. You can update them later too.
            </p>
            <label>
              Date of birth
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} />
            </label>
            <label>
              State
              <select name="state" value={form.state} onChange={updateField}>
                <option value="">Select state</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              Category
              <select name="category" value={form.category} onChange={updateField}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Annual family income (₹)
              <input name="annualIncome" type="number" min="0" placeholder="e.g. 180000" value={form.annualIncome} onChange={updateField} />
            </label>
            <label className="span-two">
              Current course / class
              <input name="course" placeholder="e.g. B.Tech, BCA, 11th Standard" value={form.course} onChange={updateField} />
            </label>
            {status.error && <div className="form-alert error span-two">{status.error}</div>}
            <button className="secondary-btn" type="button" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button className="primary-btn" type="submit" disabled={status.loading}>
              {status.loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}

        <p className="muted-text">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
