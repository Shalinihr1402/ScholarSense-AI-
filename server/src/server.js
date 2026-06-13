import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./config/database.js";
import healthRoutes from "./routes/healthRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/health", healthRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "ScholarSense AI API",
    status: "running",
    message: "Day 1 backend foundation is ready."
  });
});

connectDatabase()
  .then((databaseConnected) => {
    app.listen(port, () => {
      console.log(`ScholarSense AI API running on port ${port}`);
      console.log(`Database connected: ${databaseConnected ? "yes" : "no"}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
