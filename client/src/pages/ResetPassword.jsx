import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../services/api.js";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  useEffect(() => {
    if (!token) {
      setStatus({ loading: false, error: "Invalid or missing reset token.", success: "" });
    }
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      return setStatus({ loading: false, error: "Passwords do not match.", success: "" });
    }

    if (password.length < 6) {
      return setStatus({ loading: false, error: "Password must contain at least 6 characters.", success: "" });
    }

    setStatus({ loading: true, error: "", success: "" });

    try {
      const response = await authApi.resetPassword({ token, password });
      setStatus({ loading: false, error: "", success: response.message });
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: "" });
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Account Recovery</p>
        <h1>Reset Password</h1>
        
        {status.success ? (
          <div className="form-alert success" style={{ marginBottom: "1rem", background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: "8px" }}>
            <p style={{ margin: 0, color: "var(--primary)" }}>{status.success}</p>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem" }}>Redirecting to login...</p>
            <Link to="/login" style={{ display: "block", marginTop: "1rem", fontWeight: "bold" }}>Go to Login Now</Link>
          </div>
        ) : (
          <form className="form-grid" onSubmit={handleSubmit}>
            <p className="muted-text" style={{ marginBottom: "1rem" }}>
              Please enter your new password below.
            </p>
            <label>
              New Password
              <input
                name="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token}
              />
            </label>
            <label>
              Confirm New Password
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={!token}
              />
            </label>
            {status.error ? <div className="form-alert error">{status.error}</div> : null}
            <button className="primary-btn" type="submit" disabled={status.loading || !token}>
              {status.loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
