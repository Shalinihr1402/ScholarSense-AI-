import React from "react";
import { AlertTriangle, BookOpen, Building2, CheckCircle2, CreditCard, User } from "lucide-react";
import { profileApi } from "../services/api.js";

// ─── helpers ────────────────────────────────────────────────────────────────

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir",
  "Ladakh","Lakshadweep","Puducherry"
];

const initialForm = {
  // Personal
  fullName: "", dateOfBirth: "", gender: "", mobile: "", email: "",
  aadhaarMasked: "", state: "Karnataka", district: "", taluk: "", village: "",
  address: "", pinCode: "",
  // Academic
  educationLevel: "", course: "", semester: "", admissionYear: "",
  currentAcademicYear: "", universityBoard: "", marksPercentage: "", admissionType: "",
  // Institute
  collegeName: "", instituteCode: "", instituteAddress: "",
  nodalOfficerName: "", nodalOfficerDesignation: "", nodalOfficerEmail: "", nodalOfficerContact: "",
  // Eligibility
  category: "", annualIncome: "", disabilityStatus: "Unknown", minorityStatus: "Unknown",
  hosteller: "Unknown", orphanStatus: "Unknown", firstGraduate: "Unknown",
  // Bank
  bankName: "", accountHolderName: "", accountNumber: "", ifscCode: "",
  aadhaarBankLinked: "Unknown", dbtEnabled: "Unknown", bankAccountActive: "Unknown", npciMapping: "Unknown",
  availableDocuments: []
};

// Count filled required fields per section for progress
const REQUIRED = {
  personal:    ["fullName","gender","mobile","state","district"],
  academic:    ["educationLevel","course","semester","marksPercentage"],
  institute:   ["collegeName"],
  eligibility: ["category","annualIncome"],
  bank:        ["bankName","accountNumber","ifscCode","aadhaarBankLinked","dbtEnabled"]
};

function sectionProgress(form, keys) {
  const filled = keys.filter(k => form[k] && form[k] !== "Unknown" && String(form[k]).trim() !== "");
  return { filled: filled.length, total: keys.length };
}

// ─── sub-components ─────────────────────────────────────────────────────────

