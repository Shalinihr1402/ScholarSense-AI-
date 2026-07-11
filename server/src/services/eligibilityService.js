/**
 * Scholarship eligibility engine — real NSP/SSP rules
 *
 * Key fixes over v1:
 * 1. Category matching — profile stores "SC (Scheduled Caste)", scholarship stores "SC" — normalise both
 * 2. Course level matching — profile stores course name (MCA, B.Tech), scholarship stores levels (UG, PG) — map correctly
 * 3. Education level → course level mapping — use educationLevel first, then course name
 * 4. Income 0 means "no limit" (police/CAPF scholarships) — don't fail on incomeLimit: 0
 * 5. Marks 0 means "no minimum" — don't fail when minMarks: 0
 * 6. Gender stored as "Female"/"Male" — match against scholarship.gender
 * 7. Minority scholarships — check minorityStatus, not just category
 * 8. Disability scholarships — check disabilityStatus AND disabilityPercentage >= 40
 * 9. State-specific Karnataka scholarships — match Karnataka profile state
 * 10. Missing profile fields → "Check" not "Not Eligible" — don't punish incomplete profiles
 */

// ─── Normalise category strings ──────────────────────────────────────────────
function normaliseCategory(raw = "") {
  const s = raw.toLowerCase();
  if (s.includes("sc") && !s.includes("st")) return "SC";
  if (s.includes("st"))                      return "ST";
  if (s.includes("obc"))                     return "OBC";
  if (s.includes("ews"))                     return "EWS";
  if (s.includes("minority"))                return "Minority";
  if (s.includes("general"))                 return "General";
  return raw.trim();
}

// ─── Map education level + course name → NSP course level buckets ─────────────
function deriveCourseLevel(educationLevel = "", course = "") {
  const el = educationLevel.toLowerCase();
  const c  = course.toLowerCase();

  if (el.includes("phd") || el.includes("research") || c.includes("phd")) return "Ph.D";
  if (el.includes("post graduate") || el.includes("pg") ||
      c.match(/\b(pg|mca|mba|m\.tech|msc|mcom|ma |m\.a|m\.com|m\.sc|mphil|m\.phil)\b/))
    return "PG";
  if (el.includes("degree") || el.includes("ug") ||
      c.match(/\b(b\.tech|btech|be\b|bca|bsc|bcom|ba\b|b\.a|b\.com|b\.sc|b\.e\b|llb|mbbs|bds|bpharm|b\.arch)\b/))
    return "UG";
  if (el.includes("diploma") || el.includes("iti") || c.includes("diploma") || c.includes("iti"))
    return "Diploma";
  if (el.includes("puc") || el.includes("11") || el.includes("12") || c.includes("puc"))
    return "Post-Matric";
  if (el.includes("school") || el.includes("class 1") || el.includes("class 9") || el.includes("class 10") ||
      el.includes("pre-matric") || el.includes("prematric"))
    return "Pre-Matric";
  return null;
}

function courseLevelMatches(scholarshipLevels = [], educationLevel = "", course = "") {
  if (!scholarshipLevels.length) return true;

  const derived = deriveCourseLevel(educationLevel, course);
  if (!derived) return null; // unknown — treat as warning not failure

  const levels = scholarshipLevels.map(l => l.toLowerCase());

  // Exact match
  if (levels.includes(derived.toLowerCase())) return true;

  // Broad groupings
  const isPostMatric = ["post-matric", "ug", "pg", "diploma", "iti", "ph.d"].includes(derived.toLowerCase());
  if (levels.includes("post-matric") && isPostMatric) return true;

  return false;
}

