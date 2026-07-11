import React from "react";
import {
  AlertTriangle, BookOpen, Building2, CheckCircle2,
  CreditCard, User, GraduationCap, Sparkles, Upload, FileCheck, Accessibility
} from "lucide-react";
import { profileApi } from "../services/api.js";

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
  fullName:"", dateOfBirth:"", gender:"", mobile:"", email:"",
  aadhaarMasked:"", state:"Karnataka", district:"", taluk:"", village:"",
  address:"", pinCode:"",
  educationLevel:"", course:"", semester:"", admissionYear:"",
  currentAcademicYear:"", universityBoard:"", marksPercentage:"", admissionType:"",
  collegeName:"", instituteCode:"", instituteAddress:"",
  nodalOfficerName:"", nodalOfficerDesignation:"", nodalOfficerEmail:"", nodalOfficerContact:"",
  category:"", subcategory:"", parentProfession:"", annualIncome:"", disabilityStatus:"Unknown",
  disabilityType:"", disabilityPercentage:"", udidNumber:"", udidCardPath:"",
  minorityStatus:"Unknown",
  hosteller:"Unknown", orphanStatus:"Unknown", firstGraduate:"Unknown",
  bankName:"", accountHolderName:"", accountNumber:"", ifscCode:"",
  aadhaarBankLinked:"Unknown", dbtEnabled:"Unknown", bankAccountActive:"Unknown", npciMapping:"Unknown",
  availableDocuments:[]
};

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

// ── Shared input style ──
const INP = {
  padding: "10px 13px", borderRadius: 10, fontSize: 13.5,
  border: "1.5px solid #e2e8f0", background: "#f8fafc",
  color: "#0f172a", width: "100%", boxSizing: "border-box",
  outline: "none", transition: "border-color .15s, box-shadow .15s",
  fontFamily: "inherit"
};

const GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 18 };

// ── Field wrapper ──
function Field({ label, required, hint, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontWeight: 700, fontSize: 12.5, color: "#374151", display: "flex", alignItems: "center", gap: 4 }}>
        {label}
        {required
          ? <span style={{ color: "#dc2626", fontSize: 9 }} title="Required">●</span>
          : <span style={{ color: "#94a3b8", fontSize: 9 }} title="Optional">○</span>
        }
      </span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{hint}</span>}
    </label>
  );
}

const SECTION_COLORS = {
  blue:   { bg: "#eff6ff", icon: "#2563eb", border: "#bfdbfe", bar: "linear-gradient(90deg,#2563eb,#0891b2)" },
  teal:   { bg: "#f0fdfa", icon: "#0d9488", border: "#99f6e4", bar: "linear-gradient(90deg,#0d9488,#22c55e)" },
  violet: { bg: "#f5f3ff", icon: "#7c3aed", border: "#ddd6fe", bar: "linear-gradient(90deg,#7c3aed,#6d28d9)" },
  green:  { bg: "#f0fdf4", icon: "#16a34a", border: "#bbf7d0", bar: "linear-gradient(90deg,#16a34a,#0d9488)" },
  amber:  { bg: "#fffbeb", icon: "#d97706", border: "#fde68a", bar: "linear-gradient(90deg,#d97706,#f59e0b)" },
};

