import { readFile } from "fs/promises";

function lower(text = "") {
  return text.toLowerCase();
}

function hasAny(text, keywords) {
  const content = lower(text);
  return keywords.some((keyword) => content.includes(keyword.toLowerCase()));
}

const fieldRules = {
  "NSP Status Screenshot": [
    { field: "Application/status text", keywords: ["application", "status", "submitted", "pending", "rejected", "pfms"] },
    { field: "Portal identifier", keywords: ["national scholarship portal", "nsp", "scholarship"] },
    { field: "Verification/payment stage", keywords: ["institute", "district", "pfms", "payment", "verified", "defective"] }
  ],
  "SSP Status Screenshot": [
    { field: "Application/status text", keywords: ["application", "status", "sanction", "pending", "rejected"] },
    { field: "Portal identifier", keywords: ["state scholarship portal", "ssp", "post matric"] },
    { field: "Verification/payment stage", keywords: ["e-attestation", "college", "department", "payment", "sanction"] }
  ],
  "Aadhaar Card": [
    { field: "Aadhaar/UIDAI label", keywords: ["aadhaar", "uidai", "unique identification"] },
    { field: "Name area", keywords: ["name", "dob", "year of birth", "birth"] },
    { field: "Government label", keywords: ["government of india", "भारत सरकार"] }
  ],
  "Bank Passbook": [
    { field: "Bank name", keywords: ["bank", "branch"] },
    { field: "Account details", keywords: ["account", "account no", "account number", "a/c"] },
    { field: "IFSC code", keywords: ["ifsc"] }
  ],
  "Income Certificate": [
    { field: "Certificate label", keywords: ["income certificate", "certificate"] },
    { field: "Annual income", keywords: ["income", "annual income"] },
    { field: "Issue/authority details", keywords: ["issued", "date", "tahsildar", "revenue"] }
  ],
  "Caste Certificate": [
    { field: "Certificate label", keywords: ["caste certificate", "category certificate", "certificate"] },
    { field: "Category", keywords: ["scheduled caste", "scheduled tribe", "obc", "category", "caste"] },
    { field: "Issue/authority details", keywords: ["issued", "date", "tahsildar", "authority"] }
  ],
  Marksheet: [
    { field: "Marksheet label", keywords: ["marksheet", "statement of marks", "marks"] },
    { field: "Marks/grade", keywords: ["percentage", "cgpa", "grade", "total"] },
    { field: "Semester/year", keywords: ["semester", "year", "exam"] }
  ],
  "Bonafide Certificate": [
    { field: "Bonafide/study label", keywords: ["bonafide", "bona fide", "study certificate"] },
    { field: "Institution details", keywords: ["college", "institute", "university"] },
    { field: "Course/student details", keywords: ["student", "course", "class", "semester"] }
  ],
  "Fee Receipt": [
    { field: "Receipt label", keywords: ["receipt", "fee receipt"] },
    { field: "Paid amount", keywords: ["paid", "amount", "tuition fee", "fees"] },
    { field: "Date/receipt number", keywords: ["date", "receipt no", "transaction"] }
  ]
};

function analyzeFieldVisibility(text, documentType) {
  const rules = fieldRules[documentType] || [
    { field: "Readable text", keywords: ["student", "application", "certificate", "bank", "scholarship"] }
  ];

  const fields = rules.map((rule) => ({
    field: rule.field,
    detected: hasAny(text, rule.keywords)
  }));
  const detectedCount = fields.filter((field) => field.detected).length;
  const missingFields = fields.filter((field) => !field.detected).map((field) => field.field);

  return {
    fields,
    detectedCount,
    total: fields.length,
    missingFields,
    fieldScore: Math.round((detectedCount / fields.length) * 100)
  };
}

function getUploadDecision(qualityScore, fieldAnalysis) {
  if (qualityScore >= 80 && fieldAnalysis.missingFields.length === 0) {
    return {
      label: "Good to use",
      risk: "Low",
      message: "The upload appears readable and required fields are visible."
    };
  }

  if (qualityScore >= 60) {
    return {
      label: "Acceptable but verify",
      risk: "Medium",
      message: "The upload may work, but some details should be manually checked."
    };
  }

  return {
    label: "Re-upload recommended",
    risk: "High",
    message: "The upload may cause scholarship document rejection because text or key fields are unclear."
  };
}

