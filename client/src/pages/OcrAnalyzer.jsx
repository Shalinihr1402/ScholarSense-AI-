import React from "react";
import {
  CheckCircle2, RefreshCw, Upload, AlertTriangle, Clock,
  Phone, Mail, MapPin, ChevronRight, Eye, X, ExternalLink,
  ShieldCheck, Square, CheckSquare
} from "lucide-react";
import { ocrApi, profileApi } from "../services/api.js";

// ── Portal detection ──────────────────────────────────────────────────────────
function detectPortal(text) {
  const t = text.toLowerCase();
  if (t.includes("scholarships.gov.in") || t.includes("national scholarship") || (t.includes("nsp") && t.includes("application"))) return "NSP";
  if (t.includes("state scholarship") || t.includes("ssp") || t.includes("post matric") || t.includes("e-attestation")) return "SSP";
  if (t.includes("pfms") || t.includes("public financial management")) return "PFMS";
  if (t.includes("inspire") || t.includes("dst scholarship")) return "INSPIRE";
  if (t.includes("pmss") || t.includes("prime minister scholarship")) return "PMSS";
  if (t.includes("scholarship") || t.includes("application")) return "Other";
  return null;
}

// ── Date extraction from OCR text ────────────────────────────────────────────
const MONTHS = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
function extractApplicationDate(text) {
  // DD/MM/YYYY or DD-MM-YYYY
  const m1 = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/);
  if (m1) return new Date(`${m1[3]}-${m1[2].padStart(2,"0")}-${m1[1].padStart(2,"0")}`);
  // DD Mon YYYY
  const m2 = text.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})/);
  if (m2) {
    const mo = MONTHS[m2[2].slice(0, 3).toLowerCase()];
    if (mo !== undefined) return new Date(parseInt(m2[3]), mo, parseInt(m2[1]));
  }
  return null;
}

function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}

