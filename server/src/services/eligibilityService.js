function lower(value) {
  return String(value || "").toLowerCase();
}

function includesIgnoreCase(values = [], target) {
  return values.map(lower).includes(lower(target));
}

function courseMatches(scholarshipCourses = [], profileCourse = "") {
  if (!profileCourse) {
    return false;
  }

  const profile = lower(profileCourse);
  return scholarshipCourses.some((course) => profile.includes(lower(course)) || lower(course).includes(profile));
}

function daysUntil(dateString) {
  if (!dateString) {
    return null;
  }

  const today = new Date();
  const deadline = new Date(`${dateString}T23:59:59`);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function evaluateScholarshipEligibility(profile, scholarship) {
  const matched = [];
  const warnings = [];
  const failed = [];

  if (!profile) {
    return {
      status: "Check",
      matchScore: 0,
      matched,
      warnings: ["Complete your student profile before checking eligibility."],
      failed,
      daysLeft: daysUntil(scholarship.deadline)
    };
  }

  if (scholarship.state === "All India" || lower(scholarship.state) === lower(profile.state)) {
    matched.push("State rule matched.");
  } else {
    failed.push(`This scholarship is for ${scholarship.state}, but your profile state is ${profile.state || "missing"}.`);
  }

  if (includesIgnoreCase(scholarship.categories, profile.category)) {
    matched.push("Category matched.");
  } else {
    failed.push(`Category ${profile.category || "missing"} is not listed for this scholarship.`);
  }

  if (Number(profile.annualIncome) <= Number(scholarship.incomeLimit)) {
    matched.push("Income is within the allowed limit.");
  } else {
    failed.push(`Annual income exceeds the limit of Rs. ${Number(scholarship.incomeLimit).toLocaleString("en-IN")}.`);
  }

  if (Number(profile.marksPercentage) >= Number(scholarship.minMarks)) {
    matched.push("Marks percentage meets the minimum requirement.");
  } else {
    failed.push(`Marks are below the minimum requirement of ${scholarship.minMarks}%.`);
  }

  if (courseMatches(scholarship.courseLevels, profile.course)) {
    matched.push("Course level matched.");
  } else {
    warnings.push("Course level should be verified against the official scheme rules.");
  }

  if (scholarship.gender === "Any" || lower(scholarship.gender) === lower(profile.gender)) {
    matched.push("Gender requirement matched.");
  } else {
    failed.push(`This scholarship is marked for ${scholarship.gender} students.`);
  }

  if (!scholarship.disabilityRequired || profile.disabilityStatus === "Yes") {
    matched.push("Disability requirement matched.");
  } else {
    failed.push("This scholarship requires disability certificate/status.");
  }

  const availableDocuments = profile.availableDocuments || [];
  const missingDocuments = (scholarship.requiredDocuments || []).filter(
    (documentName) => !includesIgnoreCase(availableDocuments, documentName)
  );

  if (missingDocuments.length === 0) {
    matched.push("Required document checklist is complete.");
  } else {
    warnings.push(`Missing documents: ${missingDocuments.join(", ")}.`);
  }

  const daysLeft = daysUntil(scholarship.deadline);

  if (daysLeft !== null && daysLeft < 0) {
    failed.push("Scholarship deadline appears to be expired.");
  } else if (daysLeft !== null && daysLeft <= 10) {
    warnings.push(`Deadline is close: ${daysLeft} day(s) left.`);
  }

  if (profile.aadhaarBankLinked !== "Yes") {
    warnings.push("Aadhaar-bank linking is not confirmed for DBT.");
  }

  if (profile.dbtEnabled !== "Yes") {
    warnings.push("DBT enabled status is not confirmed.");
  }

  if (profile.bankAccountActive !== "Yes") {
    warnings.push("Bank account active status is not confirmed.");
  }

  const totalChecks = 8;
  const hardFailures = failed.length;
  const matchScore = Math.max(0, Math.round(((totalChecks - hardFailures) / totalChecks) * 100));
  let status = "Eligible";

  if (failed.length > 0) {
    status = "Not Eligible";
  } else if (warnings.length > 0) {
    status = "Check";
  }

  return {
    status,
    matchScore,
    matched,
    warnings,
    failed,
    missingDocuments,
    daysLeft
  };
}

export function evaluateScholarships(profile, scholarships) {
  const results = scholarships.map((scholarship) => ({
    ...scholarship,
    eligibility: evaluateScholarshipEligibility(profile, scholarship)
  }));

  return results.sort((a, b) => {
    const rank = { Eligible: 0, Check: 1, "Not Eligible": 2 };
    return rank[a.eligibility.status] - rank[b.eligibility.status] || b.eligibility.matchScore - a.eligibility.matchScore;
  });
}
