import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    originalName: { type: String, required: true, trim: true },
    documentType: {
      type: String,
      enum: [
        "Aadhaar Card",
        "Bank Passbook",
        "Income Certificate",
        "Caste Certificate",
        "Marksheet",
        "Bonafide Certificate",
        "Fee Receipt",
        "Other"
      ],
      default: "Other"
    },
    filePath: { type: String, required: true },
    fileHash: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    extractedFields: { type: mongoose.Schema.Types.Mixed, default: null },
    ocrConfidence: { type: Number, default: null },
    ocrVerified: { type: Boolean, default: null }
  },
  { timestamps: true }
);

// One user cannot upload the exact same file under the same document type twice
documentSchema.index({ userId: 1, fileHash: 1, documentType: 1 }, { unique: true });

const Document = mongoose.models.Document || mongoose.model("Document", documentSchema);

export default Document;
