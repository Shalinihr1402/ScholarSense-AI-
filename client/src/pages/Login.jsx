import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [status, setStatus] = React.useState({ loading: false, error: "" });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "" });

    try {
      await login(form);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Login to ScholarSense AI</h1>
        <form className="form-grid" onSubmit={handleSubmit}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={updateField}
                required
              />
            </label>
            <div style={{ textAlign: "right" }}>
              <Link to="/forgot-password" style={{ fontSize: "0.875rem", color: "var(--primary)" }}>
                Forgot Password?
              </Link>
            </div>
          </div>
          {status.error ? <div className="form-alert error">{status.error}</div> : null}
          <button className="primary-btn" type="submit" disabled={status.loading}>
            {status.loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="muted-text">
          New student? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
