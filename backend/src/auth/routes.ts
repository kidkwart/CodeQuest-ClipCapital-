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

    // Hash password with BCrypt
    const passwordHash = await hashPassword(body.password);

    // TODO: Insert user into database via Supabase or direct PG connection
    // const { data, error } = await supabase.auth.signUp({
    //   email: body.email,
    //   password: passwordHash,
    //   phone: normalisedPhone,
    //   data: {
    //     display_name: body.display_name,
    //     business_name: body.business_name,
    //     business_type: body.business_type,
    //     phone_number: normalisedPhone,
    //   },
    // });

    // Placeholder response
    const user = {
      id: crypto.randomUUID(),
      email: body.email,
      role: "user",
    };

    const tokens = generateTokenPair(user);

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
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

    // TODO: Fetch user from DB
    // const { data: user } = await supabase
    //   .from('profiles')
    //   .select('*')
    //   .eq('email', body.email)
    //   .single();

    // Placeholder — in production, look up user + verify password
    const user = {
      id: "placeholder-user-id",
      email: body.email,
      role: "user",
      password_hash: await hashPassword("placeholder"),
    };

    const valid = await verifyPassword(body.password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role },
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
router.post("/refresh", (req: Request, res: Response) => {
  try {
    const body = refreshSchema.parse(req.body);
    const tokens = refreshTokensPair(body.refreshToken);

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
