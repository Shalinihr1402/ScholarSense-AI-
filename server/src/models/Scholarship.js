import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    state: { type: String, default: "All India", trim: true },
    categories: { type: [String], default: [] },
    incomeLimit: { type: Number, default: 0 },
    minMarks: { type: Number, default: 0 },
    courseLevels: { type: [String], default: [] },
    gender: { type: String, default: "Any" },
    disabilityRequired: { type: Boolean, default: false },
    requiredDocuments: { type: [String], default: [] },
    deadline: { type: String, default: "" },
    applicationLink: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    status: { type: String, enum: ["Open", "Closing Soon", "Closed"], default: "Open" },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

const Scholarship = mongoose.models.Scholarship || mongoose.model("Scholarship", scholarshipSchema);

export default Scholarship;
