import {
  createNotification,
  getUserId,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead
} from "../services/notificationService.js";

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