function SectionCard({ icon: Icon, title, subtitle, progress, color = "blue", children, infoBox }) {
  const c = SECTION_COLORS[color];
  const pct = progress ? Math.round((progress.filled / progress.total) * 100) : null;

  return (
    <div style={{
      background: "white", borderRadius: 18, overflow: "hidden",
      boxShadow: "0 2px 16px rgba(15,23,42,.07)", border: `1.5px solid ${c.border}`
    }}>
      {/* Colored stripe */}
      <div style={{ height: 4, background: c.bar }} />

      {/* Section header */}
      <div style={{
        padding: "18px 24px 16px",
        display: "flex", alignItems: "center", gap: 14,
        borderBottom: "1px solid #f1f5f9"
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: c.bg, border: `1.5px solid ${c.border}`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon size={20} color={c.icon} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 2px", fontSize: 15.5, fontWeight: 800, color: "#0f172a" }}>{title}</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{subtitle}</p>
        </div>
        {pct !== null && (
          <div style={{ textAlign: "right", flexShrink: 0, minWidth: 70 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: pct === 100 ? "#16a34a" : c.icon }}>{pct}%</span>
            <div style={{ width: 64, height: 5, background: "#e2e8f0", borderRadius: 99, marginTop: 4 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: c.bar, borderRadius: 99, transition: "width .4s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Fields */}
      <div style={{ padding: "22px 24px" }}>
        <div style={GRID}>{children}</div>
        {infoBox && (
          <div style={{
            marginTop: 18, padding: "14px 16px", borderRadius: 12,
            background: c.bg, border: `1.5px solid ${c.border}`,
            display: "flex", gap: 12, alignItems: "flex-start"
          }}>
            <AlertTriangle size={16} color={c.icon} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7 }}>{infoBox}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function LearnMore() {
  return (
    <a href="/awareness" style={{ fontSize: 11.5, color: "#2563eb", textDecoration: "none", fontWeight: 700, marginTop: 1 }}>
      Don't know? Learn More →
    </a>
  );
}

export default function Profile() {
  const [form, setForm] = React.useState(initialForm);
  const [insights, setInsights] = React.useState(null);
  const [pageStatus, setPageStatus] = React.useState({ loading: true, saving: false, error: "", success: "" });
  const [udidUpload, setUdidUpload] = React.useState({ uploading: false, done: false, error: "" });

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

  // Focus/blur handlers for input glow
  function onFocus(e) {
    e.target.style.borderColor = "#2563eb";
    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,.1)";
    e.target.style.background = "#ffffff";
  }
  function onBlur(e) {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
    e.target.style.background = "#f8fafc";
  }

  async function handleUdidUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUdidUpload({ uploading: true, done: false, error: "" });
    try {
      const fd = new FormData();
      fd.append("udidCard", file);
      const res = await fetch("/api/profile/me/udid-card", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setForm(s => ({ ...s, udidCardPath: data.profile?.udidCardPath || "uploaded" }));
      setUdidUpload({ uploading: false, done: true, error: "" });
    } catch (err) {
      setUdidUpload({ uploading: false, done: false, error: err.message });
    }
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

  const inp = { ...INP, onFocus, onBlur };

  if (pageStatus.loading) return (
    <div className="page-stack" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #dbeafe", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ color: "#64748b" }}>Loading profile…</p>
      </div>
    </div>
  );

  return (
    <div className="page-stack">

      {/* ── Page header ── */}
      <div style={{ marginBottom: 4 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#0d9488", margin: "0 0 6px" }}>
          Student Profile
        </p>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-.02em" }}>
          Your Scholarship Application Profile
        </h2>
        <p style={{ fontSize: 13.5, color: "#64748b", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          Every field you fill helps us match you to the right scholarships and prevent rejections.
          <span style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ color: "#dc2626", fontSize: 9 }}>●</span>
              <span style={{ fontSize: 12, color: "#475569" }}>Required</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ color: "#94a3b8", fontSize: 9 }}>○</span>
              <span style={{ fontSize: 12, color: "#475569" }}>Optional</span>
            </span>
          </span>
        </p>
      </div>

      {/* ── Overall progress bar ── */}
      <div style={{
        background: "white", borderRadius: 16, padding: "18px 22px",
        boxShadow: "0 2px 12px rgba(15,23,42,.07)", border: "1.5px solid #e2e8f0",
        display: "flex", alignItems: "center", gap: 18
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#374151" }}>Profile Completeness</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: overallPct === 100 ? "#16a34a" : "#2563eb" }}>{overallPct}%</span>
          </div>
          <div style={{ height: 10, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              width: `${overallPct}%`, height: "100%", borderRadius: 99, transition: "width .5s ease",
              background: overallPct === 100
                ? "linear-gradient(90deg,#16a34a,#0d9488)"
                : "linear-gradient(90deg,#2563eb,#0891b2)"
            }} />
          </div>
        </div>
        {overallPct === 100
          ? <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: "#f0fdf4", border: "2px solid #bbf7d0",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <CheckCircle2 size={20} color="#16a34a" />
            </div>
          : <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748b", flexShrink: 0, whiteSpace: "nowrap" }}>
              {totalRequired - totalFilled} required fields left
            </span>
        }
      </div>

      {pageStatus.error && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "#fef2f2", border: "1.5px solid #fecdd3", color: "#dc2626", fontSize: 14 }}>
          {pageStatus.error}
        </div>
      )}
      {pageStatus.success && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#16a34a", fontSize: 14 }}>
          {pageStatus.success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── 1. Personal ── */}
        <SectionCard icon={User} title="Personal Information"
          subtitle="Used to identify you on scholarship applications"
          progress={p1} color="blue"
        >
          <Field label="Full Name" required hint="Enter your name exactly as it appears on your Aadhaar card">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="fullName" value={form.fullName} onChange={upd} placeholder="e.g. Shalini H R" />
          </Field>
          <Field label="Date of Birth" required hint="Format: DD-MM-YYYY (as on your marksheet or Aadhaar)">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="dateOfBirth" value={form.dateOfBirth} onChange={upd} placeholder="e.g. 14-02-2002" />
          </Field>
          <Field label="Gender" required hint="As recorded in your school/college records">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="gender" value={form.gender} onChange={upd}>
              <option value="">Select gender</option>
              <option>Female</option><option>Male</option><option>Transgender</option><option>Other</option>
            </select>
          </Field>
          <Field label="Mobile Number" required hint="This number will receive OTPs on NSP/SSP portal — keep it active">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="mobile" value={form.mobile} onChange={upd} placeholder="10-digit mobile" maxLength={10} />
          </Field>
          <Field label="Email Address" hint="Used for scholarship communication and portal login">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="email" type="email" value={form.email} onChange={upd} placeholder="your@email.com" />
          </Field>
          <Field label="Aadhaar Number (Last 4 digits)" hint="We only store last 4 digits for safety. Never share your full Aadhaar here.">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="aadhaarMasked" value={form.aadhaarMasked} onChange={upd} placeholder="XXXX-XXXX-1234" maxLength={4} />
          </Field>
          <Field label="State" required hint="State where you are currently studying">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="state" value={form.state} onChange={upd}>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="District" required hint="District of your college / school">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="district" value={form.district} onChange={upd} placeholder="e.g. Davanagere" />
          </Field>
          <Field label="Taluk" hint="Taluk where you belong (for state-level scholarship matching)">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="taluk" value={form.taluk} onChange={upd} placeholder="e.g. Channagiri" />
          </Field>
          <Field label="Village / City" hint="Your permanent residential village or city name">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="village" value={form.village} onChange={upd} placeholder="e.g. Harihar" />
          </Field>
          <Field label="Full Address" hint="Permanent address as on your income/caste certificate">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="address" value={form.address} onChange={upd} placeholder="House no, street, locality…" />
          </Field>
          <Field label="PIN Code" hint="6-digit postal code of your permanent address">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="pinCode" value={form.pinCode} onChange={upd} placeholder="e.g. 577001" maxLength={6} />
          </Field>
        </SectionCard>

        {/* ── 2. Academic ── */}
        <SectionCard icon={GraduationCap} title="Academic Information"
          subtitle="Determines which scholarships you are eligible for"
          progress={p2} color="teal"
        >
          <Field label="Education Level" required hint="Current level of education you are enrolled in">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="educationLevel" value={form.educationLevel} onChange={upd}>
              <option value="">Select level</option>
              <option>School (Class 1–10)</option><option>PUC / Class 11–12</option>
              <option>Diploma / ITI</option><option>Degree (UG)</option>
              <option>Post Graduate (PG)</option><option>PhD / Research</option>
            </select>
          </Field>
          <Field label="Current Course" required hint="Full name of the course you are studying (e.g. B.Com, MCA, B.Tech)">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="course" value={form.course} onChange={upd} placeholder="e.g. MCA / B.Tech / B.Com" />
          </Field>
          <Field label="Semester / Class" required hint="Current semester or class you are studying in">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="semester" value={form.semester} onChange={upd} placeholder="e.g. 4th Sem / Class 12" />
          </Field>
          <Field label="Admission Year" hint="Year you were first admitted to this course">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="admissionYear" value={form.admissionYear} onChange={upd} placeholder="e.g. 2023" maxLength={4} />
          </Field>
          <Field label="Current Academic Year" hint="e.g. 2025–2026">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="currentAcademicYear" value={form.currentAcademicYear} onChange={upd} placeholder="2025–2026" />
          </Field>
          <Field label="University / Board" hint="Name of the university or board you are affiliated to">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="universityBoard" value={form.universityBoard} onChange={upd} placeholder="e.g. VTU / Karnataka Board" />
          </Field>
          <Field label="Previous Marks %" required hint="Your last exam marks percentage or CGPA (used for merit-based scholarships)">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="marksPercentage" type="number" min="0" max="100" value={form.marksPercentage} onChange={upd} placeholder="e.g. 82" />
          </Field>
          <Field label="Admission Type" hint="Is this a fresh application or renewal of a previous scholarship?">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="admissionType" value={form.admissionType} onChange={upd}>
              <option value="">Select type</option>
              <option>Fresh</option><option>Renewal</option>
            </select>
          </Field>
        </SectionCard>

        {/* ── 3. Institute ── */}
        <SectionCard icon={Building2} title="Institute Information"
          subtitle="Required for institute verification on NSP/SSP"
          progress={p3} color="violet"
          infoBox={
            <><strong>Why is this important?</strong> Your Institute Nodal Officer verifies your scholarship application on the portal.
            If your application shows <strong>"Institute Verification Pending"</strong>, it means this officer has not yet approved it.
            Contact them immediately with your application number and ask them to complete verification before the deadline.</>
          }
        >
          <Field label="Institute Name" required hint="Full official name of your college or school">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="collegeName" value={form.collegeName} onChange={upd} placeholder="e.g. GM University" />
          </Field>
          <Field label="Institute Code" hint="AISHE or NSP institute code (check with your admin office)">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="instituteCode" value={form.instituteCode} onChange={upd} placeholder="e.g. C-12345" />
          </Field>
          <Field label="Institute Address" hint="Full address of the college for verification records">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="instituteAddress" value={form.instituteAddress} onChange={upd} placeholder="Address of college" />
          </Field>
          <Field label="Nodal Officer Name" hint="The person at your college who approves scholarship applications">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="nodalOfficerName" value={form.nodalOfficerName} onChange={upd} placeholder="e.g. Prof. Ravi Kumar" />
          </Field>
          <Field label="Nodal Officer Designation" hint="e.g. Principal, Scholarship Coordinator">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="nodalOfficerDesignation" value={form.nodalOfficerDesignation} onChange={upd} placeholder="e.g. Principal" />
          </Field>
          <Field label="Nodal Officer Email" hint="Contact email to follow up on Institute Verification Pending status">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="nodalOfficerEmail" type="email" value={form.nodalOfficerEmail} onChange={upd} placeholder="nodal@college.edu" />
          </Field>
          <Field label="Nodal Officer Contact" hint="Phone number to call if your application is stuck at the institute">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="nodalOfficerContact" value={form.nodalOfficerContact} onChange={upd} placeholder="10-digit number" />
          </Field>
        </SectionCard>

        {/* ── 4. Eligibility ── */}
        <SectionCard icon={CheckCircle2} title="Scholarship Eligibility"
          subtitle="Helps us find and match the right scholarships for you"
          progress={p4} color="green"
        >
          <Field label="Category" required hint="Your caste/community category as on your caste certificate">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="category" value={form.category} onChange={upd}>
              <option value="">Select category</option>
              <option>SC (Scheduled Caste)</option><option>ST (Scheduled Tribe)</option>
              <option>OBC (Other Backward Class)</option><option>General</option>
              <option>EWS (Economically Weaker Section)</option><option>Minority</option>
            </select>
          </Field>
          {form.category?.includes("OBC") && (
            <Field label="OBC Sub-Category" hint="Karnataka OBC sub-category as on your caste certificate. Category-1 has higher income limit (₹2.5L) than 2A/3A/2B/3B (₹1L).">
              <select style={INP} onFocus={onFocus} onBlur={onBlur} name="subcategory" value={form.subcategory} onChange={upd}>
                <option value="">Select sub-category</option>
                <option>Category-1</option><option>NT-SNT (Nomadic Tribes)</option>
                <option>2A</option><option>3A</option><option>2B</option><option>3B</option>
              </select>
            </Field>
          )}
          <Field label="Parent's Profession" hint="Required for SSP Defence, Labour Welfare and Agriculture scholarships">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="parentProfession" value={form.parentProfession} onChange={upd}>
              <option value="">Not specified</option>
              <option>None</option>
              <option>Defence (Army/Navy/Air Force)</option>
              <option>Construction Worker</option>
              <option>Farmer</option>
              <option>Government Employee</option>
              <option>Private Employee</option>
              <option>Self Employed</option>
            </select>
          </Field>
          <Field label="Annual Family Income (₹)" required hint="Total income of all earning members in your family per year (as on income certificate)">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="annualIncome" type="number" min="0" value={form.annualIncome} onChange={upd} placeholder="e.g. 150000" />
          </Field>
          <Field label="Disability Status" hint="Do you have a disability certificate from a government hospital?">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="disabilityStatus" value={form.disabilityStatus} onChange={upd}>
              <option>Unknown</option><option>Yes</option><option>No</option>
            </select>
          </Field>
          <Field label="Minority Status" hint="Do you belong to a notified minority community (Muslim, Christian, Sikh, Buddhist, Parsi, Jain)?">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="minorityStatus" value={form.minorityStatus} onChange={upd}>
              <option>Unknown</option><option>Yes</option><option>No</option>
            </select>
          </Field>
          <Field label="Hosteller / Day Scholar" hint="Hostellers may get higher scholarship amounts for accommodation">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="hosteller" value={form.hosteller} onChange={upd}>
              <option>Unknown</option><option>Hosteller</option><option>Day Scholar</option>
            </select>
          </Field>
          <Field label="Orphan / Single Parent" hint="Some scholarships give priority to students with no parents or a single parent">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="orphanStatus" value={form.orphanStatus} onChange={upd}>
              <option>Unknown</option><option>Yes</option><option>No</option>
            </select>
          </Field>
          <Field label="First Graduate in Family" hint="If you are the first person in your family to go to college, many scholarships give you extra preference">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="firstGraduate" value={form.firstGraduate} onChange={upd}>
              <option>Unknown</option><option>Yes</option><option>No</option>
            </select>
          </Field>
        </SectionCard>

        {/* ── Disability Details (shown only when disabilityStatus === "Yes") ── */}
        {form.disabilityStatus === "Yes" && (
          <div style={{
            background: "white", borderRadius: 18, overflow: "hidden",
            boxShadow: "0 2px 16px rgba(15,23,42,.07)", border: "1.5px solid #ddd6fe"
          }}>
            <div style={{ height: 4, background: "linear-gradient(90deg,#7c3aed,#6366f1)" }} />
            <div style={{ padding: "18px 24px 16px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: "#f5f3ff", border: "1.5px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Accessibility size={20} color="#7c3aed" />
              </div>
              <div>
                <h3 style={{ margin: "0 0 2px", fontSize: 15.5, fontWeight: 800, color: "#0f172a" }}>Disability Details</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Required for AICTE Saksham & PMS-Disability scholarships</p>
              </div>
            </div>
            <div style={{ padding: "22px 24px" }}>
              <div style={GRID}>
                <Field label="Type of Disability" hint="Select the category that matches your disability certificate">
                  <select style={INP} onFocus={onFocus} onBlur={onBlur} name="disabilityType" value={form.disabilityType} onChange={upd}>
                    <option value="">Select disability type</option>
                    <option>Visual Impairment</option>
                    <option>Hearing Impairment</option>
                    <option>Speech and Language Disability</option>
                    <option>Locomotor Disability</option>
                    <option>Intellectual Disability</option>
                    <option>Specific Learning Disability</option>
                    <option>Mental Illness</option>
                    <option>Autism Spectrum Disorder</option>
                    <option>Cerebral Palsy</option>
                    <option>Chronic Neurological Conditions</option>
                    <option>Multiple Disabilities</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Disability Percentage (%)" hint="As on your disability certificate from government hospital / CMO">
                  <input style={INP} onFocus={onFocus} onBlur={onBlur}
                    name="disabilityPercentage" type="number" min="1" max="100"
                    value={form.disabilityPercentage} onChange={upd} placeholder="e.g. 45" />
                  {form.disabilityPercentage !== "" && Number(form.disabilityPercentage) < 40 && (
                    <span style={{ fontSize: 11, color: "#d97706", fontWeight: 600 }}>⚠ Most scholarships require ≥40% disability</span>
                  )}
                  {form.disabilityPercentage !== "" && Number(form.disabilityPercentage) >= 40 && (
                    <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Eligible for disability scholarships</span>
                  )}
                </Field>
                <Field label="UDID Number" hint="Unique Disability ID from swavlambancard.gov.in">
                  <input style={INP} onFocus={onFocus} onBlur={onBlur}
                    name="udidNumber" value={form.udidNumber} onChange={upd}
                    placeholder="e.g. KA-DIST-2024-XXXXX" />
                </Field>
              </div>

              {/* UDID Card Upload — full width below grid */}
              <div style={{ marginTop: 18 }}>
                <div style={{
                  border: `2px dashed ${form.udidCardPath || udidUpload.done ? "#16a34a" : "#c4b5fd"}`,
                  borderRadius: 14, padding: "18px 20px",
                  background: form.udidCardPath || udidUpload.done ? "#f0fdf4" : "#faf5ff",
                  transition: "all .2s"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: form.udidCardPath || udidUpload.done ? "#dcfce7" : "#ede9fe",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {form.udidCardPath || udidUpload.done
                        ? <FileCheck size={22} color="#16a34a" />
                        : <Upload size={22} color="#7c3aed" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13.5, color: "#1e293b" }}>
                        UDID Card / Disability Certificate
                        <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: 5, fontWeight: 400 }}>○ optional</span>
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>JPEG, PNG or PDF — max 10 MB</p>
                      {form.udidCardPath && !udidUpload.done && (
                        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#16a34a", fontWeight: 600 }}>✓ Already uploaded</p>
                      )}
                      {udidUpload.done && (
                        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#16a34a", fontWeight: 600 }}>✓ Uploaded successfully</p>
                      )}
                      {udidUpload.error && (
                        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#dc2626", fontWeight: 600 }}>✗ {udidUpload.error}</p>
                      )}
                    </div>
                    <label style={{
                      padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: udidUpload.uploading ? "#94a3b8" : "linear-gradient(135deg,#7c3aed,#6366f1)",
                      color: "white", cursor: udidUpload.uploading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                      boxShadow: "0 2px 8px rgba(124,58,237,.3)"
                    }}>
                      {udidUpload.uploading
                        ? <><div style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Uploading…</>
                        : <><Upload size={14} /> {form.udidCardPath ? "Replace File" : "Choose File"}</>
                      }
                      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                        style={{ display: "none" }} onChange={handleUdidUpload} disabled={udidUpload.uploading} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. Bank & DBT ── */}
        <SectionCard icon={CreditCard} title="Bank & DBT Information"
          subtitle="Scholarship money comes directly to your bank — these details must be 100% correct"
          progress={p5} color="amber"
          infoBox={
            <><strong>Why does this matter so much?</strong> Over 60% of scholarship payment failures happen because of wrong bank details,
            Aadhaar not linked to bank, or DBT not enabled. Make sure your bank account name <strong>exactly matches</strong> your Aadhaar name
            before submitting any scholarship application.</>
          }
        >
          <Field label="Bank Name" required hint="Name of the bank where your scholarship should be credited">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="bankName" value={form.bankName} onChange={upd} placeholder="e.g. State Bank of India" />
          </Field>
          <Field label="Account Holder Name" hint="Name on the bank account — must match your Aadhaar name exactly">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="accountHolderName" value={form.accountHolderName} onChange={upd} placeholder="As on bank passbook" />
          </Field>
          <Field label="Account Number" required hint="Your savings or current account number (not credit card number)">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="accountNumber" value={form.accountNumber} onChange={upd} placeholder="e.g. 31234567890" />
          </Field>
          <Field label="IFSC Code" required hint="11-character code found on your bank passbook or cheque leaf (e.g. SBIN0001234)">
            <input style={INP} onFocus={onFocus} onBlur={onBlur} name="ifscCode" value={form.ifscCode} onChange={upd} placeholder="e.g. SBIN0001234" maxLength={11} />
          </Field>
          <Field label="Bank Account Active" hint="If your account is dormant (no transactions in 2+ years), it cannot receive scholarship payments.">
            <select style={INP} onFocus={onFocus} onBlur={onBlur} name="bankAccountActive" value={form.bankAccountActive} onChange={upd}>
              <option>Unknown</option><option>Yes</option><option>No</option>
            </select>
          </Field>

          {/* ── NPCI BASE DBT Check Widget ── */}
          <div style={{ gridColumn: "1 / -1", borderRadius: 14, overflow: "hidden", border: "1.5px solid #bfdbfe", background: "#eff6ff" }}>
            {/* Header */}
            <div style={{ padding: "14px 18px", background: "linear-gradient(135deg,#1e40af,#0891b2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: ".07em" }}>Government Portal</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "white" }}>Check Aadhaar–Bank Seeding (NPCI BASE)</p>
              </div>
              <a
                href="https://myaadhaar.uidai.gov.in/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  background: "white", color: "#1e40af", textDecoration: "none", flexShrink: 0
                }}
              >
                Open NPCI Portal ↗
              </a>
            </div>

            {/* Steps */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #bfdbfe" }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#1e40af" }}>Follow these steps on myAadhaar portal, then mark your status below:</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
                {[
                  "Open myaadhaar.uidai.gov.in",
                  "Login with your Aadhaar & OTP",
                  'Click "Aadhaar Services"',
                  'Select "Bank Seeding Status"',
                  "Check result — Seeded or Not Seeded",
                  "Come back here and mark your status ↓"
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#2563eb", color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: "#1e3a5f", lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status buttons */}
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#1e40af" }}>After checking, mark your status:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

                {/* Aadhaar Bank Linked */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Aadhaar–Bank Linked?</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Yes", "No"].map(val => (
                      <button key={val} type="button"
                        onClick={() => upd({ target: { name: "aadhaarBankLinked", value: val } })}
                        style={{
                          flex: 1, padding: "9px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "2px solid",
                          borderColor: form.aadhaarBankLinked === val ? (val === "Yes" ? "#16a34a" : "#dc2626") : "#e2e8f0",
                          background: form.aadhaarBankLinked === val ? (val === "Yes" ? "#f0fdf4" : "#fef2f2") : "white",
                          color: form.aadhaarBankLinked === val ? (val === "Yes" ? "#15803d" : "#dc2626") : "#64748b"
                        }}>
                        {val === "Yes" ? "✓ Seeded" : "✗ Not Seeded"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DBT Enabled */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>DBT Enabled on Account?</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Yes", "No"].map(val => (
                      <button key={val} type="button"
                        onClick={() => upd({ target: { name: "dbtEnabled", value: val } })}
                        style={{
                          flex: 1, padding: "9px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "2px solid",
                          borderColor: form.dbtEnabled === val ? (val === "Yes" ? "#16a34a" : "#dc2626") : "#e2e8f0",
                          background: form.dbtEnabled === val ? (val === "Yes" ? "#f0fdf4" : "#fef2f2") : "white",
                          color: form.dbtEnabled === val ? (val === "Yes" ? "#15803d" : "#dc2626") : "#64748b"
                        }}>
                        {val === "Yes" ? "✓ Enabled" : "✗ Not Enabled"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* NPCI Mapping */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>NPCI Mapping Status?</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[["Yes — Mapped", "✓ Mapped"], ["No — Not mapped", "✗ Not Mapped"]].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => upd({ target: { name: "npciMapping", value: val } })}
                        style={{
                          flex: 1, padding: "9px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "2px solid",
                          borderColor: form.npciMapping === val ? (val.includes("Yes") ? "#16a34a" : "#dc2626") : "#e2e8f0",
                          background: form.npciMapping === val ? (val.includes("Yes") ? "#f0fdf4" : "#fef2f2") : "white",
                          color: form.npciMapping === val ? (val.includes("Yes") ? "#15803d" : "#dc2626") : "#64748b"
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary status */}
                <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: (form.aadhaarBankLinked === "Yes" && form.dbtEnabled === "Yes") ? "#f0fdf4" : "#fff7ed", border: `1.5px solid ${(form.aadhaarBankLinked === "Yes" && form.dbtEnabled === "Yes") ? "#bbf7d0" : "#fed7aa"}` }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: (form.aadhaarBankLinked === "Yes" && form.dbtEnabled === "Yes") ? "#15803d" : "#c2410c" }}>
                      {(form.aadhaarBankLinked === "Yes" && form.dbtEnabled === "Yes") ? "✓ DBT Ready — scholarship money will reach you" : "⚠ DBT not confirmed — fix before applying"}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Save button ── */}
        <button type="submit" disabled={pageStatus.saving} style={{
          padding: "15px 0", fontSize: 16, fontWeight: 800, borderRadius: 14,
          border: "none", cursor: pageStatus.saving ? "not-allowed" : "pointer",
          background: pageStatus.saving ? "#94a3b8" : "linear-gradient(135deg,#2563eb 0%,#0891b2 100%)",
          color: "white", boxShadow: pageStatus.saving ? "none" : "0 4px 16px rgba(37,99,235,.35)",
          transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          {pageStatus.saving
            ? <><div style={{ width: 18, height: 18, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Saving Profile…</>
            : <><Sparkles size={17} /> Save Profile</>
          }
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
