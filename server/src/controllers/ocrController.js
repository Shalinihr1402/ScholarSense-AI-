import { unlink } from "fs/promises";
import { analyzeUploadedImage } from "../services/ocrAnalysisService.js";
import { createOcrNotifications, getUserId } from "../services/notificationService.js";

export async function analyzeOcrUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file for OCR analysis." });
    }

    let result;
    try {
      result = await analyzeUploadedImage(req.file);
    } catch (ocrErr) {
      console.error("[OCR] analyzeUploadedImage failed:", ocrErr.message);
      return res.status(500).json({ message: `OCR failed: ${ocrErr.message}` });
    }

    // Notifications are optional — don't let them fail the response
    createOcrNotifications(req.user, result).catch(e => console.error("[OCR] notification error:", e.message));

    return res.json({ result });
  } catch (error) {
    next(error);
  } finally {
    if (req.file?.path) {
      await unlink(req.file.path).catch(() => {});
    }
  }
}
