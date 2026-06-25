import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Section 1 — Personal
    fullName:       { type: String, trim: true },
    dateOfBirth:    { type: String, trim: true },
    gender:         { type: String, trim: true },
    mobile:         { type: String, trim: true },
    email:          { type: String, trim: true },
    aadhaarMasked:  { type: String, trim: true },
    state:          { type: String, trim: true },
    district:       { type: String, trim: true },
    taluk:          { type: String, trim: true },
    village:        { type: String, trim: true },
    address:        { type: String, trim: true },
    pinCode:        { type: String, trim: true },

    // Section 2 — Academic
    educationLevel:       { type: String, trim: true },
    course:               { type: String, trim: true },
    semester:             { type: String, trim: true },
    admissionYear:        { type: String, trim: true },
    currentAcademicYear:  { type: String, trim: true },
    universityBoard:      { type: String, trim: true },
    marksPercentage:      { type: Number, min: 0, max: 100 },
    admissionType:        { type: String, trim: true },

    // Section 3 — Institute
    collegeName:              { type: String, trim: true },
    instituteCode:            { type: String, trim: true },
    instituteAddress:         { type: String, trim: true },
    nodalOfficerName:         { type: String, trim: true },
    nodalOfficerDesignation:  { type: String, trim: true },
    nodalOfficerEmail:        { type: String, trim: true },
    nodalOfficerContact:      { type: String, trim: true },

    // Section 4 — Eligibility
    category:         { type: String, trim: true },
    annualIncome:     { type: Number, min: 0 },
    disabilityStatus: { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    minorityStatus:   { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    hosteller:        { type: String, enum: ["Unknown", "Hosteller", "Day Scholar"], default: "Unknown" },
    orphanStatus:     { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    firstGraduate:    { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },

    // Section 5 — Bank & DBT
    bankName:           { type: String, trim: true },
    accountHolderName:  { type: String, trim: true },
    accountNumber:      { type: String, trim: true },
    ifscCode:           { type: String, trim: true },
    aadhaarBankLinked:  { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    dbtEnabled:         { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    bankAccountActive:  { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    npciMapping:        { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },

    availableDocuments: { type: [String], default: [] },
    eligibilitySnapshot:  { type: mongoose.Schema.Types.Mixed, default: null },
    eligibilityUpdatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const StudentProfile =
  mongoose.models.StudentProfile || mongoose.model("StudentProfile", studentProfileSchema);

export default StudentProfile;
