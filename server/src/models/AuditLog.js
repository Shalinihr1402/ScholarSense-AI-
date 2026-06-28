import mongoose from "mongoose";

// Append-only audit log — never update or delete entries
const auditLogSchema = new mongoose.Schema(
  {
    userId:   { type: String, required: true, index: true },
    category: { type: String, enum: ["profile", "bank", "document", "scholarship", "auth", "system"], required: true },
    action:   { type: String, required: true },  // e.g. "bank_aadhaar_linked", "document_uploaded"
    title:    { type: String, required: true },  // Human-readable title
    detail:   { type: String, default: "" },     // Extra context
    meta:     { type: mongoose.Schema.Types.Mixed, default: {} }, // Any extra data (masked)
  },
  {
    timestamps: true,
    // Prevent any updates — audit logs are immutable
    versionKey: false
  }
);

// Prevent accidental updates
auditLogSchema.pre("findOneAndUpdate", function () {
  throw new Error("AuditLog entries are immutable.");
});
auditLogSchema.pre("updateOne", function () {
  throw new Error("AuditLog entries are immutable.");
});

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
