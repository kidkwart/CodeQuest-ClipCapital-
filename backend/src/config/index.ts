import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_SSL: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  BCRYPT_SALT_ROUNDS: z
    .string()
    .transform(Number)
    .default("12"),
  PAYSTACK_SECRET_KEY: z.string().startsWith("sk_"),
  PAYSTACK_PUBLIC_KEY: z.string().startsWith("pk_"),
  PAYSTACK_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PORT: z.string().transform(Number).default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CORS_ORIGINS: z.string().default("http://localhost:8081"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
}
