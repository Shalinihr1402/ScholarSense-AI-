import React from "react";
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <main className="auth-page">
      <section className="auth-card wide">
        <p className="eyebrow">Student registration</p>
        <h1>Create your ScholarSense AI account</h1>
        <form className="form-grid two">
          <label>
            Full name
            <input placeholder="Shalini H R" />
          </label>
          <label>
            Email
            <input type="email" placeholder="student@gmail.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Create password" />
          </label>
          <label>
            Confirm password
            <input type="password" placeholder="Confirm password" />
          </label>
          <button className="primary-btn span-two" type="button">Register</button>
        </form>
        <p className="muted-text">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
