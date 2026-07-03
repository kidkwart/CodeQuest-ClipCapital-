import { Router, Request, Response } from "express";
import { authenticate } from "../auth/middleware.js";
import {
  initialiseTransaction,
  verifyTransaction,
  initialiseMobileMoneyCharge,
  verifyCharge,
  listTransactions,
} from "../services/paystack/index.js";
import { query, queryOne } from "../db.js";

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
    const result = await verifyTransaction(reference as string);

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

    // Use raw body for signature verification
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      res.status(400).json({ error: "Missing raw body for signature verification" });
      return;
    }

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

  try {
    // Determine the type of payment from metadata
    const paymentType = metadata?.type;
    const userId = metadata?.user_id;

    if (!userId) {
      console.error(`[paystack] No user_id in metadata for reference: ${reference}`);
      return;
    }

    switch (paymentType) {
      case "wallet_topup":
        // Credit user's wallet
        await query(
          `UPDATE profiles SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
          [amount / 100, userId]
        );
        break;

      case "loan_repayment":
        // Update loan repayment status
        const loanId = metadata?.loan_id;
        if (loanId) {
          await query(
            `UPDATE loan_repayments SET status = 'completed', paid_at = NOW() WHERE id = $1`,
            [metadata?.repayment_id]
          );
          // Update loan balance
          await query(
            `UPDATE loan_applications SET amount_repaid = amount_repaid + $1 WHERE id = $2`,
            [amount / 100, loanId]
          );
        }
        break;

      case "susu_contribution":
        // Update susu contribution status
        const contributionId = metadata?.contribution_id;
        if (contributionId) {
          await query(
            `UPDATE susu_contributions SET status = 'completed', paid_at = NOW() WHERE id = $1`,
            [contributionId]
          );
        }
        break;

      case "order_payment":
        // Update order status
        const orderId = metadata?.order_id;
        if (orderId) {
          await query(
            `UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = $1`,
            [orderId]
          );
        }
        break;

      default:
        console.log(`[paystack] Unknown payment type: ${paymentType}`);
    }

    // Send notification to user
    await query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
      [
        userId,
        "Payment Successful",
        `Your payment of GHS ${(amount / 100).toFixed(2)} was successful. Reference: ${reference}`,
        "payment"
      ]
    );
  } catch (err) {
    console.error(`[paystack] Error processing charge success:`, err);
  }
}

async function handleChargeFailed(data: any) {
  const { reference, gateway_response, metadata } = data;
  console.warn(`[paystack] Charge failed: ${reference} — ${gateway_response}`);

  try {
    const userId = metadata?.user_id;
    if (userId) {
      // Send failure notification
      await query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
        [
          userId,
          "Payment Failed",
          `Your payment failed: ${gateway_response}. Reference: ${reference}`,
          "payment"
        ]
      );
    }
  } catch (err) {
    console.error(`[paystack] Error processing charge failure:`, err);
  }
}

async function handleTransferSuccess(data: any) {
  const { reference, amount, destination, metadata } = data;
  console.log(`[paystack] Transfer success: ${reference} — GHS ${amount / 100} → ${destination}`);

  try {
    const withdrawalId = metadata?.withdrawal_id;
    if (withdrawalId) {
      // Update withdrawal request status to completed
      await query(
        `UPDATE withdrawal_requests SET status = 'completed', processed_at = NOW() WHERE id = $1`,
        [withdrawalId]
      );

      // Get user_id for notification
      const withdrawal = await queryOne(
        `SELECT user_id FROM withdrawal_requests WHERE id = $1`,
        [withdrawalId]
      );

      if (withdrawal) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
          [
            withdrawal.user_id,
            "Withdrawal Completed",
            `Your withdrawal of GHS ${(amount / 100).toFixed(2)} has been processed successfully.`,
            "withdrawal"
          ]
        );
      }
    }
  } catch (err) {
    console.error(`[paystack] Error processing transfer success:`, err);
  }
}

async function handleTransferFailed(data: any) {
  const { reference, gateway_response, metadata } = data;
  console.warn(`[paystack] Transfer failed: ${reference} — ${gateway_response}`);

  try {
    const withdrawalId = metadata?.withdrawal_id;
    if (withdrawalId) {
      // Update withdrawal request status to failed
      await query(
        `UPDATE withdrawal_requests SET status = 'failed', notes = $1 WHERE id = $2`,
        [gateway_response, withdrawalId]
      );

      // Get user_id for notification
      const withdrawal = await queryOne(
        `SELECT user_id FROM withdrawal_requests WHERE id = $1`,
        [withdrawalId]
      );

      if (withdrawal) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
          [
            withdrawal.user_id,
            "Withdrawal Failed",
            `Your withdrawal request failed: ${gateway_response}. Please try again or contact support.`,
            "withdrawal"
          ]
        );
      }
    }
  } catch (err) {
    console.error(`[paystack] Error processing transfer failure:`, err);
  }
}

export default router;
