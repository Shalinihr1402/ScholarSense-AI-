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
          const dotColor  = isDone ? "#22c55e" : isCurrent ? "#6366f1" : "rgba(156,163,175,0.25)";
          const textColor = isDone ? "#22c55e" : isCurrent ? "#f0f0f0" : "#6b7280";
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
                  boxShadow: isCurrent ? "0 0 0 5px rgba(99,102,241,0.18)" : "none",
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
                  background: isCurrent ? "rgba(99,102,241,0.12)" : "transparent",
                  padding: isCurrent ? "2px 5px" : "0", borderRadius: 4
                }}>
                  {label}
                </span>
                {/* Date label */}
                {dateInfo?.label && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, textAlign: "center",
                    color: dateInfo.estimated ? "#6366f1" : isDone ? "#4ade80" : "#9ca3af",
                    lineHeight: 1.3, maxWidth: 68
                  }}>
                    {dateInfo.estimated ? `Est. ${dateInfo.label}` : dateInfo.label}
                  </span>
                )}
              </div>
              {i < TIMELINE.length - 1 && (
                <div style={{
                  flex: 1, height: 2, minWidth: 12, marginTop: 17,
                  background: i < currentStage ? "#22c55e" : "rgba(156,163,175,0.18)",
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
    <section className="panel" style={{ margin: 0, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.18)" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>
        Potential Delay Checks
      </p>
      {note && <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, lineHeight: 1.6 }}>{note}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checks.map((c, i) => (
          <button key={i} onClick={() => toggle(i)}
            style={{
              display: "flex", gap: 10, alignItems: "center", background: "none",
              border: "none", cursor: "pointer", padding: "6px 0", textAlign: "left"
            }}
          >
            {checked[i]
              ? <CheckSquare size={17} color="#22c55e" style={{ flexShrink: 0 }} />
              : <Square size={17} color="#fbbf24" style={{ flexShrink: 0 }} />
            }
            <span style={{
              fontSize: 13, color: checked[i] ? "#6b7280" : "#e5e7eb",
              textDecoration: checked[i] ? "line-through" : "none", lineHeight: 1.5
            }}>{c}</span>
          </button>
        ))}
      </div>
      {allDone && (
        <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>All checks done — contact your nodal officer with this information.</p>
        </div>
      )}
    </section>
  );
}

// ── Screenshot preview lightbox ───────────────────────────────────────────────
function ScreenshotCard({ file, preview }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <section className="panel" style={{ display: "flex", gap: 16, alignItems: "center", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.2)" }}>
        {/* Thumb */}
        <img src={preview} alt="screenshot" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0, border: "2px solid rgba(34,197,94,0.3)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <CheckCircle2 size={15} color="#22c55e" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>Analysis Completed</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.name}
          </p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            {(file.size / 1024).toFixed(0)} KB · Uploaded screenshot
          </p>
        </div>
        <button onClick={() => setOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8", cursor: "pointer", flexShrink: 0 }}>
          <Eye size={14} /> View
        </button>
      </section>

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
      <div className="page-heading">
        <p className="eyebrow">Scholarship Status Analyzer</p>
        <h2>What does your scholarship status mean?</h2>
        <p className="muted-text">Upload a screenshot from your scholarship portal. Get a clear answer, personalized next steps, and estimated timeline.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {["NSP", "SSP", "PFMS", "INSPIRE", "PMSS"].map(p => (
            <span key={p} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>{p}</span>
          ))}
        </div>
      </div>

      {/* ── Upload panel (pre-result) ── */}
      {!result && (
        <section className="panel">
          <p style={{ fontWeight: 700, fontSize: 15, color: "#f0f0f0", marginBottom: 6 }}>Upload your scholarship status screenshot</p>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16, lineHeight: 1.6 }}>
            Take a screenshot from NSP, SSP, or any portal. <strong style={{ color: "#f59e0b" }}>Expand all dropdowns</strong> before screenshotting so the full status is visible.
          </p>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${dragging ? "#6366f1" : file ? "#22c55e" : "rgba(156,163,175,0.25)"}`,
              borderRadius: 12, padding: preview ? 16 : "36px 20px", textAlign: "center",
              cursor: "pointer", marginBottom: 16,
              background: dragging ? "rgba(99,102,241,0.06)" : file ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.01)",
              transition: "all .2s"
            }}
          >
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
            {preview ? (
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <img src={preview} alt="" style={{ height: 80, width: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#22c55e", marginBottom: 2 }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} color="#6366f1" style={{ margin: "0 auto 10px" }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>Click to upload or drag & drop</p>
                <p style={{ fontSize: 12, color: "#6b7280" }}>JPG, PNG · Screenshot from phone or computer</p>
              </>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>⚠ Before screenshotting on NSP</p>
              <p style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.7 }}>Click to expand all sections — Current Status, Milestones, Verification Details, Payment Details</p>
            </div>
            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 4 }}>How to screenshot</p>
              <p style={{ fontSize: 12, color: "#c7d2fe", lineHeight: 1.7 }}>Android: Vol↓ + Power · iPhone: Side + Vol↑ · PC: Snipping Tool</p>
            </div>
          </div>

          {error && <div className="form-alert error" style={{ marginBottom: 12 }}>{error}</div>}

          <button className="primary-btn" onClick={analyze} disabled={!file || loading}
            style={{ width: "100%", fontSize: 15, padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading
              ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Reading screenshot...</>
              : <><ChevronRight size={16} /> Analyze My Status</>
            }
          </button>
        </section>
      )}

      {/* ── Results ── */}
      {result && (() => {
        const { status, portal, amount, stageDates } = result;
        const rec = status.recommendation;
        const rc  = recColors[rec?.type] || recColors.action;

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ① Uploaded screenshot card */}
            <ScreenshotCard file={file} preview={preview} />

            {/* ② Status card */}
            <section className="panel" style={{ borderLeft: `5px solid ${status.riskColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                <div>
                  {portal && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 4 }}>
                      {portal} · Scholarship Portal
                    </span>
                  )}
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: status.riskColor, lineHeight: 1.3, marginBottom: 8 }}>{status.label}</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <RiskBadge risk={status.risk} color={status.riskColor} />
                    {amount && (
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "4px 12px" }}>
                        {amount}
                      </span>
                    )}
                  </div>
                </div>

                {/* ③ Expected waiting time */}
                {status.waitTime && (
                  <div style={{ textAlign: "right", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "12px 16px", flexShrink: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Current Stage</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 10 }}>{TIMELINE[status.stage]}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Expected Processing Time</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#818cf8", marginBottom: 4 }}>{status.waitTime}</p>
                    {status.avgDays && (
                      <p style={{ fontSize: 11, color: "#6b7280" }}>Average: {status.avgDays} days</p>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline */}
              {status.stage !== null && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 16 }}>Application Journey</p>
                  <Timeline currentStage={status.stage} stageDates={stageDates} />
                  {stageDates && (
                    <p style={{ fontSize: 10, color: "#6b7280", marginTop: 10 }}>
                      <span style={{ color: "#22c55e" }}>■</span> Completed &nbsp;
                      <span style={{ color: "#6366f1" }}>■</span> Est. dates (based on your submission date)
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* ④ What this means + Delay checks (2 cols) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <section className="panel" style={{ margin: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>What This Means</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {status.meaning.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: status.riskColor, flexShrink: 0, marginTop: 7 }} />
                      <p style={{ fontSize: 14, color: "#e5e7eb", lineHeight: 1.6 }}>{m}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Dynamic delay checks */}
              {status.delayChecks?.length > 0 && (
                <DelayChecks checks={status.delayChecks} note={status.delayCheckNote} />
              )}
            </div>

            {/* ⑤ Action Checklist */}
            <section className="panel">
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>Personalized Next Actions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {status.actions.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 12, alignItems: "center",
                    padding: "10px 14px", borderRadius: 8,
                    background: a.done ? "rgba(34,197,94,0.05)" : a.urgent ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${a.done ? "rgba(34,197,94,0.2)" : a.urgent ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}`
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: a.done ? "#22c55e" : a.urgent ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
                      border: a.done ? "none" : `2px solid ${a.urgent ? "#ef4444" : "rgba(255,255,255,0.15)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {a.done && <CheckCircle2 size={14} color="#fff" />}
                      {a.urgent && !a.done && <AlertTriangle size={11} color="#ef4444" />}
                    </div>
                    <p style={{
                      fontSize: 14, fontWeight: a.urgent ? 700 : 500,
                      color: a.done ? "#6b7280" : a.urgent ? "#fca5a5" : "#e5e7eb",
                      textDecoration: a.done ? "line-through" : "none", flex: 1
                    }}>{a.text}</p>
                    {a.urgent && <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "2px 8px", flexShrink: 0 }}>Urgent</span>}
                  </div>
                ))}
              </div>
            </section>

            {/* ⑥ Health Check cross-link (for bank / document issues) */}
            {status.healthLink?.show && (
              <a href="/risk-analyzer" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", gap: 14, alignItems: "center",
                  padding: "14px 18px", borderRadius: 12,
                  background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)",
                  cursor: "pointer", transition: "background .2s"
                }}>
                  <ShieldCheck size={22} color="#818cf8" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 2 }}>Check Document Health</p>
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>{status.healthLink.message}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#6366f1", flexShrink: 0 }}>
                    Open Health Check <ExternalLink size={13} style={{ marginLeft: 2 }} />
                  </div>
                </div>
              </a>
            )}

            {/* ⑦ Contact card */}
            {(profile?.collegeName || profile?.nodalOfficerName || profile?.nodalOfficerContact || profile?.nodalOfficerEmail) ? (
              <section className="panel" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>Your Institute Contact</p>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 14px", alignItems: "start" }}>
                  {profile.collegeName && (
                    <><MapPin size={16} color="#818cf8" style={{ marginTop: 2 }} /><p style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>{profile.collegeName}</p></>
                  )}
                  {profile.nodalOfficerName && (
                    <><div style={{ width: 16 }} /><p style={{ fontSize: 13, color: "#c7d2fe" }}>{profile.nodalOfficerName}{profile.nodalOfficerDesignation ? ` · ${profile.nodalOfficerDesignation}` : ""}</p></>
                  )}
                  {profile.nodalOfficerContact && (
                    <><Phone size={16} color="#22c55e" style={{ marginTop: 2 }} /><a href={`tel:${profile.nodalOfficerContact}`} style={{ fontSize: 15, fontWeight: 700, color: "#22c55e", textDecoration: "none" }}>{profile.nodalOfficerContact}</a></>
                  )}
                  {profile.nodalOfficerEmail && (
                    <><Mail size={16} color="#6366f1" style={{ marginTop: 2 }} /><a href={`mailto:${profile.nodalOfficerEmail}`} style={{ fontSize: 14, color: "#818cf8", textDecoration: "none" }}>{profile.nodalOfficerEmail}</a></>
                  )}
                </div>
              </section>
            ) : (
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <p style={{ fontSize: 13, color: "#f59e0b" }}>Add institute & nodal officer details in your Profile to see their direct contact here.</p>
                <a href="/profile" style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8, background: "#f59e0b", color: "#000", textDecoration: "none", flexShrink: 0 }}>Fill Profile</a>
              </div>
            )}

            {/* ⑧ Final Recommendation */}
            <section style={{ borderRadius: 12, padding: "20px 22px", background: rc.bg, border: `2px solid ${rc.border}`, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ color: rc.color, flexShrink: 0, marginTop: 2 }}>{rc.icon}</div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: rc.color, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Our Recommendation</p>
                <p style={{ fontSize: 17, fontWeight: 800, color: rc.color, lineHeight: 1.5 }}>{rec?.text}</p>
              </div>
            </section>

            <button onClick={reset} className="secondary-btn" style={{ width: "100%", padding: "12px", fontSize: 14 }}>
              ← Analyze Another Screenshot
            </button>
          </div>
        );
      })()}
    </div>
  );
}
