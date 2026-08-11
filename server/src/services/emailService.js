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

export function renderNotificationEmail({ title, message, priority, category, actionUrl }) {
  const colorMap = { critical: "#dc2626", high: "#d97706", medium: "#2563eb", low: "#16a34a" };
  const color = colorMap[priority] || "#2563eb";
  const badge = (priority || "medium").toUpperCase();
  const appUrl = process.env.APP_URL || "http://localhost:5173";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1e3a8a,#0891b2);padding:28px 32px;">
    <p style="margin:0;color:rgba(255,255,255,.7);font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">ScholarSense AI · Smart Notification</p>
    <h1 style="margin:8px 0 0;color:white;font-size:22px;font-weight:900;line-height:1.3;">${title}</h1>
  </td></tr>
  <!-- Priority badge -->
  <tr><td style="padding:0 32px;">
    <div style="display:inline-block;background:${color};color:white;font-size:11px;font-weight:800;padding:5px 14px;border-radius:0 0 10px 10px;letter-spacing:.08em;">${badge} PRIORITY · ${(category || "general").toUpperCase()}</div>
  </td></tr>
  <!-- Message -->
  <tr><td style="padding:24px 32px 8px;">
    <p style="margin:0;font-size:15px;color:#334155;line-height:1.8;">${message}</p>
  </td></tr>
  <!-- CTA -->
  ${actionUrl ? `<tr><td style="padding:16px 32px 28px;">
    <a href="${appUrl}${actionUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#0891b2);color:white;text-decoration:none;font-size:14px;font-weight:800;padding:12px 28px;border-radius:10px;">Take Action →</a>
  </td></tr>` : ""}
  <!-- Safety footer -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 32px;">
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
      🔒 <strong>Safety:</strong> ScholarSense AI will never ask for your OTP, Aadhaar number, or password.<br>
      This alert was sent because your profile matched an eligibility condition. <a href="${appUrl}/notifications" style="color:#2563eb;">Manage alerts</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return {
    subject: `[ScholarSense AI] ${title}`,
    html,
    text: `${title}\n\n${message}\n\nOpen ScholarSense AI: ${appUrl}${actionUrl || ""}\n\nSafety: Do not share OTP or Aadhaar with anyone.`
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
      text: rendered.text,
      html: rendered.html
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

export async function sendAdminAlert({ subject, html }) {
  if (!isEmailConfigured()) return;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"ScholarSense AI Monitor" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject,
      html
    });
    console.log(`[EmailService] Admin alert sent to ${adminEmail}`);
  } catch (err) {
    console.error("[EmailService] Admin alert failed:", err.message);
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

export async function sendPasswordResetEmail({ user, resetUrl }) {
  const email = user.email;
  const subject = "[ScholarSense AI] Password Reset Request";
  
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;padding:32px;">
<div style="max-width:560px;margin:0 auto;background:white;padding:32px;border-radius:16px;">
  <h2 style="margin-top:0;">Reset Your Password</h2>
  <p>Hello ${user.name},</p>
  <p>We received a request to reset your ScholarSense AI password.</p>
  <p>Click the button below to choose a new password. This link will expire in 1 hour.</p>
  <div style="margin:32px 0;">
    <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;">Reset Password</a>
  </div>
  <p>If you didn't request a password reset, you can safely ignore this email.</p>
</div>
</body></html>`;

  const text = `Reset Your Password\n\nHello ${user.name},\n\nWe received a request to reset your ScholarSense AI password. Open this link to choose a new password: ${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.`;

  if (!isEmailConfigured()) {
    return createEmailLog({
      userId: user.id || user._id?.toString(),
      toEmail: email,
      subject,
      status: "skipped",
      reason: "EMAIL_USER or EMAIL_PASS is not configured.",
      notificationTitle: "Password Reset Request"
    });
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"ScholarSense AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html
    });

    return createEmailLog({
      userId: user.id || user._id?.toString(),
      toEmail: email,
      subject,
      status: "sent",
      reason: "",
      notificationTitle: "Password Reset Request"
    });
  } catch (error) {
    return createEmailLog({
      userId: user.id || user._id?.toString(),
      toEmail: email,
      subject,
      status: "failed",
      reason: error.message,
      notificationTitle: "Password Reset Request"
    });
  }
}
