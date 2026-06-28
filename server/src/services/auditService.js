import { mkdir, readFile, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_PATH = path.resolve(__dirname, "../../data/audit.local.json");

// ── Local JSON fallback ───────────────────────────────────────────────────────
async function ensureLocal() {
  await mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  try { await readFile(LOCAL_PATH, "utf8"); }
  catch { await writeFile(LOCAL_PATH, "[]", "utf8"); }
}
async function readLocal() { await ensureLocal(); return JSON.parse(await readFile(LOCAL_PATH, "utf8")); }
async function writeLocal(data) { await ensureLocal(); await writeFile(LOCAL_PATH, JSON.stringify(data, null, 2), "utf8"); }

// ── Core log function ─────────────────────────────────────────────────────────
export async function logAudit(userId, { category, action, title, detail = "", meta = {} }) {
  const entry = { userId, category, action, title, detail, meta, createdAt: new Date().toISOString() };

  try {
    // Try MongoDB first
    const { default: AuditLog } = await import("../models/AuditLog.js");
    if (AuditLog.db?.readyState === 1) {
      await AuditLog.create(entry);
      return;
    }
  } catch { /* fall through to local */ }

  // Local fallback
  const all = await readLocal();
  all.push({ id: randomUUID(), ...entry });
  await writeLocal(all);
}

// ── Get audit trail for user ──────────────────────────────────────────────────
export async function getAuditTrail(userId, limit = 50) {
  try {
    const { default: AuditLog } = await import("../models/AuditLog.js");
    if (AuditLog.db?.readyState === 1) {
      return AuditLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
    }
  } catch { /* fall through */ }

  const all = await readLocal();
  return all
    .filter(e => e.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

// ── Convenience loggers ───────────────────────────────────────────────────────

export function logAuth(userId, action) {
  const map = {
    register: { title: "Account created", detail: "Student account registered on ScholarSense AI" },
    login:    { title: "Logged in",        detail: "Session started" },
    logout:   { title: "Logged out",       detail: "Session ended" },
  };
  const info = map[action] || { title: action, detail: "" };
  return logAudit(userId, { category: "auth", action, ...info });
}

export function logProfileUpdate(userId, changedFields, profile) {
  // Detect what specifically changed for a meaningful log entry
  const bankFields = ["bankName","accountHolderName","accountNumber","ifscCode","aadhaarBankLinked","dbtEnabled","bankAccountActive","npciMapping"];
  const bankChanged = changedFields.filter(f => bankFields.includes(f));
  const otherChanged = changedFields.filter(f => !bankFields.includes(f));

  const logs = [];

  if (bankChanged.includes("aadhaarBankLinked") && profile?.aadhaarBankLinked === "Yes") {
    logs.push(logAudit(userId, { category: "bank", action: "aadhaar_linked", title: "Aadhaar linked to bank account", detail: `Aadhaar seeding confirmed for ${profile.bankName || "bank account"}`, meta: { bank: profile.bankName } }));
  }
  if (bankChanged.includes("dbtEnabled") && profile?.dbtEnabled === "Yes") {
    logs.push(logAudit(userId, { category: "bank", action: "dbt_enabled", title: "DBT enabled on bank account", detail: `Direct Benefit Transfer activated on ${profile.bankName || "bank"}`, meta: { bank: profile.bankName } }));
  }
  if (bankChanged.includes("npciMapping") && profile?.npciMapping === "Yes") {
    logs.push(logAudit(userId, { category: "bank", action: "npci_mapped", title: "NPCI Aadhaar mapper registered", detail: "Aadhaar mapped in NPCI Payment Bridge directory", meta: {} }));
  }
  if (bankChanged.includes("bankName") || bankChanged.includes("ifscCode") || bankChanged.includes("accountNumber")) {
    const masked = profile?.accountNumber ? `••••${profile.accountNumber.slice(-4)}` : "";
    logs.push(logAudit(userId, { category: "bank", action: "bank_details_updated", title: "Bank details updated", detail: `${profile?.bankName || "Bank"} ${masked} · IFSC: ${profile?.ifscCode || ""}`, meta: { bank: profile?.bankName, ifsc: profile?.ifscCode, masked } }));
  }
  if (otherChanged.length > 0) {
    const readable = otherChanged.slice(0, 4).join(", ");
    logs.push(logAudit(userId, { category: "profile", action: "profile_updated", title: "Profile information updated", detail: `Fields updated: ${readable}${otherChanged.length > 4 ? ` and ${otherChanged.length - 4} more` : ""}`, meta: { fields: otherChanged } }));
  }

  return Promise.all(logs);
}

export function logDocumentUpload(userId, documentType, fileName) {
  return logAudit(userId, {
    category: "document", action: "document_uploaded",
    title: `${documentType} uploaded`,
    detail: `File: ${fileName}`,
    meta: { documentType, fileName }
  });
}

export function logDocumentDelete(userId, documentType) {
  return logAudit(userId, {
    category: "document", action: "document_deleted",
    title: `${documentType} removed`,
    detail: "Document deleted from vault",
    meta: { documentType }
  });
}

export function logScholarshipEvent(userId, eventType, detail, meta = {}) {
  const map = {
    sanctioned:         { title: "Scholarship Sanctioned ✅",          action: "scholarship_sanctioned" },
    payment_processed:  { title: "Payment Processed by Ministry",       action: "scholarship_paid" },
    defective:          { title: "Application marked Defective ⚠️",    action: "scholarship_defective" },
    applied:            { title: "Scholarship application submitted",    action: "scholarship_applied" },
    bank_failed:        { title: "Bank validation failed",              action: "scholarship_bank_failed" },
  };
  const info = map[eventType] || { title: eventType, action: eventType };
  return logAudit(userId, { category: "scholarship", ...info, detail, meta });
}