export function detectDocumentType(text) {
  if (hasAny(text, ["national scholarship portal", "nsp", "application status", "pfms", "defective", "sent to pfms"])) {
    return "NSP Status Screenshot";
  }

  if (hasAny(text, ["state scholarship portal", "ssp", "post matric", "sanction", "e-attestation"])) {
    return "SSP Status Screenshot";
  }

  if (hasAny(text, ["aadhaar", "uidai", "government of india", "unique identification"])) {
    return "Aadhaar Card";
  }

  if (hasAny(text, ["ifsc", "account no", "account number", "bank", "branch"])) {
    return "Bank Passbook";
  }

  if (hasAny(text, ["income certificate", "annual income", "tahsildar", "revenue department", "nadakacheri"])) {
    return "Income Certificate";
  }

  if (hasAny(text, ["caste certificate", "category certificate", "scheduled caste", "scheduled tribe", "obc"])) {
    return "Caste Certificate";
  }

  if (hasAny(text, ["marksheet", "statement of marks", "percentage", "semester", "grade", "cgpa"])) {
    return "Marksheet";
  }

  if (hasAny(text, ["bonafide", "bona fide", "study certificate"])) {
    return "Bonafide Certificate";
  }

  if (hasAny(text, ["fee receipt", "tuition fee", "paid amount"])) {
    return "Fee Receipt";
  }

  return "Unknown Document";
}

export function analyzeStatusText(text) {
  const checks = [
    {
      keywords: ["bank validation failed", "bank validation failure"],
      issue: "Bank validation failed.",
      meaning: "Bank account number, IFSC, account activity, KYC, or Aadhaar-bank mapping may be incorrect.",
      action: "Verify account number, IFSC, active account status, KYC, DBT enablement, and Aadhaar seeding."
    },
    {
      keywords: ["payment failed", "transaction failed", "payment failure"],
      issue: "Scholarship payment failed.",
      meaning: "Payment may have failed due to bank/DBT/PFMS validation or inactive account issues.",
      action: "Check PFMS status, bank account activity, DBT status, and Aadhaar-bank linking."
    },
    {
      keywords: ["rejected", "reject"],
      issue: "Application appears rejected.",
      meaning: "The application may have failed verification or eligibility/document checks.",
      action: "Check rejection reason on official portal and contact college/nodal officer if needed."
    },
    {
      keywords: ["defective", "sent back", "correction"],
      issue: "Application may be marked defective.",
      meaning: "The application likely needs correction or document replacement.",
      action: "Open correction window, fix highlighted fields, and re-submit before deadline."
    },
    {
      keywords: ["institute verification pending", "pending at institute", "institute pending"],
      issue: "Institute verification is pending.",
      meaning: "College/institute has not completed verification yet.",
      action: "Contact your college scholarship cell or nodal officer with application ID."
    },
    {
      keywords: ["district verification pending", "pending at district"],
      issue: "District verification is pending.",
      meaning: "Application is waiting for district/department verification.",
      action: "Track status regularly and contact official helpdesk if delayed for long."
    },
    {
      keywords: ["sent to pfms", "pfms"],
      issue: "Application/payment has reached PFMS stage.",
      meaning: "Payment processing may be in progress through PFMS.",
      action: "Track payment on PFMS and ensure bank/DBT details are correct."
    },
    {
      keywords: ["application submitted", "submitted successfully"],
      issue: "Application is submitted.",
      meaning: "Submission is complete, but verification/payment stages may still be pending.",
      action: "Keep checking institute, district, and payment status before deadlines."
    }
  ];

  return checks
    .filter((check) => hasAny(text, check.keywords))
    .map(({ issue, meaning, action }) => ({ issue, meaning, action }));
}

export function analyzeDocumentFields(text, documentType) {
  const issues = [];
  const suggestions = [];

  if (documentType === "Bank Passbook") {
    if (!hasAny(text, ["ifsc"])) {
      issues.push("IFSC code is not clearly detected.");
      suggestions.push("Upload the first page of passbook where IFSC and account number are clearly visible.");
    }
    if (!hasAny(text, ["account", "a/c", "acct"])) {
      issues.push("Account number/details are not clearly detected.");
    }
  }

  if (documentType === "Income Certificate") {
    if (!hasAny(text, ["income", "annual income"])) {
      issues.push("Annual income field is not clearly detected.");
    }
    if (!hasAny(text, ["certificate", "issued", "date"])) {
      suggestions.push("Make sure certificate number and issue date are visible.");
    }
  }

  if (documentType === "Marksheet") {
    if (!hasAny(text, ["marks", "percentage", "cgpa", "grade"])) {
      issues.push("Marks/percentage/CGPA are not clearly detected.");
    }
  }

  if (documentType === "Aadhaar Card") {
    suggestions.push("Do not share full Aadhaar publicly. Use only official portals and mask Aadhaar where possible.");
  }

  return { issues, suggestions };
}

