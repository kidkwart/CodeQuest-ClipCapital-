import type { LoanApplication, MicroDeductionResult } from "./types.js";
import { calculateRemainingBalance } from "./interest.js";

// ─── Daily Micro-Deduction Service ──────────────────────
// Runs daily (via cron or scheduled job) to auto-deduct
// from active loan balances.

interface DeductionRecord {
  id: string;
  loan_id: string;
  user_id: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  deduction_date: Date;
  created_at: Date;
}

const deductionHistory = new Map<string, DeductionRecord[]>();

/**
 * Execute a daily micro-deduction on a single loan.
 *
 * Deducts the pre-calculated daily amount from the outstanding balance.
 * If the remaining balance is less than a full day's deduction,
 * only the remaining balance is deducted (final payment).
 */
export function executeDailyDeduction(loan: LoanApplication): MicroDeductionResult {
  if (loan.status !== "approved") {
    throw new Error(`Cannot deduct from loan in status: ${loan.status}`);
  }

  if (loan.balance <= 0) {
    throw new Error("Loan is already fully repaid");
  }

  const balanceBefore = loan.balance;
  const maxDeduction = Math.min(loan.daily_deduction, loan.balance);
  const actualDeduction = roundTo2dp(maxDeduction);

  // Update the loan balance
  loan.balance = roundTo2dp(loan.balance - actualDeduction);
  loan.updated_at = new Date();

  // Check if fully repaid
  const isFullyRepaid = loan.balance <= 0;
  if (isFullyRepaid) {
    loan.balance = 0;
    loan.status = "repaid";
  }

  const deductionDate = new Date();

  // Record the deduction
  const record: DeductionRecord = {
    id: crypto.randomUUID(),
    loan_id: loan.id,
    user_id: loan.user_id,
    amount: actualDeduction,
    balance_before: balanceBefore,
    balance_after: loan.balance,
    deduction_date: deductionDate,
    created_at: new Date(),
  };

  const existing = deductionHistory.get(loan.id) || [];
  existing.push(record);
  deductionHistory.set(loan.id, existing);

  return {
    loan_id: loan.id,
    amount_deducted: actualDeduction,
    remaining_balance: loan.balance,
    is_fully_repaid: isFullyRepaid,
    deduction_date: deductionDate,
  };
}

/**
 * Execute daily deductions for ALL active loans.
 * This is the function called by the daily cron job.
 */
export function executeBatchDeductions(
  activeLoans: LoanApplication[],
): MicroDeductionResult[] {
  const results: MicroDeductionResult[] = [];

  for (const loan of activeLoans) {
    try {
      const result = executeDailyDeduction(loan);
      results.push(result);
    } catch (err) {
      console.error(`[deductions] Failed for loan ${loan.id}:`, err);
    }
  }

  return results;
}

/**
 * Get deduction history for a loan.
 */
export function getDeductionHistory(loanId: string): DeductionRecord[] {
  return deductionHistory.get(loanId) || [];
}

/**
 * Get total deductions for a loan.
 */
export function getTotalDeducted(loanId: string): number {
  const records = deductionHistory.get(loanId) || [];
  return records.reduce((sum, r) => sum + r.amount, 0);
}

/**
 * Calculate days remaining until full repayment.
 */
export function getDaysRemaining(loan: LoanApplication): number {
  if (loan.balance <= 0) return 0;
  return Math.ceil(loan.balance / loan.daily_deduction);
}

// ─── Helpers ────────────────────────────────────────────
function roundTo2dp(n: number): number {
  return Math.round(n * 100) / 100;
}
