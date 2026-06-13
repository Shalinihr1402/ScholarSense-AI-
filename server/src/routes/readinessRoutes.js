import { Router } from "express";
import { getMyReadiness } from "../controllers/readinessController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/me", requireAuth, getMyReadiness);

export default router;