export function analyzeQuality({ text, confidence, fileSize }) {
  const issues = [];
  const suggestions = [];
  const textLength = text.trim().length;

  if (confidence < 45) {
    issues.push("OCR confidence is very low. Image may be blurry, cropped, or unclear.");
  } else if (confidence < 65) {
    issues.push("OCR confidence is moderate. Some details may not be reliable.");
  }

  if (textLength < 40) {
    issues.push("Very little text was detected from the upload.");
    suggestions.push("Upload a clearer screenshot/photo with full document visible.");
  }

  if (fileSize < 50 * 1024) {
    suggestions.push("Image file is small. A higher-resolution image may improve OCR accuracy.");
  }

  if (issues.length === 0) {
    suggestions.push("Text readability looks acceptable. Still verify details manually before submission.");
  }

  return {
    confidence: Math.round(confidence),
    textLength,
    quality: confidence >= 75 && textLength >= 100 ? "Good" : confidence >= 55 && textLength >= 50 ? "Medium" : "Poor",
    issues,
    suggestions
  };
}

export function calculateDocumentQuality({ confidence, textLength, fileSize, fieldScore }) {
  const confidenceScore = Math.min(100, Math.max(0, Math.round(confidence)));
  const textScore = textLength >= 200 ? 100 : textLength >= 100 ? 80 : textLength >= 50 ? 55 : 20;
  const fileScore = fileSize >= 150 * 1024 ? 100 : fileSize >= 50 * 1024 ? 70 : 45;

  return Math.round(confidenceScore * 0.45 + fieldScore * 0.35 + textScore * 0.15 + fileScore * 0.05);
}

// ── Name comparison helpers ───────────────────────────────────────────────────

function normalizeNameWords(name) {
  return String(name).toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/).filter(Boolean);
}

// Returns true=match, false=mismatch, null=cannot determine
function namesMatch(name1, name2) {
  const w1 = normalizeNameWords(name1);
  const w2 = normalizeNameWords(name2);
  if (!w1.length || !w2.length) return null;
  const overlap = w1.filter(w => w2.includes(w)).length;
  return overlap / Math.max(w1.length, w2.length) >= 0.5;
}

function parseDateFlexible(str) {
  if (!str) return null;
  const parts = str.split(/[\/\-\.\s]/);
  if (parts.length < 3) return null;
  // Support DD/MM/YYYY and DD/MM/YY
  let [d, m, y] = parts.map(Number);
  if (y < 100) y += 2000;
  if (!d || !m || !y || y < 1900) return null;
  return new Date(y, m - 1, d);
}

// ── Per-document field extractors ─────────────────────────────────────────────

// Words that signal the name has ended — stop before these
const NAME_STOP_WORDS = new Set([
  "register","number","roll","date","father","mother","dob","address",
  "village","district","state","pin","class","school","college","course",
  "year","sem","semester","gender","male","female","category","caste",
  "to","s/o","d/o","w/o","c/o","mr","ms","mrs","smt","sri","shri",
  "code","and","of","the","for","in","at","by"
]);

// Clean a raw OCR name — strip leading junk, limit to 4 real name words
function cleanName(raw) {
  if (!raw) return null;
  const words = raw.trim().split(/\s+/);
  const nameWords = [];
  for (const w of words) {
    if (NAME_STOP_WORDS.has(w.toLowerCase())) break; // stop here
    if (/^[A-Za-z.]{1,20}$/.test(w)) nameWords.push(w); // only alpha words
    if (nameWords.length >= 4) break; // max 4 name words
  }
  return nameWords.length >= 2 ? nameWords.join(" ") : null;
}

export function extractAadhaarFields(text) {
  const result = { name: null, dob: null, aadhaarVisible: false, hasUIDAI: false };

  result.hasUIDAI = hasAny(text, ["aadhaar", "uidai", "unique identification", "apaar"]);
  result.aadhaarVisible = /\d{4}\s*\d{4}\s*\d{4}/.test(text);

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // DOB: ONLY match after explicit label — never grab random dates (avoids signed/issue dates)
  // Pattern A: "DOB: 14/02/2002" on same line
  const dobSameLine = text.match(/(?:dob|date\s*of\s*birth|d\.o\.b)\s*[:\s]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (dobSameLine) {
    result.dob = dobSameLine[1];
  } else {
    // Pattern B: "Date of Birth" label on one line, date on the NEXT line (APAAR/DigiLocker format)
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^date\s*of\s*birth$/i.test(lines[i])) {
        const nextLine = lines[i + 1];
        const dateMatch = nextLine.match(/^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})$/);
        if (dateMatch) { result.dob = dateMatch[1]; break; }
      }
    }
  }

  // Name: Pattern A — "Name: Shalini H R" on same line
  const nameSameLine = text.match(/(?:^|\n)\s*name\s*[:\s]+([A-Za-z][A-Za-z\s.]{3,40})/im);
  if (nameSameLine) {
    result.name = cleanName(nameSameLine[1]);
  } else {
    // Pattern B — "Name" label on one line, value on the NEXT line (APAAR format)
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^name$/i.test(lines[i])) {
        const nextLine = lines[i + 1];
        // Must look like a real name (letters only, 2+ words or mixed case)
        if (/^[A-Za-z][a-zA-Z\s.]{3,40}$/.test(nextLine) && !/^\d/.test(nextLine)) {
          result.name = cleanName(nextLine);
          break;
        }
      }
    }
  }

  return result;
}

