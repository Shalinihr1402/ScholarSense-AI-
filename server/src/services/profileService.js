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
  const str = (v) => v?.toString().trim() || "";
  return {
    // Personal
    fullName:      str(input.fullName),
    dateOfBirth:   str(input.dateOfBirth),
    gender:        str(input.gender),
    mobile:        str(input.mobile),
    email:         str(input.email),
    aadhaarMasked: str(input.aadhaarMasked),
    state:         str(input.state),
    district:      str(input.district),
    taluk:         str(input.taluk),
    village:       str(input.village),
    address:       str(input.address),
    pinCode:       str(input.pinCode),
    // Academic
    educationLevel:      str(input.educationLevel),
    course:              str(input.course),
    semester:            str(input.semester),
    admissionYear:       str(input.admissionYear),
    currentAcademicYear: str(input.currentAcademicYear),
    universityBoard:     str(input.universityBoard),
    marksPercentage:     input.marksPercentage === "" || input.marksPercentage == null ? "" : Number(input.marksPercentage),
    admissionType:       str(input.admissionType),
    // Institute
    collegeName:             str(input.collegeName),
    instituteCode:           str(input.instituteCode),
    instituteAddress:        str(input.instituteAddress),
    nodalOfficerName:        str(input.nodalOfficerName),
    nodalOfficerDesignation: str(input.nodalOfficerDesignation),
    nodalOfficerEmail:       str(input.nodalOfficerEmail),
    nodalOfficerContact:     str(input.nodalOfficerContact),
    // Eligibility
    category:         str(input.category),
    annualIncome:     input.annualIncome === "" || input.annualIncome == null ? "" : Number(input.annualIncome),
    disabilityStatus: input.disabilityStatus || "Unknown",
    minorityStatus:   input.minorityStatus   || "Unknown",
    hosteller:        input.hosteller        || "Unknown",
    orphanStatus:     input.orphanStatus     || "Unknown",
    firstGraduate:    input.firstGraduate    || "Unknown",
    // Bank & DBT
    bankName:          str(input.bankName),
    accountHolderName: str(input.accountHolderName),
    accountNumber:     str(input.accountNumber),
    ifscCode:          str(input.ifscCode),
    aadhaarBankLinked: input.aadhaarBankLinked || "Unknown",
    dbtEnabled:        input.dbtEnabled        || "Unknown",
    bankAccountActive: input.bankAccountActive || "Unknown",
    npciMapping:       input.npciMapping       || "Unknown",
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
