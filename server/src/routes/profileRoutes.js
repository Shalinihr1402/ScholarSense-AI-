import { Router } from "express";
import { getMyProfile, saveMyProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/me", requireAuth, getMyProfile);
router.post("/me", requireAuth, saveMyProfile);
router.put("/me", requireAuth, saveMyProfile);

export default router;
