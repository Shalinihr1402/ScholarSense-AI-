import { Router } from "express";
import {
  createScholarship,
  deleteScholarship,
  listPersonalizedScholarships,
  listScholarships,
  updateScholarship
} from "../controllers/scholarshipController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, listScholarships);
router.get("/personalized", requireAuth, listPersonalizedScholarships);
router.post("/", requireAuth, requireRole("admin"), createScholarship);
router.put("/:id", requireAuth, requireRole("admin"), updateScholarship);
router.delete("/:id", requireAuth, requireRole("admin"), deleteScholarship);

export default router;
