import { getProfileInsights } from "./profileService.js";

function average(values) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function deadlineScore(eligibleScholarships) {
  const days = eligibleScholarships
    .map((scholarship) => scholarship.eligibility.daysLeft)
    .filter((value) => typeof value === "number");

  if (!days.length) {
    return 10;
  }

  const bestDaysLeft = Math.max(...days);

  if (bestDaysLeft < 0) {
    return 0;
  }

  if (bestDaysLeft <= 3) {
    return 4;
  }

  if (bestDaysLeft <= 10) {
    return 7;
  }

  return 10;
}

function getStatus(score) {
  if (score >= 85) {
    return {
      label: "Ready",
      riskLevel: "Low",
      summary: "Your profile is strong for scholarship application. Verify official portal details before applying."
    };
  }

  if (score >= 70) {
    return {
      label: "Almost Ready",
      riskLevel: "Medium",
      summary: "You are close to ready, but a few document or DBT checks should be completed first."
    };
  }

  if (score >= 50) {
    return {
      label: "Needs Attention",
      riskLevel: "High",
      summary: "Important eligibility, document, or DBT details are missing and may affect scholarship success."
    };
  }

  return {
    label: "Not Ready",
    riskLevel: "Critical",
    summary: "Complete your student profile and resolve major issues before applying."
  };
}

export function calculateReadiness(profile, eligibilityResults) {
  const insights = getProfileInsights(profile || {});
  const eligible = eligibilityResults.filter((scholarship) => scholarship.eligibility.status === "Eligible");
  const check = eligibilityResults.filter((scholarship) => scholarship.eligibility.status === "Check");
  const topCandidates = [...eligible, ...check].slice(0, 5);

  const profilePoints = Math.round((insights.completion / 100) * 20);
  const eligibilityAverage = average(topCandidates.map((scholarship) => scholarship.eligibility.matchScore));
  const eligibilityPoints = Math.round((eligibilityAverage / 100) * 30);

  const requiredDocuments = new Set();
  topCandidates.forEach((scholarship) => {
    (scholarship.requiredDocuments || []).forEach((documentName) => requiredDocuments.add(documentName));
  });
  const availableDocuments = new Set(profile?.availableDocuments || []);
  const documentTotal = requiredDocuments.size || 1;
  const documentMatched = [...requiredDocuments].filter((documentName) =>
    [...availableDocuments].some((available) => available.toLowerCase() === documentName.toLowerCase())
  ).length;
  const documentPoints = Math.round((documentMatched / documentTotal) * 20);

  const dbtChecks = [profile?.aadhaarBankLinked, profile?.dbtEnabled, profile?.bankAccountActive];
  const dbtMatched = dbtChecks.filter((value) => value === "Yes").length;
  const dbtPoints = Math.round((dbtMatched / 3) * 20);

  const deadlinePoints = deadlineScore(topCandidates);
  const totalScore = clamp(profile ? profilePoints + eligibilityPoints + documentPoints + dbtPoints + deadlinePoints : 0);
  const status = getStatus(totalScore);

  const missingDocuments = [...requiredDocuments].filter(
    (documentName) =>
      ![...availableDocuments].some((available) => available.toLowerCase() === documentName.toLowerCase())
  );

  const recommendations = [];

  if (!profile) {
    recommendations.push("Create and save your student profile first.");
  }

  if (insights.missingFields.length > 0) {
    recommendations.push(`Complete missing profile fields: ${insights.missingFields.join(", ")}.`);
  }

  if (missingDocuments.length > 0) {
    recommendations.push(`Prepare or upload these documents: ${missingDocuments.join(", ")}.`);
  }

  if (!insights.dbtReady) {
    recommendations.push(...insights.dbtWarnings);
  }

  if (eligible.length === 0) {
    recommendations.push("No fully eligible scholarship found yet. Review category, income, marks, and course details.");
  }

  if (recommendations.length === 0) {
    recommendations.push("You are ready for the next step: verify details on the official scholarship portal.");
  }

  return {
    totalScore,
    status,
    components: {
      profile: { points: profilePoints, max: 20, completion: insights.completion },
      eligibility: { points: eligibilityPoints, max: 30, averageMatch: eligibilityAverage },
      documents: {
        points: documentPoints,
        max: 20,
        matched: documentMatched,
        total: documentTotal,
        missingDocuments
      },
      dbt: { points: dbtPoints, max: 20, matched: dbtMatched, total: 3, warnings: insights.dbtWarnings },
      deadline: { points: deadlinePoints, max: 10 }
    },
    summary: {
      eligibleCount: eligible.length,
      checkCount: check.length,
      notEligibleCount: eligibilityResults.length - eligible.length - check.length,
      topScholarships: topCandidates.slice(0, 3).map((scholarship) => ({
        name: scholarship.name,
        provider: scholarship.provider,
        status: scholarship.eligibility.status,
        matchScore: scholarship.eligibility.matchScore
      }))
    },
    recommendations
  };
}
