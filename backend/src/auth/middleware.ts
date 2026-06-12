import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "./tokens.js";

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT Bearer authentication middleware.
 * Attaches `req.user` with { sub, email, role } on success.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
      return;
    }
    res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Role-based authorisation middleware.
 * Must be used AFTER `authenticate`.
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Required role: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}
