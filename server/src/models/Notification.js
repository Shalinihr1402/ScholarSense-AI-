import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId:    { type: String, required: true, index: true },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    type:      { type: String, default: "system" },
    category:  { type: String, default: "general" }, // bank | document | scholarship | profile | deadline
    priority:  { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    actionUrl: { type: String, default: "" },
    dedupKey:  { type: String, default: "" }, // prevent duplicate alerts
    isRead:    { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
