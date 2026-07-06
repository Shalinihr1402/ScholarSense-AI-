import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { getMyProfile, saveMyProfile, uploadUdidCard } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const udidStorage = multer.diskStorage({
  destination: path.resolve(__dirname, "../../uploads/udid"),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `udid-${unique}${path.extname(file.originalname)}`);
  }
});

const udidUpload = multer({
  storage: udidStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, and PDF files are allowed."));
  }
});

const router = Router();

router.get("/me", requireAuth, getMyProfile);
router.post("/me", requireAuth, saveMyProfile);
router.put("/me", requireAuth, saveMyProfile);
router.post("/me/udid-card", requireAuth, udidUpload.single("udidCard"), uploadUdidCard);

export default router;