function fmtDate(d) {
  if (!d || isNaN(d)) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Given current stage and a base date, produce per-stage dates
// Stage offsets (calendar days from submission)
const STAGE_OFFSETS = [0, 3, 10, 18, 32];
function buildStageDates(baseDate, currentStage) {
  const today = new Date();
  return STAGE_OFFSETS.map((offset, i) => {
    if (i <= currentStage) {
      const d = addDays(baseDate, offset);
      return { label: fmtDate(d), estimated: false };
    } else {
      const d = addDays(baseDate, offset);
      return { label: fmtDate(d), estimated: true };
    }
  });
}

// Timeline stages
const TIMELINE = ["Submitted", "Institute", "District", "State / PFMS", "Payment"];

// ── Status definitions ────────────────────────────────────────────────────────
const STATUSES = {
  ministry_sign_pending: {
    label: "Payment File — Ministry Approval Pending",
    risk: "Low", riskColor: "#22c55e",
    stage: 3, nextStage: 4,
    waitTime: "7–30 Working Days", avgDays: 18,
    meaning: [
      "Your application has been fully verified and approved",
      "Scholarship amount has moved from NSP → PFMS",
      "Ministry/Department is yet to digitally sign the payment file",
      "Once signed, payment is sent directly to your bank account"
    ],
    actions: [
      { done: true,  text: "Application submitted" },
      { done: true,  text: "College verified" },
      { done: true,  text: "District approved" },
      { done: true,  text: "Selected for scholarship" },
      { done: false, text: "Wait for Ministry digital signature (7–30 days)" },
      { done: false, text: "Check bank account after 30 days" }
    ],
    delayChecks: [
      "Aadhaar linked to bank account?",
      "Bank account active (recent transaction in 6 months)?",
      "NPCI/DBT mapping enabled at your bank branch?",
      "Bank account not frozen or dormant?"
    ],
    delayCheckNote: "If payment hasn't arrived after 30 days, verify these at your bank branch:",
    healthLink: { show: true, message: "Bank-related issues detected in Health Check may block payment." },
    recommendation: { type: "wait", text: "You can safely wait. All steps from your side are complete." },
    keywords: ["digitally sign", "scheme owner ministry", "payment file generated", "yet to digitally sign"]
  },

  all_verified: {
    label: "All Verified — Sent to PFMS",
    risk: "Low", riskColor: "#22c55e",
    stage: 3, nextStage: 4,
    waitTime: "7–30 Working Days", avgDays: 12,
    meaning: [
      "College and department have both verified your application",
      "No duplicate found — you are eligible",
      "Amount has been processed from NSP to PFMS",
      "Payment will reach your bank within 7–30 working days"
    ],
    actions: [
      { done: true,  text: "Verified by college" },
      { done: true,  text: "Verified by department" },
      { done: true,  text: "Selected on merit" },
      { done: true,  text: "Amount processed to PFMS" },
      { done: false, text: "Ensure bank account is active and Aadhaar-linked" },
      { done: false, text: "Check bank passbook within 7–30 days" }
    ],
    delayChecks: [
      "Aadhaar linked to bank account?",
      "Bank account active (recent transaction in 6 months)?",
      "NPCI/DBT mapping enabled at your bank branch?",
      "Bank account not frozen or dormant?"
    ],
    delayCheckNote: "If payment hasn't arrived after 30 days, verify these at your bank branch:",
    healthLink: { show: true, message: "Health Check may have detected bank account issues that can block payment." },
    recommendation: { type: "wait", text: "You can safely wait. Expect payment in 7–30 working days." },
    keywords: ["verified by school", "verified by department", "selected for scholarship", "scholarship amount processed from nsp to pfms"]
  },

  pfms: {
    label: "Application Sent to PFMS",
    risk: "Low", riskColor: "#22c55e",
    stage: 3, nextStage: 4,
    waitTime: "7–21 Working Days", avgDays: 12,
    meaning: [
      "Your application is approved — PFMS is processing the payment",
      "PFMS is the government system that transfers scholarship money to banks",
      "No action needed from your side at this stage",
      "Payment usually arrives within 7–21 working days"
    ],
    actions: [
      { done: true,  text: "Application approved" },
      { done: false, text: "Track on pfms.nic.in → Know Your Payment" },
      { done: false, text: "Ensure bank account is active and Aadhaar-linked" },
      { done: false, text: "Check bank passbook within 21 days" }
    ],
    delayChecks: [
      "Aadhaar linked to bank account?",
      "Bank account active (no dormant status)?",
      "NPCI mapping completed at bank?",
      "Bank account not frozen?"
    ],
    delayCheckNote: "If payment hasn't arrived after 30 days, verify these at your bank branch:",
    healthLink: { show: true, message: "Health Check may have detected bank account or DBT issues." },
    recommendation: { type: "wait", text: "You can safely wait. Visit your bank only if payment doesn't arrive in 30 days." },
    keywords: ["sent to pfms", "application sent to pfms"]
  },

  payment_success: {
    label: "Payment Credited",
    risk: "None", riskColor: "#22c55e",
    stage: 4, nextStage: null,
    waitTime: null, avgDays: null,
    meaning: [
      "Scholarship money has been successfully sent to your bank",
      "Check your bank account or passbook",
      "If not visible, wait 2–3 working days for bank processing",
      "Save this screenshot as proof of payment"
    ],
    actions: [
      { done: true,  text: "Scholarship sanctioned and paid" },
      { done: false, text: "Verify credit in your bank passbook" },
      { done: false, text: "Save this screenshot for records" }
    ],
    delayChecks: [],
    delayCheckNote: null,
    healthLink: null,
    recommendation: { type: "done", text: "No action needed. Your scholarship has been credited." },
    keywords: ["payment success", "amount credited", "disbursed", "scholarship credited"]
  },

  sanctioned: {
    label: "Scholarship Sanctioned",
    risk: "Low", riskColor: "#22c55e",
    stage: 3, nextStage: 4,
    waitTime: "7–21 Working Days", avgDays: 10,
    meaning: [
      "Your scholarship has been officially approved",
      "Payment order has been issued by the sanctioning authority",
      "Amount will be sent to your bank via PFMS",
      "Check your bank account within 7–21 working days"
    ],
    actions: [
      { done: true,  text: "Scholarship sanctioned" },
      { done: false, text: "Ensure bank account is active and Aadhaar-linked" },
      { done: false, text: "Track on pfms.nic.in" },
      { done: false, text: "Check bank account within 21 days" }
    ],
    delayChecks: [
      "Aadhaar linked to bank account?",
      "Bank account active and not dormant?",
      "DBT (Direct Benefit Transfer) enabled?"
    ],
    delayCheckNote: "If payment hasn't arrived after 21 days, verify these at your bank:",
    healthLink: { show: true, message: "Health Check may have flagged bank or DBT issues." },
    recommendation: { type: "wait", text: "You can safely wait. Expect payment within 7–21 working days." },
    keywords: ["sanctioned", "sanction order", "scholarship sanctioned", "approved"]
  },

  institute_pending: {
    label: "Pending at Institute",
    risk: "Medium", riskColor: "#f59e0b",
    stage: 1, nextStage: 2,
    waitTime: "3–7 Working Days", avgDays: 5,
    meaning: [
      "Your application is waiting for your college to verify it",
      "The college nodal officer must review and forward it",
      "This step has a deadline — delay can cause rejection",
      "A personal follow-up is more effective than waiting"
    ],
    actions: [
      { done: true,  text: "Application submitted" },
      { done: false, urgent: true, text: "Visit college scholarship cell today" },
      { done: false, text: "Ask nodal officer to verify and forward" },
      { done: false, text: "Share your Application ID with them" },
      { done: false, text: "Check back in 3–5 days" }
    ],
    delayChecks: [
      "Nodal officer aware of your application?",
      "All required documents uploaded correctly?",
      "Application not marked defective by college?"
    ],
    delayCheckNote: "Possible reasons college hasn't verified yet:",
    healthLink: null,
    recommendation: { type: "urgent", text: "Visit your college scholarship cell within 2 days and ask them to verify your application." },
    keywords: ["institute verification pending", "pending at institute", "college verification pending", "pending at college"]
  },

  district_pending: {
    label: "Pending at District Office",
    risk: "Low", riskColor: "#22c55e",
    stage: 2, nextStage: 3,
    waitTime: "1–3 Weeks", avgDays: 12,
    meaning: [
      "Application passed college verification — now at district office",
      "District social welfare/backward classes office is reviewing",
      "This is a normal step — usually takes 1–3 weeks",
      "No action needed unless it has been more than 3 weeks"
    ],
    actions: [
      { done: true,  text: "College verified" },
      { done: false, text: "Wait 1–3 weeks for district approval" },
      { done: false, text: "Check portal every 3–4 days" },
      { done: false, text: "If >3 weeks: visit district Social Welfare office" }
    ],
    delayChecks: [
      "Has it been more than 3 weeks at this stage?",
      "High volume period (deadline month) — normal queue?",
      "Portal showing any error message?"
    ],
    delayCheckNote: "If pending for more than 3 weeks, check these:",
    healthLink: null,
    recommendation: { type: "wait", text: "You can safely wait for 2–3 weeks. Check the portal regularly." },
    keywords: ["district verification pending", "pending at district", "district office pending"]
  },

  defective: {
    label: "Application Marked Defective",
    risk: "High", riskColor: "#ef4444",
    stage: 1, nextStage: 1,
    waitTime: null, avgDays: null,
    meaning: [
      "An authority found an issue with your application or documents",
      "Your application has been sent back to you for correction",
      "There is a limited time window to fix and re-submit",
      "Missing this window means your scholarship is cancelled for this year"
    ],
    actions: [
      { done: false, urgent: true, text: "Log in to portal immediately" },
      { done: false, urgent: true, text: "Find the defect reason shown on the portal" },
      { done: false, urgent: true, text: "Fix the document or field highlighted" },
      { done: false, urgent: true, text: "Re-submit before the correction deadline" },
      { done: false, text: "Contact nodal officer if you need help" }
    ],
    delayChecks: [
      "Document name mismatch with Aadhaar?",
      "Income certificate expired or wrong format?",
      "Wrong document uploaded for a field?",
      "Bank account details incorrect?"
    ],
    delayCheckNote: "Common causes of defect — check the portal for the specific reason:",
    healthLink: { show: true, message: "Health Check may already show which document has an issue." },
    recommendation: { type: "urgent", text: "Log in to the portal today and fix the defect. The correction window closes soon." },
    keywords: ["defective", "sent back", "correction required", "application defective"]
  },

  rejected: {
    label: "Application Rejected",
    risk: "High", riskColor: "#ef4444",
    stage: 1, nextStage: null,
    waitTime: null, avgDays: null,
    meaning: [
      "Your application was reviewed and rejected by an authority",
      "Rejection reason is shown on the portal — check it first",
      "Common reasons: name mismatch, income above limit, duplicate application",
      "Some rejections can be appealed through the portal grievance section"
    ],
    actions: [
      { done: false, urgent: true, text: "Log in to portal and note the rejection reason" },
      { done: false, text: "Contact college nodal officer with rejection message" },
      { done: false, text: "If window is open: fix issue and re-apply" },
      { done: false, text: "If rejected unfairly: raise grievance on portal" }
    ],
    delayChecks: [
      "Name in documents matches Aadhaar exactly?",
      "Annual income within scholarship limit?",
      "Not applied to same scholarship on another portal?",
      "All required documents uploaded and readable?"
    ],
    delayCheckNote: "Common rejection reasons — check the portal for the exact reason:",
    healthLink: { show: true, message: "Health Check may have flagged the document or eligibility issue that caused rejection." },
    recommendation: { type: "action", text: "Check the rejection reason on the portal, then contact your college nodal officer." },
    keywords: ["rejected", "application rejected"]
  },

  bank_validation_failed: {
    label: "Bank Validation Failed",
    risk: "High", riskColor: "#ef4444",
    stage: 4, nextStage: 4,
    waitTime: null, avgDays: null,
    meaning: [
      "The government tried to send money but your bank account failed validation",
      "This means Aadhaar is not linked, DBT is not enabled, or account is inactive",
      "Payment will keep failing until the bank issue is fixed",
      "This is one of the most common reasons scholarships are not received"
    ],
    actions: [
      { done: false, urgent: true, text: "Visit your bank branch with Aadhaar card" },
      { done: false, urgent: true, text: "Ask: Is DBT enabled on my account?" },
      { done: false, urgent: true, text: "Ask: Is Aadhaar seeded to this account?" },
      { done: false, urgent: true, text: "Ask: Is NPCI mapping active for DBT?" },
      { done: false, text: "After bank confirms — update details on portal if needed" }
    ],
    delayChecks: [
      "Aadhaar linked to bank account?",
      "DBT (Direct Benefit Transfer) activated?",
      "NPCI mapping set up?",
      "Bank account active (not dormant)?"
    ],
    delayCheckNote: "Visit your bank and verify each of these — all must be 'Yes' for payment to succeed:",
    healthLink: { show: true, message: "Health Check has likely detected a bank account or DBT issue." },
    recommendation: { type: "urgent", text: "Visit your bank branch within 2 days. Carry your Aadhaar card." },
    keywords: ["bank validation failed", "bank account invalid", "account validation failed"]
  },

  payment_failed: {
    label: "Payment Failed",
    risk: "High", riskColor: "#ef4444",
    stage: 4, nextStage: 4,
    waitTime: null, avgDays: null,
    meaning: [
      "Payment was initiated but returned/failed at the bank",
      "The money was sent but your bank couldn't accept it",
      "Usually caused by DBT settings or inactive account",
      "Contact your bank to fix — then ask college to re-trigger payment"
    ],
    actions: [
      { done: false, urgent: true, text: "Visit bank branch with Aadhaar — enable DBT" },
      { done: false, text: "Ask bank to check NPCI mapping status" },
      { done: false, text: "Track returned payment on pfms.nic.in" },
      { done: false, text: "Contact college nodal officer to re-trigger payment" }
    ],
    delayChecks: [
      "Bank account dormant (no activity for 12+ months)?",
      "Aadhaar not seeded to bank account?",
      "Wrong account number or IFSC entered on portal?",
      "DBT not activated at bank branch?"
    ],
    delayCheckNote: "Likely causes of payment failure — verify at your bank branch:",
    healthLink: { show: true, message: "Health Check may show a bank account name mismatch or IFSC issue." },
    recommendation: { type: "urgent", text: "Visit your bank branch today and enable DBT. Then contact your nodal officer." },
    keywords: ["payment failed", "transaction failed", "disbursement failed"]
  },

  submitted: {
    label: "Application Submitted",
    risk: "Low", riskColor: "#6366f1",
    stage: 0, nextStage: 1,
    waitTime: "5–7 Working Days", avgDays: 5,
    meaning: [
      "Application successfully saved on the portal",
      "Next step: college nodal officer must verify and forward",
      "This step must happen within the portal deadline",
      "Follow up with your college if verification doesn't happen in 7 days"
    ],
    actions: [
      { done: true,  text: "Application submitted" },
      { done: false, text: "Wait 5–7 days for college to verify" },
      { done: false, text: "If not verified in 7 days — visit college scholarship cell" },
      { done: false, text: "Keep your Application ID ready" }
    ],
    delayChecks: [
      "College nodal officer aware of your application?",
      "Any document flagged as incorrect?"
    ],
    delayCheckNote: "If college hasn't verified after 7 days, check these:",
    healthLink: null,
    recommendation: { type: "wait", text: "Wait 7 days. If college hasn't verified, visit the scholarship cell." },
    keywords: ["application submitted", "submitted successfully", "fresh application submitted"]
  },

  payment_na: {
    label: "Payment Status Not Available",
    risk: "Medium", riskColor: "#f59e0b",
    stage: null, nextStage: null,
    waitTime: null, avgDays: null,
    meaning: [
      "Payment details show N/A — the actual status is hidden in a collapsed section",
      "Expand all dropdowns on the portal before taking a screenshot",
      "Click 'Current Status', 'Milestones', and 'Verification Details' to expand them",
      "Upload the screenshot again with all sections open"
    ],
    actions: [
      { done: false, urgent: true, text: "Go to NSP/SSP portal → My Applications → Status" },
      { done: false, urgent: true, text: "Expand ALL dropdown sections (click the ▼ arrows)" },
      { done: false, urgent: true, text: "Take a new screenshot with everything visible" },
      { done: false, text: "Upload the new screenshot here for accurate analysis" }
    ],
    delayChecks: ["Screenshot taken with sections collapsed — real status cannot be read"],
    delayCheckNote: null,
    healthLink: null,
    recommendation: { type: "action", text: "Re-take the screenshot with all sections expanded and upload it again." },
    matchFn: (t) => (t.includes("payment status") && (t.includes(": na") || t.includes(":na") || t.includes("n/a"))) || (t.includes("scholarship amount") && t.includes("n/a")),
    keywords: ["payment status", "scholarship amount"]
  }
};

function detectStatus(text) {
  const t = text.toLowerCase();
  for (const [id, s] of Object.entries(STATUSES)) {
    const matched = s.matchFn ? s.matchFn(t) : s.keywords?.some(k => t.includes(k));
    if (matched) return { id, ...s };
  }
  return {
    id: "unknown",
    label: "Status Not Recognized",
    risk: "Medium", riskColor: "#f59e0b",
    stage: null, nextStage: null,
    waitTime: null, avgDays: null,
    meaning: [
      "We couldn't automatically detect the status from this screenshot",
      "The sections may be collapsed — try expanding them before screenshotting",
      "Or the status wording is different from what we recognize",
      "Contact your college scholarship cell with this screenshot"
    ],
    actions: [
      { done: false, text: "Expand all sections on the portal and re-screenshot" },
      { done: false, text: "Look for: Submitted, Pending, Defective, Rejected, Sanctioned, PFMS" },
      { done: false, text: "Contact college scholarship cell for help" }
    ],
    delayChecks: ["Screenshot may have collapsed sections or unclear text"],
    delayCheckNote: null,
    healthLink: null,
    recommendation: { type: "action", text: "Re-take the screenshot with all sections expanded and try again." }
  };
}

function extractAmount(text) {
  const m = text.match(/(?:scholarship amount|amount)[^\d₹\n]*[₹]?\s*(\d[\d,\.]+)/i);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (isNaN(num) || num < 100) return null;
  return `₹ ${Number(num).toLocaleString("en-IN")}`;
}

// ── Visual Timeline with dates ────────────────────────────────────────────────
function Timeline({ currentStage, stageDates }) {
  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-start", minWidth: 460, gap: 0 }}>
        {TIMELINE.map((label, i) => {
          const isDone    = currentStage !== null && i < currentStage;
          const isCurrent = currentStage !== null && i === currentStage;
          const dotColor  = isDone ? "#16a34a" : isCurrent ? "#2563eb" : "#e2e8f0";
          const textColor = isDone ? "#16a34a" : isCurrent ? "#1e40af" : "#94a3b8";
          const dateInfo  = stageDates?.[i];
          return (
            <React.Fragment key={label}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "0 0 auto", minWidth: 70 }}>
                {/* Dot */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: dotColor,
                  border: isCurrent ? "3px solid #818cf8" : `2px solid ${dotColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isCurrent ? "0 0 0 5px rgba(37,99,235,.15)" : "none",
                  transition: "all .3s"
                }}>
                  {isDone
                    ? <CheckCircle2 size={18} color="#fff" />
                    : isCurrent
                      ? <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />
                      : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
                  }
                </div>
                {/* Stage label */}
                <span style={{
                  fontSize: 11, fontWeight: isCurrent ? 800 : 500,
                  color: textColor, textAlign: "center", maxWidth: 68, lineHeight: 1.3,
                  background: isCurrent ? "#eff6ff" : "transparent",
                  padding: isCurrent ? "2px 5px" : "0", borderRadius: 4
                }}>
                  {label}
                </span>
                {/* Date label */}
                {dateInfo?.label && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, textAlign: "center",
                    color: dateInfo.estimated ? "#2563eb" : isDone ? "#16a34a" : "#94a3b8",
                    lineHeight: 1.3, maxWidth: 68
                  }}>
                    {dateInfo.estimated ? `Est. ${dateInfo.label}` : dateInfo.label}
                  </span>
                )}
              </div>
              {i < TIMELINE.length - 1 && (
                <div style={{
                  flex: 1, height: 2, minWidth: 12, marginTop: 17,
                  background: i < currentStage ? "#16a34a" : "#e2e8f0",
                  transition: "background .3s"
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ risk, color }) {
  const icons = {
    High: <AlertTriangle size={12} />, Medium: <Clock size={12} />,
    Low: <CheckCircle2 size={12} />, None: <CheckCircle2 size={12} />
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
      background: `${color}15`, color, border: `1px solid ${color}40`
    }}>
      {icons[risk]} {risk} Risk
    </span>
  );
}

// ── Delay checks (interactive checklist) ─────────────────────────────────────
function DelayChecks({ checks, note }) {
  const [checked, setChecked] = React.useState(() => checks.map(() => false));
  const toggle = i => setChecked(p => p.map((v, j) => j === i ? !v : v));
  const allDone = checked.every(Boolean);
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "20px 22px", boxShadow: "0 2px 10px rgba(15,23,42,.06)", border: "1.5px solid #fde68a" }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: "#d97706", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 6 }}>
        Potential Delay Checks
      </p>
      {note && <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.6 }}>{note}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {checks.map((c, i) => (
          <button key={i} onClick={() => toggle(i)}
            style={{
              display: "flex", gap: 10, alignItems: "center", background: checked[i] ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${checked[i] ? "#bbf7d0" : "#fde68a"}`,
              borderRadius: 9, cursor: "pointer", padding: "9px 12px", textAlign: "left", transition: "all .15s"
            }}
          >
            {checked[i]
              ? <CheckSquare size={16} color="#16a34a" style={{ flexShrink: 0 }} />
              : <Square size={16} color="#d97706" style={{ flexShrink: 0 }} />
            }
            <span style={{
              fontSize: 13, color: checked[i] ? "#94a3b8" : "#334155",
              textDecoration: checked[i] ? "line-through" : "none", lineHeight: 1.5
            }}>{c}</span>
          </button>
        ))}
      </div>
      {allDone && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#16a34a", margin: 0 }}>✓ All checks done — contact your nodal officer with this information.</p>
        </div>
      )}
    </div>
  );
}

