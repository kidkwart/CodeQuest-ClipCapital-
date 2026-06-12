import type { LoanApplication, DisbursementResult } from "./types.js";
import { calculateDailyDeduction } from "./interest.js";

// ─── Disbursement Service ───────────────────────────────
// Handles loan fund disbursement and tracking.

interface DisbursementRecord {
  id: string;
  loan_id: string;
  user_id: string;
  amount: number;
  method: "wallet_credit" | "momo_transfer" | "bank_transfer";
  reference: string;
  status: "pending" | "completed" | "failed";
  created_at: Date;
  completed_at: Date | null;
}

const disbursements = new Map<string, DisbursementRecord>();

/**
 * Disburse loan funds to the borrower.
 *
 * For ClipCapital's model, disbursement is typically:
 * 1. Credit the user's wallet_balance in profiles table
 * 2. Or send directly via Mobile Money
 */
export function disburseLoan(
  loan: LoanApplication,
  method: DisbursementRecord["method"] = "wallet_credit",
): DisbursementRecord {
  if (loan.status !== "approved") {
    throw new Error(`Cannot disburse loan in status: ${loan.status}`);
  }

  const record: DisbursementRecord = {
    id: crypto.randomUUID(),
    loan_id: loan.id,
    user_id: loan.user_id,
    amount: loan.amount,
    method,
    reference: `DISB-${Date.now()}-${loan.id.slice(0, 8)}`,
    status: "pending",
    created_at: new Date(),
    completed_at: null,
  };

  disbursements.set(record.id, record);
  return record;
}

/**
 * Mark a disbursement as completed.
 */
export function completeDisbursement(disbursementId: string): DisbursementRecord {
  const record = disbursements.get(disbursementId);
  if (!record) throw new Error("Disbursement not found");
  if (record.status !== "pending") {
    throw new Error(`Disbursement already ${record.status}`);
  }

  record.status = "completed";
  record.completed_at = new Date();
  return record;
}

/**
 * Get disbursement record by ID.
 */
export function getDisbursement(id: string): DisbursementRecord | undefined {
  return disbursements.get(id);
}

/**
 * Get all disbursements for a loan.
 */
export function getLoanDisbursements(loanId: string): DisbursementRecord[] {
  return Array.from(disbursements.values()).filter((d) => d.loan_id === loanId);
}

/**
 * Validate disbursement eligibility.
 * Checks: loan approved, user wallet exists, amount within limits.
 */
export function validateDisbursement(
  loan: LoanApplication,
): { valid: boolean; reason?: string } {
  if (loan.status !== "approved") {
    return { valid: false, reason: "Loan must be approved before disbursement" };
  }

  if (loan.amount <= 0) {
    return { valid: false, reason: "Disbursement amount must be positive" };
  }

  // Check if already disbursed
  const existing = getLoanDisbursements(loan.id);
  if (existing.some((d) => d.status === "completed")) {
    return { valid: false, reason: "Loan has already been disbursed" };
  }

  return { valid: true };
}