function Field({ label, required, hint, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
        {label}
        {required
          ? <span style={{ color: "#ef4444", fontSize: 10 }} title="Required">●</span>
          : <span style={{ color: "#6b7280", fontSize: 10 }} title="Optional">○</span>
        }
      </span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--text-muted,#9ca3af)", lineHeight: 1.4 }}>{hint}</span>}
    </label>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, progress }) {
  const pct = progress ? Math.round((progress.filled / progress.total) * 100) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border,#2d3244)" }}>
      <div style={{ background: "var(--accent,#6366f1)20", borderRadius: 10, padding: 10, flexShrink: 0 }}>
        <Icon size={20} style={{ color: "var(--accent,#6366f1)" }} />
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
        <p className="muted-text" style={{ margin: 0, fontSize: 12 }}>{subtitle}</p>
      </div>
      {pct !== null && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? "#22c55e" : "var(--accent,#6366f1)" }}>{pct}%</span>
          <div style={{ width: 60, height: 4, background: "var(--border,#2d3244)", borderRadius: 4, marginTop: 3 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#22c55e" : "var(--accent,#6366f1)", borderRadius: 4, transition: "width 0.3s" }} />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ children }) {
  return (
    <div style={{
      background: "#6366f110", border: "1px solid #6366f130", borderRadius: 10,
      padding: "14px 16px", marginTop: 8, display: "flex", gap: 12, alignItems: "flex-start"
    }}>
      <AlertTriangle size={16} style={{ color: "#6366f1", flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function LearnMore() {
  return (
    <a href="/awareness" style={{ fontSize: 12, color: "var(--accent,#6366f1)", textDecoration: "none", fontWeight: 600 }}>
      Don't know? Learn More →
    </a>
  );
}

const inp = { padding: "9px 12px", borderRadius: 8, fontSize: 14, border: "1px solid var(--border,#2d3244)", background: "var(--surface-2,#1e2130)", color: "var(--text-primary,#f0f0f0)", width: "100%", boxSizing: "border-box" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 };

// ─── main component ──────────────────────────────────────────────────────────

export default function Profile() {
  const [form, setForm] = React.useState(initialForm);
  const [insights, setInsights] = React.useState(null);
  const [pageStatus, setPageStatus] = React.useState({ loading: true, saving: false, error: "", success: "" });
  React.useEffect(() => {
    profileApi.getMine()
      .then(data => {
        if (data.profile) setForm({ ...initialForm, ...data.profile });
        setInsights(data.insights);
      })
      .catch(err => setPageStatus(s => ({ ...s, error: err.message })))
      .finally(() => setPageStatus(s => ({ ...s, loading: false })));
  }, []);

  function upd(e) {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPageStatus(s => ({ ...s, saving: true, error: "", success: "" }));
    try {
      const data = await profileApi.saveMine(form);
      setForm({ ...initialForm, ...data.profile });
      setInsights(data.insights);
      setPageStatus(s => ({ ...s, saving: false, success: "Profile saved. Your eligibility and health check are now updated." }));
    } catch (err) {
      setPageStatus(s => ({ ...s, saving: false, error: err.message }));
    }
  }

  const p1 = sectionProgress(form, REQUIRED.personal);
  const p2 = sectionProgress(form, REQUIRED.academic);
  const p3 = sectionProgress(form, REQUIRED.institute);
  const p4 = sectionProgress(form, REQUIRED.eligibility);
  const p5 = sectionProgress(form, REQUIRED.bank);
  const totalFilled = p1.filled + p2.filled + p3.filled + p4.filled + p5.filled;
  const totalRequired = p1.total + p2.total + p3.total + p4.total + p5.total;
  const overallPct = Math.round((totalFilled / totalRequired) * 100);

  if (pageStatus.loading) return <div className="page-stack"><p className="muted-text">Loading profile...</p></div>;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Student Profile</p>
        <h2>Your Scholarship Application Profile</h2>
        <p className="muted-text">
          Every field you fill helps us match you to the right scholarships and prevent rejections.
          <span style={{ marginLeft: 8 }}>
            <span style={{ color: "#ef4444", fontSize: 11 }}>●</span> Required &nbsp;
            <span style={{ color: "#6b7280", fontSize: 11 }}>○</span> Optional
          </span>
        </p>
      </div>

      {/* Overall progress bar */}
      <div style={{ background: "var(--surface-2,#1e2130)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Profile completeness</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: overallPct === 100 ? "#22c55e" : "var(--accent,#6366f1)" }}>{overallPct}%</span>
          </div>
          <div style={{ height: 8, background: "var(--border,#2d3244)", borderRadius: 8 }}>
            <div style={{ width: `${overallPct}%`, height: "100%", background: overallPct === 100 ? "#22c55e" : "var(--accent,#6366f1)", borderRadius: 8, transition: "width 0.4s" }} />
          </div>
        </div>
        {overallPct === 100
          ? <CheckCircle2 size={24} style={{ color: "#22c55e", flexShrink: 0 }} />
          : <span style={{ fontSize: 12, color: "var(--text-muted,#9ca3af)", flexShrink: 0 }}>{totalRequired - totalFilled} required fields left</span>
        }
      </div>


      {pageStatus.error   && <div className="form-alert error">{pageStatus.error}</div>}
      {pageStatus.success && <div className="form-alert success">{pageStatus.success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── SECTION 1: Personal ─────────────────────────────────────── */}
        <section className="panel">
          <SectionHeader icon={User} title="Personal Information" subtitle="Used to identify you on scholarship applications" progress={p1} />
          <div style={grid}>
            <Field label="Full Name" required hint="Enter your name exactly as it appears on your Aadhaar card">
              <input style={inp} name="fullName" value={form.fullName} onChange={upd} placeholder="e.g. Shalini H R" />
            </Field>
            <Field label="Date of Birth" required hint="Format: DD-MM-YYYY (as on your marksheet or Aadhaar)">
              <input style={inp} name="dateOfBirth" value={form.dateOfBirth} onChange={upd} placeholder="e.g. 14-02-2002" />
            </Field>
            <Field label="Gender" required hint="As recorded in your school/college records">
              <select style={inp} name="gender" value={form.gender} onChange={upd}>
                <option value="">Select gender</option>
                <option>Female</option><option>Male</option><option>Transgender</option><option>Other</option>
              </select>
            </Field>
            <Field label="Mobile Number" required hint="This number will receive OTPs on NSP/SSP portal — keep it active">
              <input style={inp} name="mobile" value={form.mobile} onChange={upd} placeholder="10-digit mobile" maxLength={10} />
            </Field>
            <Field label="Email Address" hint="Used for scholarship communication and portal login">
              <input style={inp} name="email" type="email" value={form.email} onChange={upd} placeholder="your@email.com" />
            </Field>
            <Field label="Aadhaar Number (Last 4 digits)" hint="We only store last 4 digits for safety. Never share your full Aadhaar here.">
              <input style={inp} name="aadhaarMasked" value={form.aadhaarMasked} onChange={upd} placeholder="XXXX-XXXX-1234" maxLength={4} />
            </Field>
            <Field label="State" required hint="State where you are currently studying">
              <select style={inp} name="state" value={form.state} onChange={upd}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="District" required hint="District of your college / school">
              <input style={inp} name="district" value={form.district} onChange={upd} placeholder="e.g. Davanagere" />
            </Field>
            <Field label="Taluk" hint="Taluk where you belong (for state-level scholarship matching)">
              <input style={inp} name="taluk" value={form.taluk} onChange={upd} placeholder="e.g. Channagiri" />
            </Field>
            <Field label="Village / City" hint="Your permanent residential village or city name">
              <input style={inp} name="village" value={form.village} onChange={upd} placeholder="e.g. Harihar" />
            </Field>
            <Field label="Full Address" hint="Permanent address as on your income/caste certificate">
              <input style={inp} name="address" value={form.address} onChange={upd} placeholder="House no, street, locality..." />
            </Field>
            <Field label="PIN Code" hint="6-digit postal code of your permanent address">
              <input style={inp} name="pinCode" value={form.pinCode} onChange={upd} placeholder="e.g. 577001" maxLength={6} />
            </Field>
          </div>
        </section>

        {/* ── SECTION 2: Academic ─────────────────────────────────────── */}
        <section className="panel">
          <SectionHeader icon={BookOpen} title="Academic Information" subtitle="Determines which scholarships you are eligible for" progress={p2} />
          <div style={grid}>
            <Field label="Education Level" required hint="Current level of education you are enrolled in">
              <select style={inp} name="educationLevel" value={form.educationLevel} onChange={upd}>
                <option value="">Select level</option>
                <option>School (Class 1–10)</option><option>PUC / Class 11–12</option>
                <option>Diploma / ITI</option><option>Degree (UG)</option>
                <option>Post Graduate (PG)</option><option>PhD / Research</option>
              </select>
            </Field>
            <Field label="Current Course" required hint="Full name of the course you are studying (e.g. B.Com, MCA, B.Tech)">
              <input style={inp} name="course" value={form.course} onChange={upd} placeholder="e.g. MCA / B.Tech / B.Com" />
            </Field>
            <Field label="Semester / Class" required hint="Current semester or class you are studying in">
              <input style={inp} name="semester" value={form.semester} onChange={upd} placeholder="e.g. 4th Sem / Class 12" />
            </Field>
            <Field label="Admission Year" hint="Year you were first admitted to this course">
              <input style={inp} name="admissionYear" value={form.admissionYear} onChange={upd} placeholder="e.g. 2023" maxLength={4} />
            </Field>
            <Field label="Current Academic Year" hint="e.g. 2025–2026">
              <input style={inp} name="currentAcademicYear" value={form.currentAcademicYear} onChange={upd} placeholder="2025–2026" />
            </Field>
            <Field label="University / Board" hint="Name of the university or board you are affiliated to">
              <input style={inp} name="universityBoard" value={form.universityBoard} onChange={upd} placeholder="e.g. VTU / Karnataka Board" />
            </Field>
            <Field label="Previous Marks %" required hint="Your last exam marks percentage or CGPA (used for merit-based scholarships)">
              <input style={inp} name="marksPercentage" type="number" min="0" max="100" value={form.marksPercentage} onChange={upd} placeholder="e.g. 82" />
            </Field>
            <Field label="Admission Type" hint="Is this a fresh application or renewal of a previous scholarship?">
              <select style={inp} name="admissionType" value={form.admissionType} onChange={upd}>
                <option value="">Select type</option>
                <option>Fresh</option><option>Renewal</option>
              </select>
            </Field>
          </div>
        </section>

        {/* ── SECTION 3: Institute ────────────────────────────────────── */}
        <section className="panel">
          <SectionHeader icon={Building2} title="Institute Information" subtitle="Required for institute verification on NSP/SSP" progress={p3} />
          <div style={grid}>
            <Field label="Institute Name" required hint="Full official name of your college or school">
              <input style={inp} name="collegeName" value={form.collegeName} onChange={upd} placeholder="e.g. GM University" />
            </Field>
            <Field label="Institute Code" hint="AISHE or NSP institute code (check with your admin office)">
              <input style={inp} name="instituteCode" value={form.instituteCode} onChange={upd} placeholder="e.g. C-12345" />
            </Field>
            <Field label="Institute Address" hint="Full address of the college for verification records">
              <input style={inp} name="instituteAddress" value={form.instituteAddress} onChange={upd} placeholder="Address of college" />
            </Field>
            <Field label="Nodal Officer Name" hint="The person at your college who approves scholarship applications">
              <input style={inp} name="nodalOfficerName" value={form.nodalOfficerName} onChange={upd} placeholder="e.g. Prof. Ravi Kumar" />
            </Field>
            <Field label="Nodal Officer Designation" hint="e.g. Principal, Scholarship Coordinator">
              <input style={inp} name="nodalOfficerDesignation" value={form.nodalOfficerDesignation} onChange={upd} placeholder="e.g. Principal" />
            </Field>
            <Field label="Nodal Officer Email" hint="Contact email to follow up on Institute Verification Pending status">
              <input style={inp} name="nodalOfficerEmail" type="email" value={form.nodalOfficerEmail} onChange={upd} placeholder="nodal@college.edu" />
            </Field>
            <Field label="Nodal Officer Contact" hint="Phone number to call if your application is stuck at the institute">
              <input style={inp} name="nodalOfficerContact" value={form.nodalOfficerContact} onChange={upd} placeholder="10-digit number" />
            </Field>
          </div>
          <InfoBox>
            <strong>Why is this important?</strong> Your Institute Nodal Officer verifies your scholarship application on the portal.
            If your application shows <strong>"Institute Verification Pending"</strong>, it means this officer has not yet approved it.
            Contact them immediately with your application number and ask them to complete verification before the deadline.
          </InfoBox>
        </section>

        {/* ── SECTION 4: Eligibility ──────────────────────────────────── */}
        <section className="panel">
          <SectionHeader icon={CheckCircle2} title="Scholarship Eligibility" subtitle="Helps us find and match the right scholarships for you" progress={p4} />
          <div style={grid}>
            <Field label="Category" required hint="Your caste/community category as on your caste certificate">
              <select style={inp} name="category" value={form.category} onChange={upd}>
                <option value="">Select category</option>
                <option>SC (Scheduled Caste)</option><option>ST (Scheduled Tribe)</option>
                <option>OBC (Other Backward Class)</option><option>General</option>
                <option>EWS (Economically Weaker Section)</option><option>Minority</option>
              </select>
            </Field>
            <Field label="Annual Family Income (₹)" required hint="Total income of all earning members in your family per year (as on income certificate)">
              <input style={inp} name="annualIncome" type="number" min="0" value={form.annualIncome} onChange={upd} placeholder="e.g. 150000" />
            </Field>
            <Field label="Disability Status" hint="Do you have a disability certificate from a government hospital?">
              <select style={inp} name="disabilityStatus" value={form.disabilityStatus} onChange={upd}>
                <option>Unknown</option><option>Yes</option><option>No</option>
              </select>
            </Field>
            <Field label="Minority Status" hint="Do you belong to a notified minority community (Muslim, Christian, Sikh, Buddhist, Parsi, Jain)?">
              <select style={inp} name="minorityStatus" value={form.minorityStatus} onChange={upd}>
                <option>Unknown</option><option>Yes</option><option>No</option>
              </select>
            </Field>
            <Field label="Hosteller / Day Scholar" hint="Hostellers may get higher scholarship amounts for accommodation">
              <select style={inp} name="hosteller" value={form.hosteller} onChange={upd}>
                <option>Unknown</option><option>Hosteller</option><option>Day Scholar</option>
              </select>
            </Field>
            <Field label="Orphan / Single Parent" hint="Some scholarships give priority to students with no parents or a single parent">
              <select style={inp} name="orphanStatus" value={form.orphanStatus} onChange={upd}>
                <option>Unknown</option><option>Yes</option><option>No</option>
              </select>
            </Field>
            <Field label="First Graduate in Family" hint="If you are the first person in your family to go to college, many scholarships give you extra preference">
              <select style={inp} name="firstGraduate" value={form.firstGraduate} onChange={upd}>
                <option>Unknown</option><option>Yes</option><option>No</option>
              </select>
            </Field>
          </div>
        </section>

        {/* ── SECTION 5: Bank & DBT ───────────────────────────────────── */}
        <section className="panel">
          <SectionHeader icon={CreditCard} title="Bank & DBT Information" subtitle="Scholarship money comes directly to your bank — these details must be 100% correct" progress={p5} />
          <div style={grid}>
            <Field label="Bank Name" required hint="Name of the bank where your scholarship should be credited">
              <input style={inp} name="bankName" value={form.bankName} onChange={upd} placeholder="e.g. State Bank of India" />
            </Field>
            <Field label="Account Holder Name" hint="Name on the bank account — must match your Aadhaar name exactly">
              <input style={inp} name="accountHolderName" value={form.accountHolderName} onChange={upd} placeholder="As on bank passbook" />
            </Field>
            <Field label="Account Number" required hint="Your savings or current account number (not credit card number)">
              <input style={inp} name="accountNumber" value={form.accountNumber} onChange={upd} placeholder="e.g. 31234567890" />
            </Field>
            <Field label="IFSC Code" required hint="11-character code found on your bank passbook or cheque leaf (e.g. SBIN0001234)">
              <input style={inp} name="ifscCode" value={form.ifscCode} onChange={upd} placeholder="e.g. SBIN0001234" maxLength={11} />
            </Field>
            <Field label="Aadhaar–Bank Linking Status" required hint="Is your Aadhaar number linked to this bank account? Required for DBT scholarships.">
              <select style={inp} name="aadhaarBankLinked" value={form.aadhaarBankLinked} onChange={upd}>
                <option>Unknown</option><option>Yes</option><option>No</option>
              </select>
              <LearnMore />
            </Field>
            <Field label="DBT Enabled" required hint="Direct Benefit Transfer must be active on your account to receive scholarship money.">
              <select style={inp} name="dbtEnabled" value={form.dbtEnabled} onChange={upd}>
                <option>Unknown</option><option>Yes</option><option>No</option>
              </select>
              <LearnMore />
            </Field>
            <Field label="Bank Account Active" required hint="If your account is dormant (no transactions in 2+ years), it cannot receive scholarship payments.">
              <select style={inp} name="bankAccountActive" value={form.bankAccountActive} onChange={upd}>
                <option>Unknown</option><option>Yes</option><option>No</option>
              </select>
            </Field>
            <Field label="NPCI Mapping Status" hint="NPCI maps your Aadhaar to your bank for payment routing. Check with your bank.">
              <select style={inp} name="npciMapping" value={form.npciMapping} onChange={upd}>
                <option>Unknown</option><option>Yes — Mapped</option><option>No — Not mapped</option>
              </select>
              <LearnMore />
            </Field>
          </div>
          <InfoBox>
            <strong>Why does this matter so much?</strong> Over 60% of scholarship payment failures happen because of wrong bank details,
            Aadhaar not linked to bank, or DBT not enabled. Make sure your bank account name <strong>exactly matches</strong> your Aadhaar name
            before submitting any scholarship application.
          </InfoBox>
        </section>

        {/* Save button */}
        <button
          className="primary-btn"
          type="submit"
          disabled={pageStatus.saving}
          style={{ padding: "14px 0", fontSize: 16, borderRadius: 12 }}
        >
          {pageStatus.saving ? "Saving Profile..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