// ── Screenshot preview lightbox ───────────────────────────────────────────────
function ScreenshotCard({ file, preview }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div style={{ display: "flex", gap: 14, alignItems: "center", background: "white", borderRadius: 14, padding: "14px 18px", border: "1.5px solid #bbf7d0", boxShadow: "0 2px 10px rgba(15,23,42,.06)" }}>
        <img src={preview} alt="screenshot" style={{ width: 58, height: 58, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: "2px solid #bbf7d0" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <CheckCircle2 size={14} color="#16a34a" />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a" }}>Analysis Completed</span>
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
            {file.name}
          </p>
          <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
            {(file.size / 1024).toFixed(0)} KB · Uploaded screenshot
          </p>
        </div>
        <button onClick={() => setOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, padding: "8px 16px", borderRadius: 10, background: "#eff6ff", border: "1.5px solid #bfdbfe", color: "#2563eb", cursor: "pointer", flexShrink: 0 }}>
          <Eye size={13} /> View
        </button>
      </div>

      {/* Lightbox */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: 720, maxHeight: "90vh", width: "100%" }}>
            <button onClick={() => setOpen(false)} style={{
              position: "absolute", top: -14, right: -14, width: 32, height: 32,
              borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1
            }}>
              <X size={16} color="#fff" />
            </button>
            <img src={preview} alt="Screenshot" style={{ width: "100%", maxHeight: "88vh", objectFit: "contain", borderRadius: 12, display: "block" }} />
            <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, marginTop: 10 }}>{file.name}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default function OcrAnalyzer() {
  const [file, setFile]         = React.useState(null);
  const [preview, setPreview]   = React.useState(null);
  const [result, setResult]     = React.useState(null);
  const [loading, setLoading]   = React.useState(false);
  const [error, setError]       = React.useState("");
  const [profile, setProfile]   = React.useState(null);
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    profileApi.getMine().then(d => setProfile(d?.profile || d)).catch(() => {});
  }, []);

  function handleFile(f) {
    if (!f || !f.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    setFile(f); setError(""); setResult(null);
    setPreview(URL.createObjectURL(f));
  }

  function reset() {
    setFile(null); setPreview(null); setResult(null); setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function analyze() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data   = await ocrApi.analyze(file);
      const text   = data.result?.extractedText || "";
      const portal = detectPortal(text);
      const status = detectStatus(text);
      const amount = extractAmount(text);
      const appDate = extractApplicationDate(text);
      const stageDates = (status.stage !== null && appDate)
        ? buildStageDates(appDate, status.stage)
        : null;
      setResult({ text, portal, status, amount, stageDates });
    } catch (err) {
      setError(err.message || "Could not read the screenshot. Try again with a clearer image.");
    } finally {
      setLoading(false);
    }
  }

  const recColors = {
    wait:   { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.3)",  color: "#22c55e", icon: <CheckCircle2 size={20} /> },
    done:   { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.3)",  color: "#22c55e", icon: <CheckCircle2 size={20} /> },
    action: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", color: "#f59e0b", icon: <Clock size={20} /> },
    urgent: { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.3)",  color: "#ef4444", icon: <AlertTriangle size={20} /> }
  };

  return (
    <div className="page-stack">

      {/* ── Header ── */}
      <div style={{ marginBottom: 4 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#0d9488", margin: "0 0 8px" }}>
          Scholarship Status Analyzer
        </p>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-.02em", lineHeight: 1.25 }}>
          Find out why your scholarship is{" "}
          <span style={{ background: "linear-gradient(135deg,#2563eb,#0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            delayed
          </span>{" "}
          in under 30 seconds.
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 12px", lineHeight: 1.6 }}>
          Upload a screenshot from your scholarship portal — get a clear answer, personalized next steps, and estimated timeline.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["NSP", "SSP", "PFMS", "INSPIRE", "PMSS"].map(p => (
            <span key={p} style={{
              fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20,
              background: "linear-gradient(135deg,#eff6ff,#e0f2fe)",
              color: "#2563eb", border: "1.5px solid #bfdbfe"
            }}>{p}</span>
          ))}
        </div>
      </div>

      {/* ── Upload panel (pre-result) ── */}
      {!result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start" }}>

          {/* Left: Drop zone card */}
          <div style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 16px rgba(15,23,42,.08)", border: "1.5px solid #e2e8f0" }}>
            <div style={{ height: 4, background: "linear-gradient(90deg,#2563eb,#0891b2,#0d9488)" }} />
            <div style={{ padding: "22px 24px" }}>
              <p style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", margin: "0 0 4px" }}>
                📷 Upload Scholarship Screenshot
              </p>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px", lineHeight: 1.6 }}>
                Take a screenshot from NSP, SSP, or any portal.{" "}
                <strong style={{ color: "#d97706" }}>Expand all sections</strong> before screenshotting.
              </p>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                style={{
                  border: `2px dashed ${dragging ? "#2563eb" : file ? "#16a34a" : "#cbd5e1"}`,
                  borderRadius: 14, padding: preview ? 16 : "40px 24px", textAlign: "center",
                  cursor: "pointer", marginBottom: 18,
                  background: dragging ? "#eff6ff" : file ? "#f0fdf4" : "#f8fafc",
                  transition: "all .2s"
                }}
              >
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
                {preview ? (
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <img src={preview} alt="" style={{ height: 80, width: 80, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: "2px solid #bbf7d0" }} />
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#16a34a", marginBottom: 3 }}>✓ {file.name}</p>
                      <p style={{ fontSize: 12, color: "#64748b" }}>{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      width: 64, height: 64, borderRadius: 16, margin: "0 auto 14px",
                      background: "linear-gradient(135deg,#eff6ff,#e0f2fe)",
                      border: "2px solid #bfdbfe",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Upload size={28} color="#2563eb" />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 5 }}>Click to upload or drag & drop</p>
                    <p style={{ fontSize: 12.5, color: "#94a3b8" }}>JPG, PNG · Screenshot from phone or computer</p>
                  </>
                )}
              </div>

              {/* Tips */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "10px 12px" }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>⚠ Before screenshotting</p>
                  <p style={{ fontSize: 11.5, color: "#78350f", lineHeight: 1.6 }}>Expand all sections: Status, Milestones, Verification, Payment</p>
                </div>
                <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, padding: "10px 12px" }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#1e40af", marginBottom: 4 }}>📱 How to screenshot</p>
                  <p style={{ fontSize: 11.5, color: "#1e3a8a", lineHeight: 1.6 }}>Android: Vol↓ + Power · iPhone: Side + Vol↑ · PC: Snipping Tool</p>
                </div>
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1.5px solid #fecdd3", color: "#dc2626", fontSize: 13, marginBottom: 14 }}>
                  {error}
                </div>
              )}

              {/* CTA button */}
              <button onClick={analyze} disabled={!file || loading} style={{
                width: "100%", fontSize: 15.5, fontWeight: 800,
                padding: "15px", borderRadius: 13, border: "none",
                cursor: !file || loading ? "not-allowed" : "pointer",
                background: !file || loading
                  ? "#94a3b8"
                  : "linear-gradient(135deg,#2563eb 0%,#0891b2 50%,#0d9488 100%)",
                color: "white",
                boxShadow: !file || loading ? "none" : "0 4px 18px rgba(37,99,235,.35)",
                transition: "all .2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9
              }}>
                {loading
                  ? <><div style={{ width: 18, height: 18, border: "2.5px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Reading screenshot…</>
                  : <><span style={{ fontSize: 18 }}>🔍</span> Find My Scholarship Problem</>
                }
              </button>
            </div>
          </div>

          {/* Right: Benefits card */}
          <div style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 16px rgba(15,23,42,.08)", border: "1.5px solid #e2e8f0" }}>
            <div style={{ height: 4, background: "linear-gradient(90deg,#0d9488,#22c55e)" }} />
            <div style={{ padding: "22px 22px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 14px", letterSpacing: "-.01em" }}>
                What you'll get instantly
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                {[
                  ["🔎", "Detect your verification stage", "#eff6ff", "#2563eb"],
                  ["💬", "Explain status in simple English", "#f0fdf4", "#16a34a"],
                  ["📄", "Find missing documents", "#fef3c7", "#d97706"],
                  ["📅", "Estimate payment timeline", "#f5f3ff", "#7c3aed"],
                  ["✅", "Suggest exact next action", "#eff6ff", "#0891b2"],
                ].map(([emoji, text, bg, color]) => (
                  <div key={text} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 13px", borderRadius: 10,
                    background: bg, border: `1px solid ${color}25`
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{text}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".09em", margin: "0 0 10px" }}>
                  Supported Portals
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["NSP", "SSP", "PFMS", "PMSS", "INSPIRE"].map(p => (
                    <span key={p} style={{
                      fontSize: 11.5, fontWeight: 800, padding: "5px 12px", borderRadius: 20,
                      background: "linear-gradient(135deg,#eff6ff,#e0f2fe)",
                      color: "#2563eb", border: "1.5px solid #bfdbfe"
                    }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && (() => {
        const { status, portal, amount, stageDates } = result;
        const rec = status.recommendation;
        const lightRec = {
          wait:   { bg: "#f0fdf4", border: "#bbf7d0",  color: "#16a34a", icon: <CheckCircle2 size={20} /> },
          done:   { bg: "#f0fdf4", border: "#bbf7d0",  color: "#16a34a", icon: <CheckCircle2 size={20} /> },
          action: { bg: "#fffbeb", border: "#fde68a",  color: "#d97706", icon: <Clock size={20} /> },
          urgent: { bg: "#fef2f2", border: "#fecdd3",  color: "#dc2626", icon: <AlertTriangle size={20} /> }
        };
        const rc = lightRec[rec?.type] || lightRec.action;

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ① Screenshot card */}
            <ScreenshotCard file={file} preview={preview} />

            {/* ② Status card */}
            <div style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 16px rgba(15,23,42,.08)", border: "1.5px solid #e2e8f0" }}>
              <div style={{ height: 5, background: `linear-gradient(90deg,${status.riskColor},${status.riskColor}88)` }} />
              <div style={{ padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
                  <div>
                    {portal && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".09em", display: "block", marginBottom: 6 }}>
                        {portal} · Scholarship Portal
                      </span>
                    )}
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1.3, marginBottom: 10 }}>{status.label}</h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <RiskBadge risk={status.risk} color={status.riskColor} />
                      {amount && (
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#16a34a", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 20, padding: "4px 14px" }}>
                          {amount}
                        </span>
                      )}
                    </div>
                  </div>
                  {status.waitTime && (
                    <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "14px 18px", flexShrink: 0, minWidth: 170 }}>
                      <p style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Current Stage</p>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1e40af", marginBottom: 10 }}>{TIMELINE[status.stage]}</p>
                      <p style={{ fontSize: 10.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Expected Time</p>
                      <p style={{ fontSize: 16, fontWeight: 900, color: "#2563eb", marginBottom: 3 }}>{status.waitTime}</p>
                      {status.avgDays && <p style={{ fontSize: 11, color: "#64748b" }}>Avg: {status.avgDays} days</p>}
                    </div>
                  )}
                </div>

                {status.stage !== null && (
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 18 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 14 }}>Application Journey</p>
                    <Timeline currentStage={status.stage} stageDates={stageDates} />
                    {stageDates && (
                      <p style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 10, display: "flex", gap: 12 }}>
                        <span><span style={{ color: "#16a34a" }}>■</span> Completed</span>
                        <span><span style={{ color: "#2563eb" }}>■</span> Estimated (from your submission date)</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ④ What this means + Delay checks (2 cols) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "white", borderRadius: 16, padding: "20px 22px", boxShadow: "0 2px 10px rgba(15,23,42,.06)", border: "1.5px solid #f1f5f9" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 14 }}>What This Means</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {status.meaning.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: status.riskColor, flexShrink: 0, marginTop: 7 }} />
                      <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.65, margin: 0 }}>{m}</p>
                    </div>
                  ))}
                </div>
              </div>
              {status.delayChecks?.length > 0 && (
                <DelayChecks checks={status.delayChecks} note={status.delayCheckNote} />
              )}
            </div>

            {/* ⑤ Action Checklist */}
            <div style={{ background: "white", borderRadius: 16, padding: "20px 22px", boxShadow: "0 2px 10px rgba(15,23,42,.06)", border: "1.5px solid #f1f5f9" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 14 }}>Personalized Next Actions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {status.actions.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 12, alignItems: "center", padding: "11px 14px", borderRadius: 10,
                    background: a.done ? "#f0fdf4" : a.urgent ? "#fef2f2" : "#f8fafc",
                    border: `1.5px solid ${a.done ? "#bbf7d0" : a.urgent ? "#fecdd3" : "#e2e8f0"}`
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                      background: a.done ? "#16a34a" : a.urgent ? "#fef2f2" : "#e2e8f0",
                      border: a.done ? "none" : `2px solid ${a.urgent ? "#dc2626" : "#cbd5e1"}`,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {a.done && <CheckCircle2 size={14} color="#fff" />}
                      {a.urgent && !a.done && <AlertTriangle size={11} color="#dc2626" />}
                    </div>
                    <p style={{
                      fontSize: 13.5, fontWeight: a.urgent ? 700 : 500,
                      color: a.done ? "#94a3b8" : a.urgent ? "#dc2626" : "#334155",
                      textDecoration: a.done ? "line-through" : "none", flex: 1, margin: 0
                    }}>{a.text}</p>
                    {a.urgent && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#dc2626", background: "#fef2f2", border: "1.5px solid #fecdd3", borderRadius: 20, padding: "2px 10px", flexShrink: 0 }}>Urgent</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* ⑥ Health Check cross-link */}
            {status.healthLink?.show && (
              <a href="/risk-analyzer" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", gap: 14, alignItems: "center", padding: "16px 20px", borderRadius: 14,
                  background: "linear-gradient(135deg,#eff6ff,#f0fdfa)", border: "1.5px solid #bfdbfe",
                  cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,.08)"
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "#eff6ff", border: "1.5px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShieldCheck size={20} color="#2563eb" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#1e40af", margin: "0 0 2px" }}>Check Document Health</p>
                    <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>{status.healthLink.message}</p>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 800, color: "#2563eb", flexShrink: 0, background: "#eff6ff", border: "1.5px solid #bfdbfe", padding: "6px 14px", borderRadius: 20 }}>
                    Open <ExternalLink size={12} />
                  </span>
                </div>
              </a>
            )}

            {/* ⑦ Contact card */}
            {(profile?.collegeName || profile?.nodalOfficerName || profile?.nodalOfficerContact || profile?.nodalOfficerEmail) ? (
              <div style={{ background: "white", borderRadius: 16, padding: "20px 22px", boxShadow: "0 2px 10px rgba(15,23,42,.06)", border: "1.5px solid #e0f2fe" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#0891b2", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 14 }}>Your Institute Contact</p>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 14px", alignItems: "start" }}>
                  {profile.collegeName && (
                    <><MapPin size={16} color="#2563eb" style={{ marginTop: 2 }} /><p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>{profile.collegeName}</p></>
                  )}
                  {profile.nodalOfficerName && (
                    <><div style={{ width: 16 }} /><p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{profile.nodalOfficerName}{profile.nodalOfficerDesignation ? ` · ${profile.nodalOfficerDesignation}` : ""}</p></>
                  )}
                  {profile.nodalOfficerContact && (
                    <><Phone size={16} color="#16a34a" style={{ marginTop: 2 }} /><a href={`tel:${profile.nodalOfficerContact}`} style={{ fontSize: 15, fontWeight: 700, color: "#16a34a", textDecoration: "none" }}>{profile.nodalOfficerContact}</a></>
                  )}
                  {profile.nodalOfficerEmail && (
                    <><Mail size={16} color="#2563eb" style={{ marginTop: 2 }} /><a href={`mailto:${profile.nodalOfficerEmail}`} style={{ fontSize: 14, color: "#2563eb", textDecoration: "none" }}>{profile.nodalOfficerEmail}</a></>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>Add institute & nodal officer details in your Profile to see their direct contact here.</p>
                <a href="/profile" style={{ fontSize: 13, fontWeight: 800, padding: "8px 16px", borderRadius: 10, background: "#d97706", color: "#fff", textDecoration: "none", flexShrink: 0 }}>Fill Profile</a>
              </div>
            )}

            {/* ⑧ Final Recommendation */}
            <div style={{ borderRadius: 16, overflow: "hidden", border: `1.5px solid ${rc.border}`, boxShadow: "0 2px 10px rgba(15,23,42,.06)" }}>
              <div style={{ height: 4, background: rc.color }} />
              <div style={{ padding: "18px 22px", background: rc.bg, display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ color: rc.color, flexShrink: 0, marginTop: 2 }}>{rc.icon}</div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: rc.color, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 6 }}>Our Recommendation</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.6, margin: 0 }}>{rec?.text}</p>
                </div>
              </div>
            </div>

            <button onClick={reset} style={{
              width: "100%", padding: "13px", fontSize: 14, fontWeight: 700,
              borderRadius: 12, border: "1.5px solid #e2e8f0", background: "white",
              color: "#475569", cursor: "pointer", transition: "all .15s"
            }}>
              ← Analyze Another Screenshot
            </button>
          </div>
        );
      })()}
    </div>
  );
}
