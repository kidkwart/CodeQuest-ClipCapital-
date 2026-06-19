import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../auth/middleware.js";
import paystackRouter from "./paystack.js";

const router = Router();

// ─── Gateway Middleware ──────────────────────────────────
// Request logging
router.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  console.log(`[gateway] ${req.method} ${req.path}`);

  _res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[gateway] ${req.method} ${req.path} → ${_res.statusCode} (${duration}ms)`);
  });

  next();
});

// ─── Health / Status ────────────────────────────────────
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    gateway: "clipcapital-api-gateway",
    version: "1.0.0",
    uptime: process.uptime(),
  });
});

// ─── Protected Routes ───────────────────────────────────

// Profile routes
router.get("/profile", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Profile endpoint — to be implemented", userId: req.user!.sub });
});

router.patch("/profile", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Profile update — to be implemented" });
});

// Income routes
router.get("/income", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Income list — to be implemented", userId: req.user!.sub });
});

router.post("/income", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Create income entry — to be implemented" });
});

// Expense routes
router.get("/expenses", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Expense list — to be implemented" });
});

router.post("/expenses", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Create expense entry — to be implemented" });
});

// Susu routes
router.get("/susu/groups", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Susu groups list — to be implemented" });
});

router.post("/susu/groups", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Create susu group — to be implemented" });
});

router.post("/susu/contribute", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Susu contribution — to be implemented" });
});

// Loan routes
router.get("/loans", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Loan applications — to be implemented" });
});

router.post("/loans/apply", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Apply for loan — to be implemented" });
});

router.post("/loans/repay", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Repay loan — to be implemented" });
});

// Marketplace routes
router.get("/products", (req: Request, res: Response) => {
  res.json({ message: "Products list — to be implemented" });
});

router.post("/orders", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Create order — to be implemented" });
});

// Withdrawal routes
router.get("/withdrawals", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Withdrawal requests — to be implemented" });
});

router.post("/withdrawals", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Request withdrawal — to be implemented" });
});

// Notification routes
router.get("/notifications", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Notifications — to be implemented" });
});

router.patch("/notifications/:id/read", authenticate, (req: Request, res: Response) => {
  res.json({ message: "Mark notification read — to be implemented" });
});

// ─── Admin Routes ───────────────────────────────────────
router.get("/admin/stats", authenticate, authorize("admin"), (req: Request, res: Response) => {
  res.json({ message: "Admin dashboard stats — to be implemented" });
});

router.get("/admin/users", authenticate, authorize("admin"), (req: Request, res: Response) => {
  res.json({ message: "Admin user management — to be implemented" });
});

router.patch("/admin/loans/:id", authenticate, authorize("admin"), (req: Request, res: Response) => {
  res.json({ message: "Admin loan approval — to be implemented" });
});

router.patch("/admin/withdrawals/:id", authenticate, authorize("admin"), (req: Request, res: Response) => {
  res.json({ message: "Admin withdrawal processing — to be implemented" });
});

// ─── Paystack Integration ───────────────────────────────
router.use("/payments", paystackRouter);

export default router;
