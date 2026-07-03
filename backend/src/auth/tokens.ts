import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { getEnv } from "../config/index.js";

// ─── Types ──────────────────────────────────────────────
export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface RefreshTokenRow {
  token_hash: string;
  user_id: string;
  expires_at: Date;
  revoked: boolean;
}

// In-memory store for refresh tokens (swap with Redis in prod)
const refreshTokens = new Map<string, RefreshTokenRow>();

// ─── BCrypt Helpers ─────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  const rounds = getEnv().BCRYPT_SALT_ROUNDS;
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ─── JWT Helpers ────────────────────────────────────────
function signToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any, algorithm: "HS256" });
}

export function verifyAccessToken(token: string): TokenPayload {
  const env = getEnv();
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  }) as TokenPayload;
}

// ─── Token Pair Generation ──────────────────────────────
export function generateTokenPair(user: {
  id: string;
  email: string;
  role: string;
}): TokenPair {
  const env = getEnv();

  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signToken(payload, env.JWT_SECRET, env.JWT_ACCESS_EXPIRY);

  const rawRefresh = randomBytes(40).toString("hex");
  const refreshToken = `${user.id}.${rawRefresh}`;

  refreshTokens.set(rawRefresh, {
    token_hash: rawRefresh,
    user_id: user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revoked: false,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_ACCESS_EXPIRY,
  };
}

// ─── Refresh Flow ───────────────────────────────────────
export function refreshTokensPair(
  refreshToken: string,
): TokenPair | null {
  const [, rawToken] = refreshToken.split(".");
  if (!rawToken) return null;

  const row = refreshTokens.get(rawToken);
  if (!row || row.revoked || row.expires_at < new Date()) {
    return null;
  }

  // Revoke the old one (rotate)
  row.revoked = true;

  // TODO: look up user from DB — placeholder for now
  return generateTokenPair({
    id: row.user_id,
    email: "placeholder@clipcapital.com",
    role: "user",
  });
}

// ─── Revoke ─────────────────────────────────────────────
export function revokeRefreshToken(token: string): boolean {
  const [, rawToken] = token.split(".");
  if (!rawToken) return false;
  const row = refreshTokens.get(rawToken);
  if (!row) return false;
  row.revoked = true;
  return true;
}