export function extractBankFields(text) {
  const result = { accountHolderName: null, ifscCode: null, accountNumber: null, bankName: null };

  // IFSC: 4 uppercase letters + "0" + 6 alphanumeric — e.g. KARB0000123
  const ifscMatch = text.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/i);
  if (ifscMatch) result.ifscCode = ifscMatch[1].toUpperCase();

  // Account number: 9–18 digits, often after "A/C", "Account No"
  const acMatch = text.match(/(?:a\/c|account\s*(?:no|number|num)?\.?)[:\s]*(\d[\d\s]{8,17}\d)/i)
    || text.match(/\b(\d{9,18})\b/);
  if (acMatch) result.accountNumber = acMatch[1].replace(/\s/g, "");

  // Account holder name — strip "To " prefix common in passbooks
  const nameMatch = text.match(/(?:account\s*holder(?:\s*name)?|in\s*favour\s*of)[:\s]+([A-Za-z\s.]{3,40})/i)
    || text.match(/(?:^|\n)\s*(?:To\s+)?([A-Z][A-Za-z\s.]{4,40})\s*(?:\n|$)/m);
  if (nameMatch) result.accountHolderName = cleanName(nameMatch[1]);

  // Bank name (common Indian banks)
  const bankMatch = text.match(/(state bank|sbi|punjab national|pnb|canara|union bank|axis|hdfc|icici|kotak|bank of baroda|bank of india|karnataka bank|vijaya bank|syndicate)[^\n,]{0,40}/i);
  if (bankMatch) result.bankName = bankMatch[0].trim().slice(0, 60);

  return result;
}

export function extractIncomeFields(text) {
  const result = { applicantName: null, annualIncome: null, issueDate: null, issuingAuthority: null, isExpired: false };

  // Income amount: "Rs. 1,80,000" or "income: 180000"
  const incomeMatch = text.match(/(?:income|annual\s*income)[:\s]*(?:rs\.?\s*|₹\s*)?(\d[\d,]+)/i)
    || text.match(/(?:rs\.?\s*|₹\s*)(\d[\d,]+)/);
  if (incomeMatch) result.annualIncome = parseInt(incomeMatch[1].replace(/,/g, ""), 10);

  // Issue date
  const dateMatch = text.match(/(?:date|issued\s*on|issue\s*date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i)
    || text.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/);
  if (dateMatch) {
    result.issueDate = dateMatch[1];
    const issued = parseDateFlexible(dateMatch[1]);
    if (issued) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      result.isExpired = issued < oneYearAgo;
    }
  }

  // Applicant name: "certify that Sri/Smt. NAME" or "Name: NAME"
  const nameMatch = text.match(/(?:certify\s*that\s*(?:sri|smt|mr|ms)?\.?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]*){1,3})/i)
    || text.match(/name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]*){1,3})/i);
  if (nameMatch) result.applicantName = nameMatch[1].trim();

  // Issuing authority
  const authMatch = text.match(/(tahsildar|revenue\s*officer|village\s*accountant|block\s*officer|deputy\s*commissioner|taluk)[^\n,]{0,50}/i);
  if (authMatch) result.issuingAuthority = authMatch[0].trim();

  return result;
}

export function extractCasteFields(text) {
  const result = { applicantName: null, category: null, issueDate: null };

  // Category: SC / ST / OBC
  const catMatch = text.match(/\b(scheduled\s*caste|scheduled\s*tribe|other\s*backward|obc|sc|st)\b/i);
  if (catMatch) {
    const raw = catMatch[1].toLowerCase();
    if (raw.includes("scheduled caste") || raw === "sc") result.category = "SC";
    else if (raw.includes("scheduled tribe") || raw === "st") result.category = "ST";
    else if (raw.includes("backward") || raw === "obc") result.category = "OBC";
  }

  const nameMatch = text.match(/(?:certify\s*that\s*(?:sri|smt|mr|ms)?\.?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]*){1,3})/i)
    || text.match(/name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]*){1,3})/i);
  if (nameMatch) result.applicantName = nameMatch[1].trim();

  const dateMatch = text.match(/(?:date|issued)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (dateMatch) result.issueDate = dateMatch[1];

  return result;
}

