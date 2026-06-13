import nodemailer from "nodemailer";
import { createEmailLog, listEmailLogs } from "./localEmailLogStore.js";

export function isEmailConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export function renderNotificationEmail({ title, message, priority, type }) {
  return {
    subject: `[ScholarSense AI] ${title}`,
    text: [
      "ScholarSense AI Alert",
      "",
      `Priority: ${priority}`,
      `Type: ${type}`,
      "",
      message,
      "",
      "Open ScholarSense AI to view the full action plan.",
      "",
      "Safety note: Do not share OTP, passwords, or full Aadhaar details with anyone."
    ].join("\n")
  };
}

export async function sendNotificationEmail({ user, notification }) {
  const email = user.email;
  const rendered = renderNotificationEmail(notification);

  if (!isEmailConfigured()) {
    return createEmailLog({
      userId: user.id || user._id?.toString(),
      toEmail: email,
      subject: rendered.subject,
      status: "skipped",
      reason: "EMAIL_USER or EMAIL_PASS is not configured.",
      notificationTitle: notification.title
    });
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"ScholarSense AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: rendered.subject,
      text: rendered.text
    });

    return createEmailLog({
      userId: user.id || user._id?.toString(),
      toEmail: email,
      subject: rendered.subject,
      status: "sent",
      reason: "",
      notificationTitle: notification.title
    });
  } catch (error) {
    return createEmailLog({
      userId: user.id || user._id?.toString(),
      toEmail: email,
      subject: rendered.subject,
      status: "failed",
      reason: error.message,
      notificationTitle: notification.title
    });
  }
}

export async function getEmailStatus(userId) {
  const logs = await listEmailLogs(userId);
  return {
    configured: isEmailConfigured(),
    logs,
    summary: {
      total: logs.length,
      sent: logs.filter((log) => log.status === "sent").length,
      skipped: logs.filter((log) => log.status === "skipped").length,
      failed: logs.filter((log) => log.status === "failed").length
    }
  };
}
