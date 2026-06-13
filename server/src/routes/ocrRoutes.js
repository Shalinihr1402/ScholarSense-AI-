import { mkdirSync } from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import { analyzeOcrUpload } from "../controllers/ocrController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");

mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-z0-9_.-]/gi, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are supported for OCR analysis right now."));
      return;
    }
    cb(null, true);
  }
});

const router = Router();

router.post("/analyze", requireAuth, upload.single("screenshot"), analyzeOcrUpload);

export default router;
