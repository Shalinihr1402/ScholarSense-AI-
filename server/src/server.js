import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import diagnosisRoutes from "./routes/diagnosisRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import readinessRoutes from "./routes/readinessRoutes.js";
import scholarshipRoutes from "./routes/scholarshipRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import { startScheduler } from "./jobs/scheduler.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/readiness", readinessRoutes);
app.use("/api/diagnosis", diagnosisRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/audit", auditRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "ScholarSense AI API",
    status: "running",
    message: "Day 1 backend foundation is ready."
  });
});

app.use(notFound);
app.use(errorHandler);

connectDatabase()
  .then((databaseConnected) => {
    app.listen(port, () => {
      console.log(`ScholarSense AI API running on port ${port}`);
      console.log(`Database connected: ${databaseConnected ? "yes" : "no"}`);
      startScheduler();
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
