import { unlink } from "fs/promises";
import { analyzeUploadedImage } from "../services/ocrAnalysisService.js";
import { createOcrNotifications, getUserId } from "../services/notificationService.js";

export async function analyzeOcrUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file for OCR analysis." });
    }

    const result = await analyzeUploadedImage(req.file);
    await createOcrNotifications(req.user, result);
    return res.json({ result });
  } catch (error) {
    next(error);
  } finally {
    if (req.file?.path) {
      await unlink(req.file.path).catch(() => {});
    }
  }
}
