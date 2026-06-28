import {
  createNotification,
  getUserId,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  deleteAllNotifications
} from "../services/notificationService.js";
import { runSmartNotifications } from "../services/smartNotificationService.js";

function summarize(notifications) {
  return {
    total: notifications.length,
    unread: notifications.filter((notification) => !notification.isRead).length,
    highPriority: notifications.filter((notification) => ["high", "critical"].includes(notification.priority)).length
  };
}

export async function listMyNotifications(req, res, next) {
  try {
    const userId = getUserId(req.user);
    const notifications = await listNotificationsForUser(userId);
    res.json({ notifications, summary: summarize(notifications) });
  } catch (error) {
    next(error);
  }
}

export async function createMyNotification(req, res, next) {
  try {
    const userId = getUserId(req.user);
    const { title, message, type, priority } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    const notification = await createNotification(userId, { title, message, type, priority }, req.user);
    res.status(201).json({ notification });
  } catch (error) {
    next(error);
  }
}

export async function markMyNotificationRead(req, res, next) {
  try {
    const userId = getUserId(req.user);
    const notification = await markNotificationRead(userId, req.params.id);
    res.json({ notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllMyNotificationsRead(req, res, next) {
  try {
    const userId = getUserId(req.user);
    const notifications = await markAllNotificationsRead(userId);
    res.json({ notifications, summary: summarize(notifications) });
  } catch (error) {
    next(error);
  }
}

export async function deleteMyNotification(req, res, next) {
  try {
    const userId = getUserId(req.user);
    await deleteNotification(userId, req.params.id);
    res.json({ message: "Notification deleted." });
  } catch (error) { next(error); }
}

export async function deleteAllMyNotifications(req, res, next) {
  try {
    const userId = getUserId(req.user);
    await deleteAllNotifications(userId);
    res.json({ message: "All notifications deleted." });
  } catch (error) { next(error); }
}

export async function refreshSmartNotifications(req, res, next) {
  try {
    const created = await runSmartNotifications(req.user);
    const userId = getUserId(req.user);
    const notifications = await listNotificationsForUser(userId);
    res.json({ created: created.filter(Boolean).length, notifications, summary: summarize(notifications) });
  } catch (error) {
    next(error);
  }
}
