import { createWorker } from "tesseract.js";

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

  if (hasAny(text, ["income certificate", "annual income", "tahsildar", "revenue department"])) {
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

export async function extractTextFromImage(filePath) {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(filePath);
    return {
      text: result.data.text || "",
      confidence: result.data.confidence || 0
    };
  } finally {
    await worker.terminate();
  }
}

export async function analyzeUploadedImage(file) {
  const ocr = await extractTextFromImage(file.path);
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
    issues: issues.length ? issues : ["No major issue detected from OCR text."],
    suggestions: suggestions.length ? suggestions : ["Verify all details on the official scholarship portal."],
    safetyNote: "Do not share OTP or full Aadhaar details. Use only official scholarship portals."
  };
}
