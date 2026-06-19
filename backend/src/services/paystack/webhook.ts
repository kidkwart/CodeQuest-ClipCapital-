import { createHmac } from "node:crypto";
import { getEnv } from "../../config/index.js";

/**
 * Verify Paystack webhook signature using HMAC-SHA512.
 *
 * Paystack sends the `X-Paystack-Signature` header which is the
 * HMAC-SHA512 digest of the raw request body, signed with the
 * webhook secret key.
 *
 * @param rawBody  The raw JSON string of the request body
 * @param signature  The value from the X-Paystack-Signature header
 * @returns true if the signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const env = getEnv();
  const secret = env.PAYSTACK_WEBHOOK_SECRET;

  const hmac = createHmac("sha512", secret);
  hmac.update(rawBody);
  const expected = hmac.digest("hex");

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(expected, signature);
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Parse and validate a Paystack webhook event.
 * Returns the typed event or null if invalid.
 */
export interface PaystackEvent {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    status: string;
    gateway_response: string;
    paid_at: string | null;
    created_at: string;
    metadata: Record<string, any>;
    customer?: {
      id: number;
      email: string;
      phone: string | null;
    };
  };
}

export function parseWebhookEvent(body: unknown): PaystackEvent | null {
  if (!body || typeof body !== "object") return null;
  const event = body as Record<string, any>;

  if (typeof event.event !== "string") return null;
  if (!event.data || typeof event.data !== "object") return null;

  return event as PaystackEvent;
}
