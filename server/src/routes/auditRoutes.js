import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getAuditTrail } from "../services/auditService.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id?.toString();
    const logs = await getAuditTrail(userId, 100);
    res.json({ logs });
  } catch (err) { next(err); }
});

export default router;