// ─── Days until deadline ──────────────────────────────────────────────────────
function daysUntil(dateString) {
  if (!dateString) return null;
  const today    = new Date();
  const deadline = new Date(`${dateString}T23:59:59`);
  return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

// ─── Main evaluator ───────────────────────────────────────────────────────────
export function evaluateScholarshipEligibility(profile, scholarship) {
  const matched  = [];
  const warnings = [];
  const failed   = [];

  // No profile at all
  if (!profile) {
    return {
      status: "Check", matchScore: 0, matched, warnings: ["Complete your student profile to check eligibility."], failed,
      missingDocuments: [], daysLeft: daysUntil(scholarship.deadline)
    };
  }

  // ── 1. State ────────────────────────────────────────────────────────────────
  const scholarshipState = (scholarship.state || "").toLowerCase().trim();
  const profileState     = (profile.state     || "").toLowerCase().trim();

  if (scholarshipState === "all india") {
    matched.push("Available across all states (All India scheme).");
  } else if (!profileState) {
    warnings.push("Add your state in profile to confirm state eligibility.");
  } else if (scholarshipState === profileState) {
    matched.push(`State matched: ${scholarship.state}.`);
  } else {
    failed.push(`This scholarship is for ${scholarship.state} residents. Your profile shows ${profile.state}.`);
  }

  // ── 2. Category ─────────────────────────────────────────────────────────────
  const profileCat = normaliseCategory(profile.category || "");
  const schemeCats = (scholarship.categories || []).map(normaliseCategory);

  if (!profile.category) {
    warnings.push("Add your category (SC/ST/OBC/General/EWS/Minority) in profile.");
  } else if (schemeCats.includes("General") || schemeCats.includes(profileCat)) {
    matched.push(`Category ${profileCat} is eligible for this scheme.`);
  } else if (scholarship.name.toLowerCase().includes("minority") || schemeCats.includes("Minority")) {
    // Minority schemes — check minorityStatus
    if (profile.minorityStatus === "Yes") {
      matched.push("Minority status confirmed.");
    } else if (!profile.minorityStatus || profile.minorityStatus === "Unknown") {
      warnings.push("Confirm your minority religion status in profile (Muslim/Christian/Sikh/Buddhist/Parsi/Jain).");
    } else {
      failed.push(`This scheme is for minority community students. Your category is ${profileCat}.`);
    }
  } else {
    failed.push(`Your category (${profileCat}) does not match this scheme's eligible categories: ${schemeCats.join(", ")}.`);
  }

  // ── 3. Income ───────────────────────────────────────────────────────────────
  const incomeLimit    = Number(scholarship.incomeLimit);
  const incomeLimitMin = Number(scholarship.incomeLimitMin || 0);
  const income         = Number(profile.annualIncome);

  if (incomeLimit === 0 && incomeLimitMin === 0) {
    matched.push("No family income restriction for this scheme.");
  } else if (!profile.annualIncome && profile.annualIncome !== 0) {
    if (incomeLimitMin > 0) {
      warnings.push(`This scheme is for income between ₹${incomeLimitMin.toLocaleString("en-IN")} and ₹${incomeLimit.toLocaleString("en-IN")}. Add annual income in profile.`);
    } else {
      warnings.push(`Income limit is ₹${incomeLimit.toLocaleString("en-IN")}. Add annual family income in profile.`);
    }
  } else if (incomeLimitMin > 0) {
    // Income must fall within a range (e.g. SSP Technical SC/ST: ₹2.5L–₹10L)
    if (income < incomeLimitMin) {
      failed.push(`Income ₹${income.toLocaleString("en-IN")} is below the minimum ₹${incomeLimitMin.toLocaleString("en-IN")} required. This scheme targets students whose family income is above ₹${incomeLimitMin.toLocaleString("en-IN")} (but below ₹${incomeLimit.toLocaleString("en-IN")}).`);
    } else if (income > incomeLimit) {
      failed.push(`Annual income ₹${income.toLocaleString("en-IN")} exceeds the limit of ₹${incomeLimit.toLocaleString("en-IN")} for this scheme.`);
    } else {
      matched.push(`Annual income ₹${income.toLocaleString("en-IN")} is within the required range (₹${incomeLimitMin.toLocaleString("en-IN")}–₹${incomeLimit.toLocaleString("en-IN")}).`);
    }
  } else if (income <= incomeLimit) {
    matched.push(`Annual income ₹${income.toLocaleString("en-IN")} is within the limit of ₹${incomeLimit.toLocaleString("en-IN")}.`);
  } else {
    failed.push(`Annual income ₹${income.toLocaleString("en-IN")} exceeds the limit of ₹${incomeLimit.toLocaleString("en-IN")} for this scheme.`);
  }

  // ── 3b. Parent Profession ────────────────────────────────────────────────────
  const reqProfession = (scholarship.parentProfession || "").trim();
  if (reqProfession) {
    const profProfession = (profile.parentProfession || "").toLowerCase();
    const reqLower = reqProfession.toLowerCase();
    // "Defence (Army/Navy/Air Force)" matches scholarship.parentProfession "Defence"
    const normProf = profProfession.split("(")[0].trim();
    if (!profile.parentProfession) {
      warnings.push(`This scheme requires parent to be a ${reqProfession}. Add parent profession in profile.`);
    } else if (normProf.includes(reqLower) || reqLower.includes(normProf)) {
      matched.push(`Parent profession (${profile.parentProfession}) matches this scheme's requirement.`);
    } else {
      failed.push(`This scheme is only for children of ${reqProfession}. Your parent's profession is listed as: ${profile.parentProfession}.`);
    }
  }

  // ── 4. Marks ────────────────────────────────────────────────────────────────
  const minMarks = Number(scholarship.minMarks);
  const marks    = Number(profile.marksPercentage);

  if (minMarks === 0) {
    matched.push("No minimum marks required for this scheme.");
  } else if (!profile.marksPercentage && profile.marksPercentage !== 0) {
    warnings.push(`This scheme requires ${minMarks}% minimum marks. Add your marks in profile.`);
  } else if (marks >= minMarks) {
    matched.push(`Your marks (${marks}%) meet the minimum requirement of ${minMarks}%.`);
  } else {
    failed.push(`Your marks (${marks}%) are below the required ${minMarks}% for this scheme.`);
  }

  // ── 5. Course / Education Level ──────────────────────────────────────────────
  if (scholarship.courseLevels?.length) {
    const result = courseLevelMatches(scholarship.courseLevels, profile.educationLevel || "", profile.course || "");
    if (result === true) {
      matched.push(`Your course level (${deriveCourseLevel(profile.educationLevel, profile.course) || profile.course}) is covered by this scheme.`);
    } else if (result === null) {
      warnings.push(`Verify that your course (${profile.course || profile.educationLevel || "not filled"}) qualifies under: ${scholarship.courseLevels.join(", ")}.`);
    } else {
      failed.push(`Your course level does not match. Scheme covers: ${scholarship.courseLevels.join(", ")}. Your level: ${deriveCourseLevel(profile.educationLevel, profile.course) || "not determined"}.`);
    }
  }

  // ── 6. Gender ────────────────────────────────────────────────────────────────
  const requiredGender = (scholarship.gender || "Any").toLowerCase();
  const profileGender  = (profile.gender || "").toLowerCase();

  if (requiredGender === "any") {
    matched.push("Open to all genders.");
  } else if (!profileGender) {
    warnings.push(`This scheme is for ${scholarship.gender} students. Add your gender in profile.`);
  } else if (requiredGender === profileGender) {
    matched.push(`Gender requirement matched (${scholarship.gender}).`);
  } else {
    failed.push(`This scheme is only for ${scholarship.gender} students.`);
  }

  // ── 7. Disability ────────────────────────────────────────────────────────────
  if (scholarship.disabilityRequired) {
    if (profile.disabilityStatus === "Yes") {
      const pct = Number(profile.disabilityPercentage);
      if (pct && pct < 40) {
        warnings.push(`Your disability percentage (${pct}%) may be below the 40% minimum required for this scheme.`);
      } else if (pct >= 40) {
        matched.push(`Disability certificate confirmed (${pct}%).`);
      } else {
        matched.push("Disability status confirmed.");
      }
    } else if (!profile.disabilityStatus || profile.disabilityStatus === "Unknown") {
      warnings.push("This scheme requires a disability certificate (≥40%). Update disability status in your profile.");
    } else {
      failed.push("This scheme requires a valid disability certificate from a government hospital.");
    }
  }

  // ── 8. Missing documents ──────────────────────────────────────────────────────
  const availableDocs  = (profile.availableDocuments || []).map(d => d.toLowerCase());
  const requiredDocs   = scholarship.requiredDocuments || [];
  const missingDocuments = requiredDocs.filter(doc => {
    const d = doc.toLowerCase();
    return !availableDocs.some(a => a.includes(d.split("(")[0].trim()) || d.includes(a.split("(")[0].trim()));
  });

  if (requiredDocs.length === 0) {
    // no doc list specified
  } else if (missingDocuments.length === 0) {
    matched.push("All required documents are available in your vault.");
  } else {
    warnings.push(`Missing ${missingDocuments.length} document(s): ${missingDocuments.slice(0, 3).join(", ")}${missingDocuments.length > 3 ? ` +${missingDocuments.length - 3} more` : ""}.`);
  }

  // ── 9. Deadline ───────────────────────────────────────────────────────────────
  const daysLeft = daysUntil(scholarship.deadline);
  if (daysLeft !== null) {
    if (daysLeft < 0) {
      warnings.push(`Application deadline was ${Math.abs(daysLeft)} day(s) ago — check if extended.`);
    } else if (daysLeft === 0) {
      warnings.push("Today is the last day to apply!");
    } else if (daysLeft <= 15) {
      warnings.push(`Only ${daysLeft} day(s) left to apply — act fast.`);
    }
  }

  // ── 10. DBT readiness ─────────────────────────────────────────────────────────
  if (profile.aadhaarBankLinked !== "Yes") {
    warnings.push("Aadhaar is not linked to your bank — scholarship money cannot be transferred via DBT.");
  }
  if (profile.dbtEnabled !== "Yes") {
    warnings.push("DBT is not enabled on your bank account — visit your bank branch to activate.");
  }

  // ── Final score & status ──────────────────────────────────────────────────────
  // Hard failures = Not Eligible
  // Warnings only = Check (needs verification)
  // All matched   = Eligible
  const hardChecks = 7; // state, category, income, marks, course, gender, parentProfession
  const hardFailures = failed.length;
  const matchScore = Math.max(0, Math.round(((hardChecks - hardFailures) / hardChecks) * 100));

  let status;
  if (hardFailures > 0) {
    status = "Not Eligible";
  } else if (warnings.length > 0) {
    status = "Check";
  } else {
    status = "Eligible";
  }

  return { status, matchScore, matched, warnings, failed, missingDocuments, daysLeft };
}

// ─── Batch evaluate ───────────────────────────────────────────────────────────
export function evaluateScholarships(profile, scholarships) {
  return scholarships
    .map(s => ({ ...s, eligibility: evaluateScholarshipEligibility(profile, s) }))
    .sort((a, b) => {
      const rank = { Eligible: 0, Check: 1, "Not Eligible": 2 };
      return rank[a.eligibility.status] - rank[b.eligibility.status]
          || b.eligibility.matchScore - a.eligibility.matchScore;
    });
}
