import { Router } from "express";
import {
  createMyNotification,
  listMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, listMyNotifications);
router.post("/", requireAuth, createMyNotification);
router.put("/read-all", requireAuth, markAllMyNotificationsRead);
router.put("/:id/read", requireAuth, markMyNotificationRead);

export default router;
