import { getProfileInsights } from "./profileService.js";

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function issue(priority, type, title, reason, action, source = "Profile and scholarship rules") {
  return { priority, type, title, reason, action, source };
}

function priorityRank(priority) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[priority] ?? 4;
}

export function diagnoseScholarshipRisks(profile, eligibilityResults, readiness) {
  const issues = [];
  const insights = getProfileInsights(profile || {});

  if (!profile) {
    issues.push(
      issue(
        "critical",
        "profile",
        "Student profile not completed",
        "Eligibility, readiness, and failure prediction require saved student details.",
        "Open Profile page and save student details before applying for any scholarship."
      )
    );
  }

  if (insights.missingFields.length > 0) {
    issues.push(
      issue(
        "high",
        "profile",
        "Important profile fields are missing",
        `Missing fields: ${insights.missingFields.join(", ")}.`,
        "Complete these fields so eligibility prediction can become accurate."
      )
    );
  }

  if (profile?.aadhaarBankLinked !== "Yes") {
    issues.push(
      issue(
        "high",
        "dbt",
        "Aadhaar-bank linking not confirmed",
        "Scholarship payment may fail if Aadhaar is not seeded/mapped with the active bank account.",
        "Check Aadhaar-bank seeding status and update it through bank/official portal if required."
      )
    );
  }

  if (profile?.dbtEnabled !== "Yes") {
    issues.push(
      issue(
        "high",
        "dbt",
        "DBT status not confirmed",
        "Direct Benefit Transfer must be enabled for many scholarship payments.",
        "Confirm DBT enablement with bank or official DBT/Aadhaar status links."
      )
    );
  }

  if (profile?.bankAccountActive !== "Yes") {
    issues.push(
      issue(
        "high",
        "bank",
        "Bank account active status not confirmed",
        "Inactive, frozen, or incorrect bank accounts can cause payment failure.",
        "Verify account activity, IFSC, account number, and KYC details with the bank."
      )
    );
  }

  const eligible = eligibilityResults.filter((item) => item.eligibility.status === "Eligible");
  const check = eligibilityResults.filter((item) => item.eligibility.status === "Check");
  const notEligible = eligibilityResults.filter((item) => item.eligibility.status === "Not Eligible");
  const candidates = [...eligible, ...check].slice(0, 5);

  if (eligible.length === 0) {
    issues.push(
      issue(
        "critical",
        "eligibility",
        "No fully eligible scholarship found",
        "Your current profile does not completely match any scholarship in the database.",
        "Review income, category, marks, course, state, and gender details."
      )
    );
  }

  const hardFailures = unique(notEligible.flatMap((item) => item.eligibility.failed || []));
  hardFailures.slice(0, 5).forEach((failure) => {
    issues.push(
      issue(
        "medium",
        "eligibility",
        "Eligibility rule mismatch",
        failure,
        "Compare your profile with the scheme criteria and verify official scholarship rules."
      )
    );
  });

  const missingDocuments = unique(candidates.flatMap((item) => item.eligibility.missingDocuments || []));
  if (missingDocuments.length > 0) {
    issues.push(
      issue(
        "high",
        "document",
        "Required documents are missing",
        `Missing documents for top matching scholarships: ${missingDocuments.join(", ")}.`,
        "Prepare clear scanned copies before applying. Blurry, cropped, or wrong uploads can cause rejection."
      )
    );
  }

  const closeDeadlines = candidates.filter(
    (item) => typeof item.eligibility.daysLeft === "number" && item.eligibility.daysLeft >= 0 && item.eligibility.daysLeft <= 10
  );
  if (closeDeadlines.length > 0) {
    issues.push(
      issue(
        "medium",
        "deadline",
        "Scholarship deadline is near",
        `${closeDeadlines[0].name} has ${closeDeadlines[0].eligibility.daysLeft} day(s) left.`,
        "Complete documents and submit before the deadline. Also track correction windows."
      )
    );
  }

  const expired = eligibilityResults.filter((item) => item.eligibility.failed?.includes("Scholarship deadline appears to be expired."));
  if (expired.length > 0) {
    issues.push(
      issue(
        "high",
        "deadline",
        "Some scholarships appear expired",
        `${expired.length} scholarship(s) have expired deadlines in the current dataset.`,
        "Look for renewal/correction windows or next academic year application dates."
      )
    );
  }

  if (readiness?.totalScore < 50) {
    issues.push(
      issue(
        "critical",
        "readiness",
        "Readiness score is too low",
        `Current readiness score is ${readiness.totalScore}/100.`,
        "Fix high-priority profile, DBT, and document issues before applying."
      )
    );
  } else if (readiness?.totalScore < 70) {
    issues.push(
      issue(
        "high",
        "readiness",
        "Readiness score needs improvement",
        `Current readiness score is ${readiness.totalScore}/100.`,
        "Complete the action plan from the Readiness Score page."
      )
    );
  }

  const sortedIssues = issues.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  const criticalCount = sortedIssues.filter((item) => item.priority === "critical").length;
  const highCount = sortedIssues.filter((item) => item.priority === "high").length;
  const mediumCount = sortedIssues.filter((item) => item.priority === "medium").length;
  const riskLevel = criticalCount > 0 ? "Critical" : highCount > 0 ? "High" : mediumCount > 0 ? "Medium" : "Low";

  const actionPlan = sortedIssues.slice(0, 6).map((item, index) => ({
    step: index + 1,
    title: item.title,
    action: item.action
  }));

  if (actionPlan.length === 0) {
    actionPlan.push({
      step: 1,
      title: "Verify official portal",
      action: "No major risk detected. Recheck official NSP/SSP/AICTE portal details before submission."
    });
  }

  return {
    riskLevel,
    issueCount: sortedIssues.length,
    counts: { critical: criticalCount, high: highCount, medium: mediumCount, low: sortedIssues.filter((item) => item.priority === "low").length },
    issues: sortedIssues,
    actionPlan,
    summary: {
      eligibleCount: eligible.length,
      checkCount: check.length,
      notEligibleCount: notEligible.length,
      readinessScore: readiness?.totalScore ?? 0
    }
  };
}
