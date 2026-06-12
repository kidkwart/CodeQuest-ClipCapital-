import { getEnv } from "../../config/index.js";

const PAYSTACK_API = "https://api.paystack.co";

// ─── Types ──────────────────────────────────────────────
export interface InitTransactionParams {
  amount: number;
  email: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export interface InitTransactionResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface MobileMoneyChargeParams {
  amount: number;
  phone: string;
  provider: string; // "mtn" | "vodafone" | "airteltigo"
  email: string;
  user_id: string;
}

export interface ChargeResult {
  reference: string;
  status: string;
  display_text: string;
}

export interface TransactionResult {
  status: string;
  amount: number;
  reference: string;
  gateway_response: string;
  paid_at: string | null;
  metadata: Record<string, any>;
}

// ─── API Client ─────────────────────────────────────────
async function paystackFetch(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  const env = getEnv();
  const url = `${PAYSTACK_API}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json();

  if (!body.status) {
    throw new Error(body.message || "Paystack API error");
  }

  return body.data;
}

// ─── Initialise Transaction ─────────────────────────────
export async function initialiseTransaction(
  params: InitTransactionParams,
): Promise<InitTransactionResult> {
  const data = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      amount: params.amount,
      email: params.email,
      callback_url: params.callback_url,
      metadata: params.metadata,
      channels: ["card", "bank", "mobile_money"],
    }),
  });

  return {
    authorization_url: data.authorization_url,
    access_code: data.access_code,
    reference: data.reference,
  };
}

// ─── Verify Transaction ────────────────────────────────
export async function verifyTransaction(
  reference: string,
): Promise<TransactionResult> {
  const data = await paystackFetch(`/transaction/verify/${reference}`);

  return {
    status: data.status,
    amount: data.amount,
    reference: data.reference,
    gateway_response: data.gateway_response,
    paid_at: data.paid_at,
    metadata: data.metadata || {},
  };
}

// ─── Mobile Money Charge (Ghana) ───────────────────────
export async function initialiseMobileMoneyCharge(
  params: MobileMoneyChargeParams,
): Promise<ChargeResult> {
  const data = await paystackFetch("/charge", {
    method: "POST",
    body: JSON.stringify({
      amount: params.amount,
      email: params.email,
      mobile_money: {
        phone: params.phone,
        provider: params.provider,
      },
      metadata: {
        user_id: params.user_id,
        payment_type: "momo",
      },
    }),
  });

  return {
    reference: data.reference,
    status: data.status,
    display_text: data.display_text || "Dial the prompt on your phone to complete payment",
  };
}

// ─── Verify Charge (for Mobile Money) ──────────────────
export async function verifyCharge(
  reference: string,
): Promise<ChargeResult> {
  const data = await paystackFetch(`/charge/${reference}`);

  return {
    reference: data.reference,
    status: data.status,
    display_text: data.display_text || "",
  };
}

// ─── List Transactions ─────────────────────────────────
export async function listTransactions(
  page: number = 1,
  perPage: number = 50,
): Promise<any[]> {
  const data = await paystackFetch(
    `/transaction?page=${page}&perPage=${perPage}&status=success`,
  );
  return Array.isArray(data) ? data : [];
}
