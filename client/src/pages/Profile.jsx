import React from "react";

export default function Profile() {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Student profile</p>
        <h2>Scholarship eligibility details</h2>
      </div>
      <section className="panel">
        <form className="form-grid three">
          <label>State<input placeholder="Karnataka" /></label>
          <label>Category<input placeholder="OBC / SC / ST / General" /></label>
          <label>Annual income<input placeholder="180000" /></label>
          <label>Marks percentage<input placeholder="76" /></label>
          <label>Course<input placeholder="BCA / B.Tech / Degree" /></label>
          <label>Gender<input placeholder="Female" /></label>
          <label>Aadhaar-bank linked<select><option>Unknown</option><option>Yes</option><option>No</option></select></label>
          <label>DBT enabled<select><option>Unknown</option><option>Yes</option><option>No</option></select></label>
          <label>Bank account active<select><option>Unknown</option><option>Yes</option><option>No</option></select></label>
          <button className="primary-btn span-three" type="button">Save Profile</button>
        </form>
      </section>
    </div>
  );
}
