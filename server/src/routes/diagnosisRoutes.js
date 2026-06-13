import { Router } from "express";
import { getMyDiagnosis } from "../controllers/diagnosisController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/me", requireAuth, getMyDiagnosis);

export default router;