// Signature keywords that MUST appear in a genuine document of each type.
// If none are found, the image is likely the wrong document.
const docSignatures = {
  "Aadhaar Card":       { must: [["aadhaar","uidai","unique identification"]], nice: ["dob","date of birth","government of india"] },
  "Bank Passbook":      { must: [["account","a/c","bank"]], nice: ["ifsc","branch","passbook"] },
  "Income Certificate": { must: [["income","certificate","nadakacheri","tahsildar","revenue"]], nice: ["annual","rupees","karnataka","rd0","55000","issued"] },
  "Marksheet":          { must: [["marks","percentage","cgpa","grade","result","examination"]], nice: ["semester","board","university","total"] },
  "Caste Certificate":  { must: [["caste","certificate","category","nadakacheri","tahsildar"]], nice: ["scheduled","obc","community","karnataka"] },
  "Bonafide Certificate": { must: [["bonafide","bona fide","study certificate"]], nice: ["college","institute","student"] },
  "Fee Receipt":        { must: [["receipt","fee","paid"]], nice: ["amount","tuition","date"] }
};

// Keywords that MUST NOT appear if the document is of a certain type.
// Used for regional-language documents where positive keywords won't appear in English OCR.
const wrongDocSignatures = {
  "Income Certificate": [
    ["aadhaar","uidai","unique identification"],     // is an Aadhaar
    ["ifsc","account no","account number"],          // is a bank passbook
    ["marksheet","statement of marks","cgpa","semester","examination board"]  // is a marksheet
  ],
  "Caste Certificate": [
    ["aadhaar","uidai","unique identification"],
    ["ifsc","account no","account number"],
    ["marksheet","statement of marks","cgpa","semester"]
  ]
};

export function verifyDocumentType(text, documentType) {
  const sig = docSignatures[documentType];
  if (!sig) return { verified: true, confidence: 100, warning: null };

  const t = text.toLowerCase();

  // For documents that may be in regional languages (Kannada etc.), use NEGATIVE verification:
  // Accept if the image doesn't clearly look like a different document type.
  const negSig = wrongDocSignatures[documentType];
  if (negSig) {
    const looksLikeWrongDoc = negSig.some(group => group.some(kw => t.includes(kw)));
    if (looksLikeWrongDoc) {
      const friendlyNames = {
        "Income Certificate": "an income certificate",
        "Caste Certificate":  "a caste certificate"
      };
      return {
        verified: false,
        confidence: 0,
        warning: `This image does not look like ${friendlyNames[documentType]}. It appears to be a different document. Please upload the correct file.`
      };
    }
    // Passes negative check — accept it (could be Kannada/regional language govt cert)
    const niceCount = sig.nice.filter(kw => t.includes(kw)).length;
    return { verified: true, confidence: Math.min(100, 50 + niceCount * 10), warning: null };
  }

  // For English-primary documents: positive keyword check
  const mustMatch = sig.must.some(group => group.some(kw => t.includes(kw)));
  const niceCount = sig.nice.filter(kw => t.includes(kw)).length;
  const confidence = mustMatch ? Math.min(100, 50 + niceCount * 15) : 0;

  if (!mustMatch) {
    const friendlyNames = {
      "Aadhaar Card":         "an Aadhaar card (should contain Aadhaar/UIDAI text)",
      "Bank Passbook":        "a bank passbook (should show account number and bank name)",
      "Marksheet":            "a marksheet (should show marks, percentage, or grade)",
      "Bonafide Certificate": "a bonafide certificate",
      "Fee Receipt":          "a fee receipt (should show payment amount)"
    };
    return {
      verified: false,
      confidence: 0,
      warning: `This image does not look like ${friendlyNames[documentType] || documentType}. Please upload the correct document — uploading the wrong file will cause your scholarship to be rejected.`
    };
  }

  return { verified: true, confidence, warning: null };
}

export function extractFieldsByDocumentType(text, documentType) {
  switch (documentType) {
    case "Aadhaar Card":        return extractAadhaarFields(text);
    case "Bank Passbook":       return extractBankFields(text);
    case "Income Certificate":  return extractIncomeFields(text);
    case "Marksheet":           return extractMarksheetFields(text);
    case "Caste Certificate":   return extractCasteFields(text);
    default:                    return null;
  }
}

// ── Cross-document validator ───────────────────────────────────────────────────

const KEY_DOCS = ["Aadhaar Card", "Bank Passbook", "Income Certificate", "Marksheet", "Caste Certificate"];

