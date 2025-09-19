import express from "express";
import cors from "cors";
import * as helmetNs from "helmet";
import dotenv from "dotenv";

// logger removed
import { errorHandler } from "./middleware/error-handler.js";
import { healthRoutes } from "./routes/health.js";
import { githubRoutes } from "./routes/github.js";
import { leaderboardRoutes } from "./routes/leaderboard.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Resolve helmet default export consistently across ESM/CJS/TS environments
const helmetFn: any = (helmetNs as any)?.default ?? (helmetNs as any);

// Middleware
app.use(helmetFn());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  console.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// Routes
app.use("/health", healthRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.info(`Server running on port ${PORT}`);
    console.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}
