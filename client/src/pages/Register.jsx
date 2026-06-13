import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student"
  });
  const [status, setStatus] = React.useState({ loading: false, error: "" });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setStatus({ loading: false, error: "Passwords do not match." });
      return;
    }

    setStatus({ loading: true, error: "" });

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card wide">
        <p className="eyebrow">Student registration</p>
        <h1>Create your ScholarSense AI account</h1>
        <form className="form-grid two" onSubmit={handleSubmit}>
          <label>
            Full name
            <input name="name" placeholder="Shalini H R" value={form.name} onChange={updateField} required />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="student@gmail.com"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              placeholder="Create password"
              value={form.password}
              onChange={updateField}
              minLength={6}
              required
            />
          </label>
          <label>
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={updateField}
              minLength={6}
              required
            />
          </label>
          <label className="span-two">
            Account type
            <select name="role" value={form.role} onChange={updateField}>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {status.error ? <div className="form-alert error span-two">{status.error}</div> : null}
          <button className="primary-btn span-two" type="submit" disabled={status.loading}>
            {status.loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="muted-text">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
