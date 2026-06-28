import Notification from "../models/Notification.js";
import { sendNotificationEmail } from "./emailService.js";
import {
  createLocalNotification,
  listLocalNotifications,
  markAllLocalNotificationsRead,
  markLocalNotificationRead,
  updateLocalNotificationEmailStatus,
  deleteLocalNotification,
  deleteAllLocalNotifications
} from "./localNotificationStore.js";

export function getUserId(user) {
  return user.id || user._id?.toString();
}

// ── Deduplication check ───────────────────────────────────────────────────────
export async function isDuplicateNotification(userId, dedupKey, withinDays = 7) {
  if (!dedupKey) return false;
  const since = new Date(Date.now() - withinDays * 86400000);
  if (Notification.db?.readyState === 1) {
    const found = await Notification.findOne({ userId, dedupKey, createdAt: { $gte: since } }).lean();
    return Boolean(found);
  }
  // local store: check in memory
  const all = await listLocalNotifications(userId);
  return all.some(n => n.dedupKey === dedupKey && new Date(n.createdAt) >= since);
}

export async function createNotification(userId, payload, user = null) {
  const notification = {
    userId,
    title: payload.title,
    message: payload.message,
    type: payload.type || "system",
    category: payload.category || "general",
    priority: payload.priority || "medium",
    actionUrl: payload.actionUrl || "",
    dedupKey: payload.dedupKey || ""
  };

  if (Notification.db.readyState === 1) {
    const created = await Notification.create(notification);
    const safeCreated = created.toObject();
    if (user && ["high", "critical"].includes(safeCreated.priority)) {
      const log = await sendNotificationEmail({ user, notification: safeCreated });
      if (log.status === "sent") {
        await Notification.findByIdAndUpdate(created._id, { emailSent: true });
        safeCreated.emailSent = true;
      }
      safeCreated.emailStatus = log.status;
    }
    return safeCreated;
  }

  const created = await createLocalNotification(notification);
  if (user && ["high", "critical"].includes(created.priority)) {
    const log = await sendNotificationEmail({ user, notification: created });
    created.emailStatus = log.status;
    created.emailSent = log.status === "sent";
    await updateLocalNotificationEmailStatus(userId, created.id, {
      emailSent: created.emailSent,
      emailStatus: created.emailStatus
    });
  }
  return created;
}

export async function listNotificationsForUser(userId) {
  if (Notification.db.readyState === 1) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  return listLocalNotifications(userId);
}

export async function markNotificationRead(userId, id) {
  if (Notification.db.readyState === 1) {
    const notification = await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true }).lean();
    if (!notification) {
      const error = new Error("Notification not found.");
      error.status = 404;
      throw error;
    }
    return notification;
  }

  return markLocalNotificationRead(userId, id);
}

export async function markAllNotificationsRead(userId) {
  if (Notification.db.readyState === 1) {
    await Notification.updateMany({ userId }, { isRead: true });
    return Notification.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  return markAllLocalNotificationsRead(userId);
}

export async function createProfileNotifications(user, insights) {
  const userId = getUserId(user);
  const created = [];
  if (insights.completion < 80) {
    created.push(
      await createNotification(userId, {
        title: "Complete your scholarship profile",
        message: `Your profile is ${insights.completion}% complete. Missing fields can reduce eligibility accuracy.`,
        type: "profile",
        priority: "medium"
      }, user)
    );
  }

  if (!insights.dbtReady) {
    created.push(
      await createNotification(userId, {
        title: "DBT readiness needs checking",
        message: insights.dbtWarnings.join(" "),
        type: "dbt",
        priority: "high"
      }, user)
    );
  }

  return created;
}

// Readiness notifications removed — replaced by smart notification engine
export async function createReadinessNotifications() { return []; }

export async function deleteNotification(userId, id) {
  if (Notification.db?.readyState === 1) {
    const n = await Notification.findOneAndDelete({ _id: id, userId });
    if (!n) { const e = new Error("Notification not found."); e.status = 404; throw e; }
    return;
  }
  return deleteLocalNotification(userId, id);
}

export async function deleteAllNotifications(userId) {
  if (Notification.db?.readyState === 1) {
    await Notification.deleteMany({ userId });
    return;
  }
  return deleteAllLocalNotifications(userId);
}

export async function createDiagnosisNotifications(user, diagnosis) {
  const userId = getUserId(user);
  if (["Critical", "High"].includes(diagnosis.riskLevel)) {
    return [
      await createNotification(userId, {
        title: `${diagnosis.riskLevel} scholarship risk detected`,
        message: `${diagnosis.issueCount} issue(s) found. Open Failure Diagnosis for your action plan.`,
        type: "diagnosis",
        priority: diagnosis.riskLevel === "Critical" ? "critical" : "high"
      }, user)
    ];
  }
  return [];
}

export async function createOcrNotifications(user, result) {
  const userId = getUserId(user);
  if (result.uploadDecision?.risk === "High") {
    return [
      await createNotification(userId, {
        title: "Re-upload recommended",
        message: `${result.documentType} quality score is ${result.qualityScore}/100. Upload a clearer image.`,
        type: "ocr",
        priority: "high"
      }, user)
    ];
  }

  if (result.statusFindings?.length > 0) {
    return [
      await createNotification(userId, {
        title: "Scholarship status issue detected",
        message: result.statusFindings.map((finding) => finding.issue).join(" "),
        type: "ocr",
        priority: "high"
      }, user)
    ];
  }

  return [];
}
