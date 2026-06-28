import { Router } from "express";
import {
  createMyNotification,
  listMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  refreshSmartNotifications,
  deleteMyNotification,
  deleteAllMyNotifications
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, listMyNotifications);
router.post("/refresh", requireAuth, refreshSmartNotifications);
router.post("/", requireAuth, createMyNotification);
router.put("/read-all", requireAuth, markAllMyNotificationsRead);
router.put("/:id/read", requireAuth, markMyNotificationRead);
router.delete("/all", requireAuth, deleteAllMyNotifications);
router.delete("/:id", requireAuth, deleteMyNotification);

export default router;
