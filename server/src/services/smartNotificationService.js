import StudentProfile from "../models/StudentProfile.js";
import Document from "../models/Document.js";
import { getLocalProfile } from "./localProfileStore.js";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createNotification, getUserId, isDuplicateNotification } from "./notificationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DOCS_STORE = path.resolve(__dirname, "../../data/documents.local.json");

// ── Scholarship windows (update yearly) ──────────────────────────────────────
const SCHOLARSHIP_WINDOWS = [
  {
    name: "NSP Post-Matric Scholarship",
    portal: "scholarships.gov.in",
    openMonth: 8, openDay: 1,    // Aug 1
    closeMonth: 10, closeDay: 31, // Oct 31
    eligibility: { maxIncome: 250000, categories: ["SC", "ST", "OBC", "Minority", "General"] },
    url: "/scholarships"
  },
  {
    name: "SSP Karnataka Scholarship",
    portal: "ssp.karnataka.gov.in",
    openMonth: 7, openDay: 15,
    closeMonth: 11, closeDay: 30,
    eligibility: { maxIncome: 250000, categories: ["SC", "ST", "OBC", "Minority", "General"] },
    url: "/scholarships"
  },
  {
    name: "INSPIRE Scholarship (DST)",
    portal: "online-inspire.gov.in",
    openMonth: 9, openDay: 1,
    closeMonth: 11, closeDay: 30,
    eligibility: { maxIncome: null, minMarks: 80, categories: ["General", "OBC", "SC", "ST"] },
    url: "/scholarships"
  },
];

// ── Document types that need periodic renewal ─────────────────────────────────
const EXPIRY_RULES = [
  { keyword: "income",   label: "Income Certificate",        validMonths: 12, priority: "high" },
  { keyword: "caste",    label: "Caste Certificate",         validMonths: 36, priority: "medium" },
  { keyword: "bonafide", label: "Bonafide Certificate",      validMonths: 12, priority: "high" },
  { keyword: "domicile", label: "Domicile Certificate",      validMonths: 60, priority: "low" },
  { keyword: "fee",      label: "Fee Receipt",               validMonths: 12, priority: "medium" },
];

// ── Check if student is likely eligible for a scholarship ────────────────────
function isEligible(profile, scholarship) {
  if (!profile) return false;
  const income = Number(profile.annualIncome) || 0;
  const marks  = Number(profile.marksPercentage) || 0;
  const cat    = profile.category || "";

  if (scholarship.eligibility.maxIncome && income > scholarship.eligibility.maxIncome) return false;
  if (scholarship.eligibility.minMarks  && marks  < scholarship.eligibility.minMarks)  return false;
  if (scholarship.eligibility.categories?.length && !scholarship.eligibility.categories.some(c => cat.toLowerCase().includes(c.toLowerCase()))) return false;
  return true;
}

