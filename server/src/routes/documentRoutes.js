import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/authMiddleware.js";
import { deleteDocument, getRiskReport, listMyDocuments, uploadDocument, getDocumentKit, downloadBundle } from "../controllers/documentController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, "../../uploads/documents"),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, and PDF files are allowed."));
  }
});

const router = Router();

router.get("/mine", requireAuth, listMyDocuments);
router.get("/risk-report", requireAuth, getRiskReport);
router.get("/kit/:scholarshipId", requireAuth, getDocumentKit);
router.get("/bundle/:scholarshipId", requireAuth, downloadBundle);
router.post("/upload", requireAuth, upload.single("document"), uploadDocument);
router.delete("/:id", requireAuth, deleteDocument);

export default router;
