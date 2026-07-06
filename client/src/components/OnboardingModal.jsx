import React from "react";
import { useNavigate } from "react-router-dom";
import { profileApi } from "../services/api.js";
import {
  User, GraduationCap, CreditCard, Accessibility,
  ChevronRight, ChevronLeft, CheckCircle2, X, Upload, FileCheck, Sparkles
} from "lucide-react";

const STEPS = [
  { id: "personal",    label: "Personal",    icon: User },
  { id: "academic",    label: "Academic",    icon: GraduationCap },
  { id: "eligibility", label: "Eligibility", icon: CheckCircle2 },
  { id: "bank",        label: "Bank & DBT",  icon: CreditCard },
];

const INP = {
  padding: "10px 13px", borderRadius: 10, fontSize: 13.5,
  border: "1.5px solid #e2e8f0", background: "#f8fafc",
  color: "#0f172a", width: "100%", boxSizing: "border-box",
  outline: "none", fontFamily: "inherit"
};

function Field({ label, hint, required, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontWeight: 700, fontSize: 12.5, color: "#374151" }}>
        {label}
        {required
          ? <span style={{ color: "#dc2626", fontSize: 9, marginLeft: 4 }}>●</span>
          : <span style={{ color: "#94a3b8", fontSize: 9, marginLeft: 4 }}>○</span>}
      </span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "#94a3b8" }}>{hint}</span>}
    </label>
  );
}

function onFocus(e) {
  e.target.style.borderColor = "#2563eb";
  e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,.1)";
  e.target.style.background = "#fff";
}
function onBlur(e) {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
  e.target.style.background = "#f8fafc";
}

