import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, "../../data/notifications.local.json");

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, "[]", "utf8");
  }
}

async function readNotifications() {
  await ensureStore();
  return JSON.parse(await readFile(storePath, "utf8"));
}

async function writeNotifications(notifications) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(notifications, null, 2), "utf8");
}

export async function listLocalNotifications(userId) {
  const notifications = await readNotifications();
  return notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function createLocalNotification(payload) {
  const notifications = await readNotifications();
  const now = new Date().toISOString();
  const notification = {
    id: randomUUID(),
    isRead: false,
    emailSent: false,
    priority: "medium",
    type: "system",
    ...payload,
    createdAt: now,
    updatedAt: now
  };
  notifications.push(notification);
  await writeNotifications(notifications);
  return notification;
}

export async function markLocalNotificationRead(userId, id) {
  const notifications = await readNotifications();
  const index = notifications.findIndex((notification) => notification.id === id && notification.userId === userId);
  if (index < 0) {
    const error = new Error("Notification not found.");
    error.status = 404;
    throw error;
  }
  notifications[index].isRead = true;
  notifications[index].updatedAt = new Date().toISOString();
  await writeNotifications(notifications);
  return notifications[index];
}

export async function markAllLocalNotificationsRead(userId) {
  const notifications = await readNotifications();
  const now = new Date().toISOString();
  const updated = notifications.map((notification) =>
    notification.userId === userId ? { ...notification, isRead: true, updatedAt: now } : notification
  );
  await writeNotifications(updated);
  return updated.filter((notification) => notification.userId === userId);
}

export async function updateLocalNotificationEmailStatus(userId, id, { emailSent, emailStatus }) {
  const notifications = await readNotifications();
  const index = notifications.findIndex((notification) => notification.id === id && notification.userId === userId);
  if (index < 0) return null;
  notifications[index].emailSent = emailSent;
  notifications[index].emailStatus = emailStatus;
  notifications[index].updatedAt = new Date().toISOString();
  await writeNotifications(notifications);
  return notifications[index];
}

export async function deleteLocalNotification(userId, id) {
  const notifications = await readNotifications();
  const index = notifications.findIndex(n => n.id === id && n.userId === userId);
  if (index < 0) { const e = new Error("Notification not found."); e.status = 404; throw e; }
  notifications.splice(index, 1);
  await writeNotifications(notifications);
}

export async function deleteAllLocalNotifications(userId) {
  const notifications = await readNotifications();
  await writeNotifications(notifications.filter(n => n.userId !== userId));
}