// ── Main smart check engine ───────────────────────────────────────────────────
export async function runSmartNotifications(user) {
  const userId = getUserId(user);
  const created = [];

  // Fetch profile
  let profile = null;
  try {
    const { default: SP } = await import("../models/StudentProfile.js");
    if (SP.db?.readyState === 1) {
      profile = await SP.findOne({ userId }).lean();
    } else {
      profile = await getLocalProfile(userId);
    }
  } catch { /* profile stays null */ }

  const now = new Date();
  const month = now.getMonth() + 1; // 1-based

  // ── 1. BANK ISSUES ──────────────────────────────────────────────────────────
  if (profile?.aadhaarBankLinked === "No") {
    created.push(await maybe(userId, user, {
      dedupKey: "bank_aadhaar_not_linked",
      title: "⚠️ Aadhaar not linked to bank account",
      message: `Your Aadhaar is NOT seeded to ${profile.bankName || "your bank"}. All scholarship payments will fail. Visit your bank branch with Aadhaar card and ask to 'seed Aadhaar to account'.`,
      category: "bank", type: "bank", priority: "critical", actionUrl: "/profile"
    }));
  } else if (profile?.aadhaarBankLinked === "Unknown") {
    created.push(await maybe(userId, user, {
      dedupKey: "bank_aadhaar_unknown",
      title: "Check Aadhaar–bank linking status",
      message: `It's unknown if your Aadhaar is linked to ${profile.bankName || "your bank"}. Dial *99*99*1# on your Aadhaar-registered mobile to verify. Update your profile after checking.`,
      category: "bank", type: "bank", priority: "high", actionUrl: "/profile"
    }));
  }

  if (profile?.dbtEnabled === "No") {
    created.push(await maybe(userId, user, {
      dedupKey: "bank_dbt_disabled",
      title: "⚠️ DBT not enabled on your account",
      message: `Direct Benefit Transfer is OFF on ${profile.bankName || "your bank"} account. Visit the bank and say 'Enable DBT and Aadhaar Payment Bridge'. Without this, scholarship money is rejected by the bank.`,
      category: "bank", type: "bank", priority: "critical", actionUrl: "/profile"
    }));
  }

  if (profile?.npciMapping === "No" || profile?.npciMapping === "Unknown") {
    created.push(await maybe(userId, user, {
      dedupKey: "bank_npci_unknown",
      title: "Verify NPCI Aadhaar mapper",
      message: "PFMS routes payment using the NPCI directory. Check if your Aadhaar is mapped: visit pfms.nic.in → Know Your Payment → enter your Aadhaar number. Update profile after verifying.",
      category: "bank", type: "bank", priority: "medium", actionUrl: "/awareness"
    }));
  }

  // ── 2. DOCUMENT ISSUES ──────────────────────────────────────────────────────
  const docs = profile?.availableDocuments || [];

  // Warn about documents NOT uploaded yet (based on category)
  const required = getRequiredDocs(profile);
  const missing  = required.filter(r => !docs.some(d => d.toLowerCase().includes(r.keyword)));
  for (const doc of missing.slice(0, 3)) { // max 3 missing doc alerts
    created.push(await maybe(userId, user, {
      dedupKey: `doc_missing_${doc.keyword}`,
      title: `📄 Missing: ${doc.label}`,
      message: `${doc.label} is required for your scholarship application but not uploaded yet. Upload it in Document Vault before applying.`,
      category: "document", type: "document", priority: doc.priority, actionUrl: "/document-vault"
    }));
  }

  // Warn about documents that commonly expire — using actual upload date
  const uploadedDocs = await getUploadedDocs(userId);
  for (const rule of EXPIRY_RULES) {
    // Find the most recently uploaded doc matching this type
    const match = uploadedDocs
      .filter(d => d.documentType?.toLowerCase().includes(rule.keyword) || d.originalName?.toLowerCase().includes(rule.keyword))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (!match) continue;

    const uploadDate  = new Date(match.createdAt);
    const expiryDate  = new Date(uploadDate);
    expiryDate.setMonth(expiryDate.getMonth() + rule.validMonths);

    const daysToExpiry = Math.round((expiryDate - now) / 86400000);

    if (daysToExpiry <= 0) {
      // Already expired
      created.push(await maybe(userId, user, {
        dedupKey: `doc_expired_${rule.keyword}_${expiryDate.getFullYear()}_${expiryDate.getMonth()}`,
        title: `🚨 ${rule.label} has EXPIRED`,
        message: `Your ${rule.label} expired on ${expiryDate.toLocaleDateString("en-IN")}. Scholarship applications with expired documents are rejected. Get a new certificate immediately.`,
        category: "document", type: "document", priority: "critical", actionUrl: "/document-vault"
      }));
    } else if (daysToExpiry <= 60) {
      // Expiring within 60 days
      created.push(await maybe(userId, user, {
        dedupKey: `doc_expiry_${rule.keyword}_${expiryDate.getFullYear()}_${expiryDate.getMonth()}`,
        title: `📅 ${rule.label} expires in ${daysToExpiry} days`,
        message: `Your ${rule.label} will expire on ${expiryDate.toLocaleDateString("en-IN")}. Renew it before it expires — scholarship portals reject outdated certificates.`,
        category: "document", type: "document", priority: daysToExpiry <= 14 ? "high" : rule.priority, actionUrl: "/document-vault"
      }));
    }
  }

  // ── 3. SCHOLARSHIP WINDOWS ──────────────────────────────────────────────────
  for (const s of SCHOLARSHIP_WINDOWS) {
    if (!isEligible(profile, s)) continue;

    const openDate  = new Date(now.getFullYear(), s.openMonth - 1, s.openDay);
    const closeDate = new Date(now.getFullYear(), s.closeMonth - 1, s.closeDay);
    const daysToOpen  = Math.round((openDate - now) / 86400000);
    const daysToClose = Math.round((closeDate - now) / 86400000);

    if (daysToOpen > 0 && daysToOpen <= 30) {
      created.push(await maybe(userId, user, {
        dedupKey: `scholarship_opening_${s.name}_${now.getFullYear()}`,
        title: `🎓 ${s.name} opens in ${daysToOpen} days`,
        message: `Based on your profile, you are eligible for ${s.name}. Applications open on ${openDate.toDateString()} at ${s.portal}. Prepare your documents now.`,
        category: "scholarship", type: "scholarship", priority: "high", actionUrl: s.url
      }));
    } else if (daysToClose > 0 && daysToClose <= 7) {
      created.push(await maybe(userId, user, {
        dedupKey: `scholarship_deadline_${s.name}_${now.getFullYear()}`,
        title: `🚨 ${s.name} closes in ${daysToClose} days`,
        message: `DEADLINE ALERT: ${s.name} at ${s.portal} closes on ${closeDate.toDateString()}. Apply immediately if you haven't already.`,
        category: "scholarship", type: "scholarship", priority: "critical", actionUrl: s.url
      }));
    } else if (daysToOpen <= 0 && daysToClose > 0) {
      created.push(await maybe(userId, user, {
        dedupKey: `scholarship_open_${s.name}_${now.getFullYear()}_${now.getMonth()}`,
        title: `✅ ${s.name} is now OPEN`,
        message: `You are eligible for ${s.name}. Applications are OPEN until ${closeDate.toDateString()} at ${s.portal}. Don't miss this opportunity.`,
        category: "scholarship", type: "scholarship", priority: "high", actionUrl: s.url
      }));
    }
  }

  // ── 4. PROFILE COMPLETENESS ──────────────────────────────────────────────────
  const criticalFields = ["fullName","state","category","annualIncome","marksPercentage","collegeName","bankName","ifscCode","accountHolderName"];
  const emptyFields = criticalFields.filter(f => !profile?.[f] && profile?.[f] !== 0);

  if (emptyFields.length >= 3) {
    created.push(await maybe(userId, user, {
      dedupKey: `profile_incomplete_${emptyFields.length}`,
      title: "📝 Complete your scholarship profile",
      message: `${emptyFields.length} important fields are missing: ${emptyFields.slice(0,3).join(", ")}. Incomplete profiles reduce eligibility accuracy and may cause payment failures.`,
      category: "profile", type: "profile", priority: "medium", actionUrl: "/profile"
    }));
  }

  return created.filter(Boolean);
}

