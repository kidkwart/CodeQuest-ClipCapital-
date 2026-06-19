import { z } from "zod";

// ─── Signup Schema ──────────────────────────────────────
export const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    phone_number: z.string().min(10, "Invalid Ghana phone number"),
    display_name: z.string().min(2).max(100),
    business_name: z.string().max(100).optional().default(""),
    business_type: z
      .enum(["Barber", "Hair Stylist", "Tailor", "Other"])
      .optional()
      .default("Barber"),
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;

// ─── Login Schema ───────────────────────────────────────
export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Refresh Schema ─────────────────────────────────────
export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  })
  .strict();

// ─── Phone Verify Schema ────────────────────────────────
export const phoneVerifySchema = z
  .object({
    phone_number: z.string().min(10),
    code: z.string().length(6, "OTP must be 6 digits"),
  })
  .strict();
