import { Router, Request, Response } from "express";
import { signupSchema, loginSchema, refreshSchema } from "./validators.js";
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  refreshTokensPair,
  revokeRefreshToken,
} from "./tokens.js";
import { validateGhanaPhone, isValidGhanaPhone } from "../utils/phone.js";
import { authenticate } from "./middleware.js";
import { query, queryOne } from "../db.js";

const router = Router();

// ─── POST /auth/signup ──────────────────────────────────
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const body = signupSchema.parse(req.body);

    // Validate Ghana phone number
    if (!isValidGhanaPhone(body.phone_number)) {
      res.status(400).json({
        error: "Invalid phone number",
        message: "Please provide a valid Ghana mobile number (e.g. 024XXXXXXX)",
      });
      return;
    }

    const normalisedPhone = validateGhanaPhone(body.phone_number);

    // Check if user already exists
    const existingUser = await queryOne(
      `SELECT id FROM auth.users WHERE email = $1`,
      [body.email]
    );

    if (existingUser) {
      res.status(409).json({
        error: "Email already registered",
        message: "An account with this email already exists",
      });
      return;
    }

    // Hash password with BCrypt
    const passwordHash = await hashPassword(body.password);

    // Insert user into auth.users
    const userId = crypto.randomUUID();
    await query(
      `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW(), NOW())`,
      [userId, body.email, passwordHash]
    );

    // Create profile
    await query(
      `INSERT INTO profiles (id, display_name, business_name, phone_number, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [userId, body.display_name, body.business_name, normalisedPhone]
    );

    // Assign default user role
    await query(
      `INSERT INTO user_roles (user_id, role, created_at) VALUES ($1, $2, NOW())`,
      [userId, "user"]
    );

    const tokens = generateTokenPair({
      id: userId,
      email: body.email,
      role: "user",
    });

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: userId,
        email: body.email,
        display_name: body.display_name,
        phone_number: normalisedPhone,
        business_type: body.business_type,
      },
      ...tokens,
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    console.error("[auth/signup]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /auth/login ───────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    // Fetch user from DB
    const user = await queryOne<{
      id: string;
      email: string;
      encrypted_password: string;
    }>(
      `SELECT id, email, encrypted_password FROM auth.users WHERE email = $1`,
      [body.email]
    );

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(body.password, user.encrypted_password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Fetch user role
    const roleRow = await queryOne<{ role: string }>(
      `SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: roleRow?.role ?? "user",
    });

    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: roleRow?.role ?? "user" },
      ...tokens,
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    console.error("[auth/login]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /auth/refresh ─────────────────────────────────
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const body = refreshSchema.parse(req.body);
    const tokens = await refreshTokensPair(body.refreshToken);

    if (!tokens) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    res.json({ message: "Tokens refreshed", ...tokens });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ error: "Validation failed", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /auth/logout ──────────────────────────────────
router.post("/logout", (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    revokeRefreshToken(refreshToken);
  }
  res.json({ message: "Logged out successfully" });
});

// ─── GET /auth/me ───────────────────────────────────────
router.get("/me", authenticate, (req: Request, res: Response) => {
  res.json({
    user: {
      id: req.user!.sub,
      email: req.user!.email,
      role: req.user!.role,
    },
  });
});

export default router;