// ── Required documents by category ───────────────────────────────────────────
function getRequiredDocs(profile) {
  const base = [
    { keyword: "aadhaar",   label: "Aadhaar Card",          priority: "critical" },
    { keyword: "income",    label: "Income Certificate",     priority: "high" },
    { keyword: "marksheet", label: "Marksheet / Transcript", priority: "high" },
    { keyword: "passbook",  label: "Bank Passbook",          priority: "high" },
    { keyword: "fee",       label: "Fee Receipt",            priority: "high" },
    { keyword: "bonafide",  label: "Bonafide Certificate",   priority: "medium" },
  ];
  const cat = (profile?.category || "").toLowerCase();
  if (cat.includes("sc") || cat.includes("st") || cat.includes("obc") || cat.includes("minority")) {
    base.push({ keyword: "caste", label: "Caste/Category Certificate", priority: "high" });
  }
  if (profile?.disabilityStatus === "Yes") {
    base.push({ keyword: "disability", label: "Disability Certificate", priority: "high" });
  }
  return base;
}

// ── Fetch actual uploaded documents with real createdAt dates ────────────────
async function getUploadedDocs(userId) {
  try {
    if (Document.db?.readyState === 1) {
      return await Document.find({ userId }).lean();
    }
    // JSON fallback
    const raw = await readFile(LOCAL_DOCS_STORE, "utf8").catch(() => "[]");
    return JSON.parse(raw).filter(d => d.userId === userId);
  } catch {
    return [];
  }
}

// ── Batch: run document expiry check for ALL students ────────────────────────
export async function runDocumentExpiryCheck() {
  try {
    const { default: SP } = await import("../models/StudentProfile.js");
    if (SP.db?.readyState !== 1) return;
    const profiles = await SP.find({}, { userId: 1 }).lean();
    let total = 0;
    for (const p of profiles) {
      const uploadedDocs = await getUploadedDocs(p.userId?.toString());
      const now = new Date();
      for (const rule of EXPIRY_RULES) {
        const match = uploadedDocs
          .filter(d => d.documentType?.toLowerCase().includes(rule.keyword) || d.originalName?.toLowerCase().includes(rule.keyword))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        if (!match) continue;
        const uploadDate = new Date(match.createdAt);
        const expiryDate = new Date(uploadDate);
        expiryDate.setMonth(expiryDate.getMonth() + rule.validMonths);
        const daysToExpiry = Math.round((expiryDate - now) / 86400000);
        if (daysToExpiry <= 60) {
          const userId = p.userId?.toString();
          const key = `doc_expiry_batch_${rule.keyword}_${expiryDate.getFullYear()}_${expiryDate.getMonth()}`;
          const isDup = await isDuplicateNotification(userId, key, 6);
          if (!isDup) {
            await createNotification(userId, {
              title: daysToExpiry <= 0 ? `🚨 ${rule.label} EXPIRED` : `📅 ${rule.label} expires in ${daysToExpiry} days`,
              message: daysToExpiry <= 0
                ? `Your ${rule.label} expired on ${expiryDate.toLocaleDateString("en-IN")}. Renew immediately — expired documents cause scholarship rejection.`
                : `Your ${rule.label} expires on ${expiryDate.toLocaleDateString("en-IN")} (${daysToExpiry} days). Renew it before the scholarship deadline.`,
              type: "document", category: "document",
              priority: daysToExpiry <= 0 ? "critical" : daysToExpiry <= 14 ? "high" : rule.priority,
              actionUrl: "/document-vault", dedupKey: key
            });
            total++;
          }
        }
      }
    }
    console.log(`[SmartNotification] Document expiry check done — ${total} notification(s) created`);
  } catch (err) {
    console.error("[SmartNotification] runDocumentExpiryCheck error:", err.message);
  }
}

// ── Create only if not duplicate within 7 days ────────────────────────────────
async function maybe(userId, user, payload) {
  try {
    const isDup = await isDuplicateNotification(userId, payload.dedupKey, 7);
    if (isDup) return null;
    return await createNotification(userId, payload, user);
  } catch {
    return null;
  }
}
