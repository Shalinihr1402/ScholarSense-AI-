import express from "express";
import { chat } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Quick test — open in browser: http://localhost:5000/api/chat/test
router.get("/test", (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  res.json({
    keySet: Boolean(key && key !== "your_gemini_api_key"),
    keyPreview: key ? key.slice(0, 8) + "..." : "NOT SET",
    nodeVersion: process.version
  });
});

router.post("/", requireAuth, chat);

export default router;
