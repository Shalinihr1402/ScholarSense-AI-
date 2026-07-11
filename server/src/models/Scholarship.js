import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    state: { type: String, default: "All India", trim: true },
    categories: { type: [String], default: [] },
    incomeLimit: { type: Number, default: 0 },
    incomeLimitMin: { type: Number, default: 0 },   // for income-range schemes (e.g. 2.5L–10L)
    parentProfession: { type: String, default: "" }, // e.g. "Defence", "Construction Worker", "Farmer"
    minMarks: { type: Number, default: 0 },
    courseLevels: { type: [String], default: [] },
    gender: { type: String, default: "Any" },
    disabilityRequired: { type: Boolean, default: false },
    requiredDocuments: { type: [String], default: [] },
    amount: { type: String, default: "" },
    amountDetails: { type: String, default: "" },
    openDate: { type: String, default: "" },
    deadline: { type: String, default: "" },
    lastDateInstitute: { type: String, default: "" },
    applicationLink: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    ministry: { type: String, default: "" },
    religion: { type: [String], default: [] },
    status: { type: String, enum: ["Active", "Open", "Closing Soon", "Closed"], default: "Active" },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

const Scholarship = mongoose.models.Scholarship || mongoose.model("Scholarship", scholarshipSchema);

export default Scholarship;
