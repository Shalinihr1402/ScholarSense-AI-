import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "system" },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    isRead: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
