import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getEnv } from "./config/index.js";
import authRoutes from "./auth/routes.js";
import gatewayRouter from "./gateway/index.js";

const app = express();
const env = getEnv();

// ─── Security Middleware ────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body Parsing ───────────────────────────────────────
// Preserve raw body for webhook signature verification
app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ──────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please try again later" },
});

// ─── Routes ─────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1", gatewayRouter);

// ─── Health Check ───────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "clipcapital-backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Error Handler ──────────────────────────────────────
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[unhandled]", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

// ─── Start Server ───────────────────────────────────────
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`[clipcapital-backend] listening on :${PORT} (${env.NODE_ENV})`);
});

export default app;
