import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    fullName: { type: String, trim: true },
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    collegeName: { type: String, trim: true },
    course: { type: String, trim: true },
    semester: { type: String, trim: true },
    category: { type: String, trim: true },
    annualIncome: { type: Number, min: 0 },
    marksPercentage: { type: Number, min: 0, max: 100 },
    gender: { type: String, trim: true },
    disabilityStatus: { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    aadhaarBankLinked: { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    dbtEnabled: { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    bankAccountActive: { type: String, enum: ["Unknown", "Yes", "No"], default: "Unknown" },
    availableDocuments: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

const StudentProfile =
  mongoose.models.StudentProfile || mongoose.model("StudentProfile", studentProfileSchema);

export default StudentProfile;
