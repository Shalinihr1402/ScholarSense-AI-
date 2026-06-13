import { Router } from "express";
import { getMyEmailStatus } from "../controllers/emailController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/status", requireAuth, getMyEmailStatus);

export default router;