export function crossValidateDocuments(extractedByType) {
  const risks = [];

  const aadhaar = extractedByType["Aadhaar Card"];
  const bank    = extractedByType["Bank Passbook"];
  const income  = extractedByType["Income Certificate"];
  const marks   = extractedByType["Marksheet"];

  // ── Rule 1: Aadhaar name vs Bank name (most common rejection cause) ──
  if (aadhaar?.name && bank?.accountHolderName) {
    const match = namesMatch(aadhaar.name, bank.accountHolderName);
    if (match === false) {
      risks.push({
        severity: "Critical",
        check: "Name: Aadhaar ↔ Bank Passbook",
        status: "FAIL",
        detail: `Aadhaar name: "${aadhaar.name}" | Bank name: "${bank.accountHolderName}"`,
        impact: "Bank validation will FAIL — NSP/SSP cannot send payment to your account",
        action: "Visit your bank branch with original Aadhaar and request a name correction to exactly match your Aadhaar"
      });
    }
  } else if (!bank) {
    risks.push({
      severity: "High",
      check: "Bank Passbook not uploaded",
      status: "MISSING",
      detail: "Bank passbook is required for scholarship payment processing",
      impact: "Cannot verify IFSC, account number, or name match",
      action: "Upload your bank passbook first page in Document Vault"
    });
  }

  // ── Rule 2: Aadhaar name vs Income Certificate name ──
  if (aadhaar?.name && income?.applicantName) {
    const match = namesMatch(aadhaar.name, income.applicantName);
    if (match === false) {
      risks.push({
        severity: "High",
        check: "Name: Aadhaar ↔ Income Certificate",
        status: "FAIL",
        detail: `Aadhaar name: "${aadhaar.name}" | Income cert name: "${income.applicantName}"`,
        impact: "Income certificate may be rejected at institute verification stage",
        action: "Get a fresh income certificate from Tahsildar with name exactly matching your Aadhaar"
      });
    }
  }

  // ── Rule 3: Aadhaar DOB vs Marksheet DOB ──
  if (aadhaar?.dob && marks?.dob) {
    const d1 = parseDateFlexible(aadhaar.dob);
    const d2 = parseDateFlexible(marks.dob);
    if (d1 && d2 && Math.abs(d1 - d2) > 1000 * 60 * 60 * 24) {
      risks.push({
        severity: "High",
        check: "Date of Birth: Aadhaar ↔ Marksheet",
        status: "FAIL",
        detail: `Aadhaar DOB: "${aadhaar.dob}" | Marksheet DOB: "${marks.dob}"`,
        impact: "DOB inconsistency is flagged as potential fraud — application may be rejected",
        action: "Verify correct DOB. Apply for Aadhaar correction at nearest Aadhaar centre if Aadhaar DOB is wrong"
      });
    }
  }

  // ── Rule 4: Income certificate expiry ──
  if (income?.isExpired) {
    risks.push({
      severity: "Critical",
      check: "Income Certificate Expired",
      status: "FAIL",
      detail: `Issue date detected: ${income.issueDate} — income certificates are valid for 1 year only`,
      impact: "Expired income certificate causes automatic rejection on NSP and SSP portals",
      action: "Apply for a fresh income certificate from your Tahsildar office immediately"
    });
  }

  // ── Rule 5: IFSC missing from bank passbook ──
  if (bank && !bank.ifscCode) {
    risks.push({
      severity: "Critical",
      check: "IFSC Code Missing — Bank Passbook",
      status: "FAIL",
      detail: "IFSC code was not detected in the uploaded passbook image",
      impact: "PFMS cannot process scholarship payment without IFSC code",
      action: "Upload the first/front page of your passbook where IFSC is clearly printed, or get a bank statement"
    });
  }

  // ── Rule 6: Account number not readable ──
  if (bank && !bank.accountNumber) {
    risks.push({
      severity: "Medium",
      check: "Account Number Not Clear — Bank Passbook",
      status: "WARN",
      detail: "Account number was not detected clearly from the uploaded image",
      impact: "Scholarship portal may fail account validation",
      action: "Re-upload a clearer photo of the passbook page showing account number"
    });
  }

  // ── Rule 7: Missing Aadhaar ──
  if (!aadhaar) {
    risks.push({
      severity: "High",
      check: "Aadhaar Card not uploaded",
      status: "MISSING",
      detail: "Aadhaar is the primary identity proof for all scholarship portals",
      impact: "All name cross-checks and DBT linking require Aadhaar",
      action: "Upload a clear photo of your Aadhaar card in Document Vault"
    });
  }

  const severity = risks.some(r => r.severity === "Critical") ? "Critical"
    : risks.some(r => r.severity === "High") ? "High"
    : risks.some(r => r.severity === "Medium") ? "Medium"
    : risks.length === 0 ? "Safe" : "Low";

  return {
    riskLevel: severity,
    summary: {
      critical: risks.filter(r => r.severity === "Critical").length,
      high:     risks.filter(r => r.severity === "High").length,
      medium:   risks.filter(r => r.severity === "Medium").length,
      total:    risks.length
    },
    risks,
    checkedAt: new Date().toISOString()
  };
}

