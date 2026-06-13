import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Login to ScholarSense AI</h1>
        <form className="form-grid">
          <label>
            Email
            <input type="email" placeholder="student@gmail.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Enter password" />
          </label>
          <button className="primary-btn" type="button">Login</button>
        </form>
        <p className="muted-text">
          New student? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
