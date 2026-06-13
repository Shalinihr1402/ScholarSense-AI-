const requiredFields = [
  "fullName",
  "state",
  "district",
  "collegeName",
  "course",
  "semester",
  "category",
  "annualIncome",
  "marksPercentage",
  "gender",
  "aadhaarBankLinked",
  "dbtEnabled",
  "bankAccountActive"
];

const dbtFields = ["aadhaarBankLinked", "dbtEnabled", "bankAccountActive"];

export function normalizeProfile(input = {}) {
  return {
    fullName: input.fullName?.trim() || "",
    state: input.state?.trim() || "",
    district: input.district?.trim() || "",
    collegeName: input.collegeName?.trim() || "",
    course: input.course?.trim() || "",
    semester: input.semester?.trim() || "",
    category: input.category?.trim() || "",
    annualIncome: input.annualIncome === "" || input.annualIncome == null ? "" : Number(input.annualIncome),
    marksPercentage:
      input.marksPercentage === "" || input.marksPercentage == null ? "" : Number(input.marksPercentage),
    gender: input.gender?.trim() || "",
    disabilityStatus: input.disabilityStatus || "Unknown",
    aadhaarBankLinked: input.aadhaarBankLinked || "Unknown",
    dbtEnabled: input.dbtEnabled || "Unknown",
    bankAccountActive: input.bankAccountActive || "Unknown",
    availableDocuments: Array.isArray(input.availableDocuments) ? input.availableDocuments : []
  };
}

export function getProfileInsights(profile = {}) {
  const missingFields = requiredFields.filter((field) => {
    const value = profile[field];
    return value === undefined || value === null || value === "" || value === "Unknown";
  });

  const completedCount = requiredFields.length - missingFields.length;
  const completion = Math.round((completedCount / requiredFields.length) * 100);

  const dbtWarnings = dbtFields
    .filter((field) => profile[field] !== "Yes")
    .map((field) => {
      const labels = {
        aadhaarBankLinked: "Aadhaar-bank linking is not confirmed.",
        dbtEnabled: "DBT enabled status is not confirmed.",
        bankAccountActive: "Bank account active status is not confirmed."
      };

      return labels[field];
    });

  return {
    completion,
    missingFields,
    dbtReady: dbtWarnings.length === 0,
    dbtWarnings,
    documentCount: profile.availableDocuments?.length || 0
  };
}
