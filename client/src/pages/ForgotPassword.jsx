import React from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState({ loading: false, error: "", success: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    try {
      const response = await authApi.forgotPassword({ email });
      setStatus({ loading: false, error: "", success: response.message });
      setEmail("");
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: "" });
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Account Recovery</p>
        <h1>Forgot Password</h1>
        <p className="muted-text" style={{ marginBottom: "1.5rem" }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {status.success ? (
          <div className="form-alert success" style={{ marginBottom: "1rem", background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: "8px" }}>
            <p style={{ margin: 0, color: "var(--primary)" }}>{status.success}</p>
            <Link to="/login" style={{ display: "block", marginTop: "1rem", fontWeight: "bold" }}>Return to Login</Link>
          </div>
        ) : (
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Email Address
              <input
                name="email"
                type="email"
                placeholder="student@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            {status.error ? <div className="form-alert error">{status.error}</div> : null}
            <button className="primary-btn" type="submit" disabled={status.loading || !email}>
              {status.loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
        
        {!status.success && (
          <p className="muted-text" style={{ marginTop: "1.5rem", textAlign: "center" }}>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
        )}
      </section>
    </main>
  );
}