export async function extractTextFromImage(filePath) {
  const apiKey = process.env.OCRSPACE_API_KEY;
  if (!apiKey) throw new Error("OCRSPACE_API_KEY not set in .env");

  const buffer = await readFile(filePath);
  const base64 = buffer.toString("base64");
  const ext = filePath.split(".").pop().toLowerCase();
  const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" };
  const mimeType = mimeMap[ext] || "image/jpeg";

  const body = new URLSearchParams();
  body.append("apikey", apiKey);
  body.append("base64Image", `data:${mimeType};base64,${base64}`);
  body.append("language", "eng");
  body.append("isOverlayRequired", "false");
  body.append("detectOrientation", "true");
  body.append("scale", "true");
  body.append("OCREngine", "2");

  const response = await fetch("https://api.ocr.space/parse/image", { method: "POST", body });
  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || "OCR.space processing error");
  }

  const text = data.ParsedResults?.[0]?.ParsedText || "";
  const exitCode = data.ParsedResults?.[0]?.FileParseExitCode;
  const confidence = exitCode === 1 ? 85 : exitCode === 2 ? 60 : 40;

  return { text, confidence };
}

/**
 * Extracts student details from marksheet OCR text.
 * Returns partial profile fields that can auto-fill the profile form.
 */
export function extractMarksheetFields(text) {
  const result = {
    fullName: null,
    marksPercentage: null,
    instituteName: null,
    boardName: null,
    dob: null
  };

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // ── Percentage ──────────────────────────────────────────────────────────────
  // Priority 1: explicit "(82.08%)" bracket format common in SSLC/PUC marksheets
  const bracketPct = text.match(/\((\d{2,3}(?:\.\d{1,2})?)\s*%\)/);
  if (bracketPct) {
    const val = parseFloat(bracketPct[1]);
    if (val >= 30 && val < 100) result.marksPercentage = val; // exclude exactly 100 (likely a column heading)
  }
  // Priority 2: "Total Marks Obtained ... 513" then compute from 625 (SSLC style)
  if (!result.marksPercentage) {
    const totalObtained = text.match(/total\s*marks?\s*obtained[^\d]*(\d{3})/i);
    const totalMax      = text.match(/total\s*marks?[^\d]*(\d{3})/i);
    if (totalObtained && totalMax) {
      const obtained = parseInt(totalObtained[1], 10);
      const max      = parseInt(totalMax[1], 10);
      if (max > 0 && obtained <= max) result.marksPercentage = parseFloat(((obtained / max) * 100).toFixed(2));
    }
  }
  // Priority 3: "Percentage: 82" or "82 %" not preceded by column numbers
  if (!result.marksPercentage) {
    const pctMatch = text.match(/(?:percentage|overall\s*%|result\s*%)[^\d]*(\d{2,3}(?:\.\d{1,2})?)/i);
    if (pctMatch) {
      const val = parseFloat(pctMatch[1]);
      if (val >= 30 && val < 100) result.marksPercentage = val;
    }
  }
  // Priority 4: CGPA
  if (!result.marksPercentage) {
    const cgpaMatch = text.match(/(?:cgpa|gpa|sgpa)[:\s]*(\d(?:\.\d{1,2})?)/i);
    if (cgpaMatch) {
      const cgpa = parseFloat(cgpaMatch[1]);
      if (cgpa >= 1 && cgpa <= 10) result.marksPercentage = Math.round(cgpa * 9.5);
    }
  }

  // ── Board / University ───────────────────────────────────────────────────────
  // Look for known Indian board names first (exact phrases)
  const knownBoards = [
    "Karnataka Secondary Education Examination Board",
    "Karnataka Pre University Board",
    "Central Board of Secondary Education",
    "CBSE",
    "Council for the Indian School Certificate Examinations",
    "CISCE",
    "Visvesvaraya Technological University",
    "VTU",
    "Bangalore University",
    "Mysore University",
    "Davangere University",
    "Kuvempu University",
    "Mangalore University",
    "Manipal University",
    "Rajiv Gandhi University",
  ];
  for (const board of knownBoards) {
    if (text.toLowerCase().includes(board.toLowerCase())) {
      result.boardName = board;
      break;
    }
  }
  // Fallback: extract "XX Board" or "XX University" from text
  if (!result.boardName) {
    const boardMatch = text.match(/([A-Z][A-Za-z\s]{5,50}(?:Board|University|Institute))/);
    if (boardMatch) result.boardName = boardMatch[1].trim().slice(0, 80);
  }

  // ── Institution name ─────────────────────────────────────────────────────────
  // Skip lines that are just labels (contain "CODE", "ADDRESS :", "NAME AND", etc.)
  const LABEL_PATTERNS = /school\s*code|name\s*and\s*address|address\s*:|institute\s*code|college\s*code/i;
  for (const line of lines) {
    if (/college|institute|university/i.test(line) && !LABEL_PATTERNS.test(line) && line.length > 5 && line.length < 120) {
      result.instituteName = line.replace(/^[^:]+:\s*/, "").trim().slice(0, 80);
      break;
    }
  }
  // For SSLC marksheet: school block is "SCHOOL CODE, NAME AND ADDRESS :\nIA0402\nSMT YAMUNABAI..."
  // Skip the code line (alphanumeric short code) and grab the actual school name
  if (!result.instituteName) {
    const blockMatch = text.match(/school\s*code[^:\n]*:[^\n]*\n([^\n]*)\n([^\n]*)/i);
    if (blockMatch) {
      const line1 = blockMatch[1].trim(); // IA0402 (code)
      const line2 = blockMatch[2].trim(); // SMT YAMUNABAI SHANTARAM NALLUR (name)
      // If line1 looks like a code (short alphanumeric), use line2 as the name
      if (/^[A-Z0-9]{4,10}$/.test(line1) && line2.length > 5) {
        result.instituteName = line2;
      } else if (line1.length > 5) {
        result.instituteName = line1;
      }
    }
  }

  // ── Student name ─────────────────────────────────────────────────────────────
  // Handle formats: "Name : SHALINI H R" and "/ Name : SHALINI H R" and "oxo / Name : SHALINI H R"
  const nameMatch = text.match(/(?:\/\s*)?(?:candidate[‘’s]*\s*name|student\s*name|name\s*of\s*student|name)\s*[:/]\s*([A-Z][A-Za-z\s.]{2,40})/im)
    || text.match(/\bName\s+([A-Z][A-Za-z\s.]{3,40})/m);
  if (nameMatch) result.fullName = cleanName(nameMatch[1]);

  // ── DOB ───────────────────────────────────────────────────────────────────────
  const dobMatch = text.match(/(?:dob|date\s*of\s*birth|birth\s*date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (dobMatch) result.dob = dobMatch[1];

  return result;
}

export async function analyzeUploadedImage(file) {
  const ocr = await extractTextFromImage(file.path, file.buffer);
  const documentType = detectDocumentType(ocr.text);
  const statusFindings = analyzeStatusText(ocr.text);
  const fieldAnalysis = analyzeDocumentFields(ocr.text, documentType);
  const quality = analyzeQuality({ text: ocr.text, confidence: ocr.confidence, fileSize: file.size });
  const fieldVisibility = analyzeFieldVisibility(ocr.text, documentType);
  const qualityScore = calculateDocumentQuality({
    confidence: quality.confidence,
    textLength: quality.textLength,
    fileSize: file.size,
    fieldScore: fieldVisibility.fieldScore
  });
  const uploadDecision = getUploadDecision(qualityScore, fieldVisibility);
  const issues = [
    ...quality.issues,
    ...fieldAnalysis.issues,
    ...fieldVisibility.missingFields.map((field) => `${field} is not clearly visible.`),
    ...statusFindings.map((finding) => finding.issue)
  ];
  const suggestions = [
    ...quality.suggestions,
    ...fieldAnalysis.suggestions,
    "Use a straight, full-page image with all corners visible and no glare.",
    "Avoid cropped screenshots, dark photos, and compressed WhatsApp images for final upload.",
    ...statusFindings.map((finding) => finding.action)
  ];

  const autoFillFields = documentType === "Marksheet" ? extractMarksheetFields(ocr.text) : null;

  return {
    fileName: file.originalname,
    documentType,
    confidence: quality.confidence,
    qualityScore,
    quality: quality.quality,
    uploadDecision,
    fieldVisibility,
    textLength: quality.textLength,
    extractedText: ocr.text.slice(0, 2500),
    statusFindings,
    autoFillFields,
    issues: issues.length ? issues : ["No major issue detected from OCR text."],
    suggestions: suggestions.length ? suggestions : ["Verify all details on the official scholarship portal."],
    safetyNote: "Do not share OTP or full Aadhaar details. Use only official scholarship portals."
  };
}