export default function OnboardingModal({ onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [udidUpload, setUdidUpload] = React.useState({ uploading: false, done: false, error: "" });
  const [form, setForm] = React.useState({
    fullName: "", gender: "", mobile: "", state: "Karnataka", district: "",
    educationLevel: "", course: "", semester: "", marksPercentage: "",
    category: "", annualIncome: "", disabilityStatus: "Unknown",
    disabilityType: "", disabilityPercentage: "", udidNumber: "",
    minorityStatus: "Unknown", hosteller: "Unknown",
    bankName: "", accountNumber: "", ifscCode: "",
    aadhaarBankLinked: "Unknown", dbtEnabled: "Unknown"
  });

  function upd(e) {
    setForm(s => ({ ...s, [e.target.name]: e.target.value }));
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
        headers: { Authorization: `Bearer ${localStorage.getItem("scholarsense_token")}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setUdidUpload({ uploading: false, done: true, error: "" });
    } catch (err) {
      setUdidUpload({ uploading: false, done: false, error: err.message });
    }
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await profileApi.saveMine(form);
      localStorage.setItem("scholarsense_onboarded", "true");
      onComplete();
      navigate("/dashboard");
    } catch {
      setSaving(false);
    }
  }

  function skip() {
    localStorage.setItem("scholarsense_onboarded", "true");
    onComplete();
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        background: "white", borderRadius: 24, width: "100%", maxWidth: 560,
        maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(15,23,42,.35)"
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "22px 28px 18px",
          background: "linear-gradient(135deg,#eff6ff 0%,#f0fdfa 100%)",
          borderBottom: "1px solid #e2e8f0", flexShrink: 0
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#0d9488" }}>
                Welcome to ScholarSense AI
              </p>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
                Let's set up your profile
              </h2>
              <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
                Takes 2 minutes — helps us find the right scholarships for you
              </p>
            </div>
            <button onClick={skip} title="Skip for now" style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0",
              background: "white", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#94a3b8", flexShrink: 0
            }}>
              <X size={15} />
            </button>
          </div>

          {/* Step indicators */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <React.Fragment key={s.id}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 10px", borderRadius: 20,
                    background: active ? "#2563eb" : done ? "#dcfce7" : "#f1f5f9",
                    color: active ? "white" : done ? "#16a34a" : "#94a3b8",
                    fontSize: 11.5, fontWeight: 700, transition: "all .2s", flexShrink: 0
                  }}>
                    {done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                    {active && s.label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, borderRadius: 99, background: i < step ? "#bbf7d0" : "#e2e8f0", minWidth: 12 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>

            {/* Step 0 — Personal */}
            {step === 0 && (<>
              <Field label="Full Name" required hint="As on your Aadhaar card">
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="fullName" value={form.fullName} onChange={upd} placeholder="e.g. Sowmya K H" />
              </Field>
              <Field label="Gender" required>
                <select style={INP} onFocus={onFocus} onBlur={onBlur} name="gender" value={form.gender} onChange={upd}>
                  <option value="">Select gender</option>
                  <option>Female</option><option>Male</option><option>Transgender</option><option>Other</option>
                </select>
              </Field>
              <Field label="Mobile Number" required hint="Must be active — used for OTP on NSP/SSP">
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="mobile" value={form.mobile} onChange={upd} placeholder="10-digit number" maxLength={10} />
              </Field>
              <Field label="State" required>
                <select style={INP} onFocus={onFocus} onBlur={onBlur} name="state" value={form.state} onChange={upd}>
                  {["Karnataka","Andhra Pradesh","Tamil Nadu","Maharashtra","Kerala","Telangana","Goa","Other"].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="District" required hint="District of your college">
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="district" value={form.district} onChange={upd} placeholder="e.g. Davanagere" />
              </Field>
            </>)}

            {/* Step 1 — Academic */}
            {step === 1 && (<>
              <Field label="Education Level" required>
                <select style={INP} onFocus={onFocus} onBlur={onBlur} name="educationLevel" value={form.educationLevel} onChange={upd}>
                  <option value="">Select level</option>
                  <option>School (Class 1–10)</option>
                  <option>PUC / Class 11–12</option>
                  <option>Diploma / ITI</option>
                  <option>Degree (UG)</option>
                  <option>Post Graduate (PG)</option>
                  <option>PhD / Research</option>
                </select>
              </Field>
              <Field label="Course" required hint="e.g. B.Com, MCA, B.Tech">
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="course" value={form.course} onChange={upd} placeholder="e.g. MCA / B.Tech" />
              </Field>
              <Field label="Semester / Class" required>
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="semester" value={form.semester} onChange={upd} placeholder="e.g. 4th Sem" />
              </Field>
              <Field label="Previous Marks %" required hint="Used to check merit-based scholarship eligibility">
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="marksPercentage" type="number" min="0" max="100" value={form.marksPercentage} onChange={upd} placeholder="e.g. 82" />
              </Field>
            </>)}

            {/* Step 2 — Eligibility */}
            {step === 2 && (<>
              <Field label="Category" required hint="As on your caste certificate">
                <select style={INP} onFocus={onFocus} onBlur={onBlur} name="category" value={form.category} onChange={upd}>
                  <option value="">Select category</option>
                  <option>SC (Scheduled Caste)</option>
                  <option>ST (Scheduled Tribe)</option>
                  <option>OBC (Other Backward Class)</option>
                  <option>General</option>
                  <option>EWS (Economically Weaker Section)</option>
                  <option>Minority</option>
                </select>
              </Field>
              <Field label="Annual Family Income (₹)" required hint="As on income certificate">
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="annualIncome" type="number" min="0" value={form.annualIncome} onChange={upd} placeholder="e.g. 150000" />
              </Field>
              <Field label="Disability Status" hint="Do you have a disability certificate from a government hospital?">
                <select style={INP} onFocus={onFocus} onBlur={onBlur} name="disabilityStatus" value={form.disabilityStatus} onChange={upd}>
                  <option>Unknown</option><option>Yes</option><option>No</option>
                </select>
              </Field>

              {form.disabilityStatus === "Yes" && (<>
                <Field label="Type of Disability">
                  <select style={INP} onFocus={onFocus} onBlur={onBlur} name="disabilityType" value={form.disabilityType} onChange={upd}>
                    <option value="">Select type</option>
                    <option>Visual Impairment</option>
                    <option>Hearing Impairment</option>
                    <option>Speech and Language Disability</option>
                    <option>Locomotor Disability</option>
                    <option>Intellectual Disability</option>
                    <option>Specific Learning Disability</option>
                    <option>Mental Illness</option>
                    <option>Autism Spectrum Disorder</option>
                    <option>Cerebral Palsy</option>
                    <option>Multiple Disabilities</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Disability Percentage (%)" hint="Minimum 40% required for most scholarships">
                  <input style={INP} onFocus={onFocus} onBlur={onBlur} name="disabilityPercentage" type="number" min="1" max="100" value={form.disabilityPercentage} onChange={upd} placeholder="e.g. 45" />
                  {form.disabilityPercentage && Number(form.disabilityPercentage) < 40 && (
                    <span style={{ fontSize: 11, color: "#d97706", fontWeight: 600 }}>⚠ Most scholarships require ≥40%</span>
                  )}
                  {form.disabilityPercentage && Number(form.disabilityPercentage) >= 40 && (
                    <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Eligible for disability scholarships</span>
                  )}
                </Field>
                <Field label="UDID Number" hint="From swavlambancard.gov.in">
                  <input style={INP} onFocus={onFocus} onBlur={onBlur} name="udidNumber" value={form.udidNumber} onChange={upd} placeholder="e.g. KA-DIST-2024-XXXXX" />
                </Field>

                {/* UDID card upload — full width */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{
                    border: `2px dashed ${udidUpload.done ? "#16a34a" : "#c7d2fe"}`,
                    borderRadius: 12, padding: "16px 18px",
                    background: udidUpload.done ? "#f0fdf4" : "#f8faff"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: udidUpload.done ? "#dcfce7" : "#e0e7ff",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {udidUpload.done ? <FileCheck size={20} color="#16a34a" /> : <Upload size={20} color="#6366f1" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 150 }}>
                        <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>UDID Card <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>optional</span></p>
                        <p style={{ margin: 0, fontSize: 11.5, color: "#64748b" }}>JPEG, PNG or PDF — max 10 MB</p>
                        {udidUpload.done && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Uploaded successfully</p>}
                        {udidUpload.error && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>✗ {udidUpload.error}</p>}
                      </div>
                      <label style={{
                        padding: "8px 16px", borderRadius: 9, fontSize: 12.5, fontWeight: 700,
                        background: udidUpload.uploading ? "#94a3b8" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                        color: "white", cursor: udidUpload.uploading ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 5, flexShrink: 0
                      }}>
                        {udidUpload.uploading
                          ? <><div style={{ width: 12, height: 12, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Uploading…</>
                          : <><Upload size={13} /> Choose File</>
                        }
                        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                          style={{ display: "none" }} onChange={handleUdidUpload} disabled={udidUpload.uploading} />
                      </label>
                    </div>
                  </div>
                </div>
              </>)}

              <Field label="Minority Status" hint="Muslim, Christian, Sikh, Buddhist, Parsi, Jain">
                <select style={INP} onFocus={onFocus} onBlur={onBlur} name="minorityStatus" value={form.minorityStatus} onChange={upd}>
                  <option>Unknown</option><option>Yes</option><option>No</option>
                </select>
              </Field>
              <Field label="Hosteller / Day Scholar" hint="Hostellers get higher maintenance amount">
                <select style={INP} onFocus={onFocus} onBlur={onBlur} name="hosteller" value={form.hosteller} onChange={upd}>
                  <option>Unknown</option><option>Hosteller</option><option>Day Scholar</option>
                </select>
              </Field>
            </>)}

            {/* Step 3 — Bank */}
            {step === 3 && (<>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "#fffbeb", border: "1.5px solid #fde68a",
                  fontSize: 12.5, color: "#92400e", lineHeight: 1.6
                }}>
                  <strong>⚠ Important:</strong> Your bank account name must <strong>exactly match</strong> your Aadhaar name.
                  Aadhaar must be linked to this account. DBT must be enabled. Wrong details = payment failure.
                </div>
              </div>
              <Field label="Bank Name" required>
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="bankName" value={form.bankName} onChange={upd} placeholder="e.g. State Bank of India" />
              </Field>
              <Field label="Account Number" required>
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="accountNumber" value={form.accountNumber} onChange={upd} placeholder="e.g. 31234567890" />
              </Field>
              <Field label="IFSC Code" required hint="11-character code on your passbook">
                <input style={INP} onFocus={onFocus} onBlur={onBlur} name="ifscCode" value={form.ifscCode} onChange={upd} placeholder="e.g. SBIN0001234" maxLength={11} />
              </Field>
              <Field label="Aadhaar–Bank Linked?" required>
                <select style={INP} onFocus={onFocus} onBlur={onBlur} name="aadhaarBankLinked" value={form.aadhaarBankLinked} onChange={upd}>
                  <option>Unknown</option><option>Yes</option><option>No</option>
                </select>
              </Field>
              <Field label="DBT Enabled?" required hint="Required to receive scholarship money">
                <select style={INP} onFocus={onFocus} onBlur={onBlur} name="dbtEnabled" value={form.dbtEnabled} onChange={upd}>
                  <option>Unknown</option><option>Yes</option><option>No</option>
                </select>
              </Field>
            </>)}

          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "16px 28px 20px",
          borderTop: "1px solid #f1f5f9", flexShrink: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "white"
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                background: "white", color: "#475569", fontWeight: 700, fontSize: 13.5,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5
              }}>
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <button onClick={skip} style={{
              padding: "10px 14px", borderRadius: 10, border: "none",
              background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 13,
              cursor: "pointer"
            }}>
              Skip for now
            </button>
          </div>

          {isLast ? (
            <button onClick={handleFinish} disabled={saving} style={{
              padding: "11px 26px", borderRadius: 10, border: "none",
              background: saving ? "#94a3b8" : "linear-gradient(135deg,#2563eb,#0891b2)",
              color: "white", fontWeight: 800, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 7,
              boxShadow: saving ? "none" : "0 4px 16px rgba(37,99,235,.3)"
            }}>
              {saving
                ? <><div style={{ width: 15, height: 15, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Saving…</>
                : <><Sparkles size={15} /> Finish Setup</>
              }
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)} style={{
              padding: "11px 22px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#2563eb,#0891b2)",
              color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7,
              boxShadow: "0 4px 16px rgba(37,99,235,.3)"
            }}>
              Next <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
