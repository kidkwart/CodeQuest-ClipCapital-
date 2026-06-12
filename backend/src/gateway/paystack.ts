import { Router, Request, Response } from "express";
import { authenticate } from "../auth/middleware.js";
import {
  initialiseTransaction,
  verifyTransaction,
  initialiseMobileMoneyCharge,
  verifyCharge,
  listTransactions,
} from "../services/paystack/index.js";

const router = Router();

// ─── POST /payments/initialize ──────────────────────────
// Initialise a Paystack transaction (card / bank / mobile money)
router.post("/initialize", authenticate, async (req: Request, res: Response) => {
  try {
    const { amount, email, metadata } = req.body;

    if (!amount || !email) {
      res.status(400).json({ error: "amount and email are required" });
      return;
    }

    const result = await initialiseTransaction({
      amount: Number(amount) * 100, // Paystack expects kobo/pesewas
      email,
      metadata: {
        ...metadata,
        user_id: req.user!.sub,
      },
    });

    res.json({
      message: "Transaction initialised",
      authorization_url: result.authorization_url,
      access_code: result.access_code,
      reference: result.reference,
    });
  } catch (err: any) {
    console.error("[paystack/init]", err);
    res.status(500).json({ error: err.message || "Failed to initialise transaction" });
  }
});

// ─── POST /payments/charge-mobile-money ─────────────────
// Paystack Mobile Money charge (Ghana MTN, Vodafone, AirtelTigo)
router.post("/charge-mobile-money", authenticate, async (req: Request, res: Response) => {
  try {
    const { amount, phone, provider, email } = req.body;

    if (!amount || !phone || !provider) {
      res.status(400).json({ error: "amount, phone, and provider are required" });
      return;
    }

    const result = await initialiseMobileMoneyCharge({
      amount: Number(amount) * 100,
      phone,
      provider, // "mtn", "vodafone", "airteltigo"
      email: email || req.user!.email,
      user_id: req.user!.sub,
    });

    res.json({
      message: "Mobile Money charge initiated",
      reference: result.reference,
      status: result.status,
      display_text: result.display_text,
    });
  } catch (err: any) {
    console.error("[paystack/momo-charge]", err);
    res.status(500).json({ error: err.message || "Failed to initiate charge" });
  }
});

// ─── GET /payments/verify/:reference ────────────────────
router.get("/verify/:reference", authenticate, async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const result = await verifyTransaction(reference);

    res.json({
      status: result.status,
      amount: result.amount,
      reference: result.reference,
      gateway_response: result.gateway_response,
      paid_at: result.paid_at,
      metadata: result.metadata,
    });
  } catch (err: any) {
    console.error("[paystack/verify]", err);
    res.status(500).json({ error: err.message || "Verification failed" });
  }
});

// ─── POST /payments/webhook ─────────────────────────────
// Paystack webhook endpoint — HMAC-SHA512 verification
// This route must NOT use authenticate middleware
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string;

    if (!signature) {
      res.status(400).json({ error: "Missing webhook signature" });
      return;
    }

    const rawBody = JSON.stringify(req.body);

    // Verify HMAC-SHA512 signature
    const crypto = await import("node:crypto");
    const { getEnv } = await import("../config/index.js");
    const secret = getEnv().PAYSTACK_WEBHOOK_SECRET;

    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
      console.warn("[paystack/webhook] Invalid signature — possible tampering");
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    const event = req.body;
    console.log(`[paystack/webhook] Event: ${event.event} — Reference: ${event.data?.reference}`);

    // Process event types
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data);
        break;
      case "charge.failed":
        await handleChargeFailed(event.data);
        break;
      case "transfer.success":
        await handleTransferSuccess(event.data);
        break;
      case "transfer.failed":
        await handleTransferFailed(event.data);
        break;
      default:
        console.log(`[paystack/webhook] Unhandled event type: ${event.event}`);
    }

    res.sendStatus(200);
  } catch (err: any) {
    console.error("[paystack/webhook]", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ─── GET /payments/transactions ─────────────────────────
router.get("/transactions", authenticate, async (_req: Request, res: Response) => {
  try {
    const result = await listTransactions();
    res.json({ transactions: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list transactions" });
  }
});

// ─── Webhook Event Handlers ─────────────────────────────

async function handleChargeSuccess(data: any) {
  const { reference, amount, metadata } = data;
  console.log(`[paystack] Charge success: ${reference} — GHS ${amount / 100}`);

  // TODO: Update order/contribution status in database
  // TODO: Trigger ClipScore recalculation
  // TODO: Send notification to user
}

async function handleChargeFailed(data: any) {
  const { reference, gateway_response } = data;
  console.warn(`[paystack] Charge failed: ${reference} — ${gateway_response}`);

  // TODO: Mark transaction as failed
  // TODO: Notify user of failure
}

async function handleTransferSuccess(data: any) {
  const { reference, amount, destination } = data;
  console.log(`[paystack] Transfer success: ${reference} — GHS ${amount / 100} → ${destination}`);

  // TODO: Update withdrawal request status to 'completed'
}

async function handleTransferFailed(data: any) {
  const { reference, gateway_response } = data;
  console.warn(`[paystack] Transfer failed: ${reference} — ${gateway_response}`);

  // TODO: Mark withdrawal as failed, notify admin
}

export default router;
