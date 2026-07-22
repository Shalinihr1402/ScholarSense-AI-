import { Router } from "express";
import { sendWhatsAppNotification, whatsAppStatus, testWhatsApp } from "../controllers/whatsappController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/status", requireAuth, whatsAppStatus);
router.post("/send", requireAuth, sendWhatsAppNotification);
router.post("/test", requireAuth, testWhatsApp);

export default router;
