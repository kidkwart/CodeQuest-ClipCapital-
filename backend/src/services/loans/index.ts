import type { LoanApplicationInput, LoanApplication, DisbursementResult } from "./types.js";
import { calculateInterest, calculateDailyDeduction, calculateTotalPayable } from "./interest.js";

// ─── Default Configuration ──────────────────────────────
const DEFAULT_INTEREST_RATE = 10.0; // 10% flat (from system_settings)
const DEFAULT_TERM_MONTHS = 1;
const MIN_LOAN_AMOUNT = 50;
const MAX_LOAN_AMOUNT = 5000;
const MIN_CLIP_SCORE = 600;

// ─── In-Memory Store (swap with PG in prod) ─────────────
const loans = new Map<string, LoanApplication>();

// ─── Apply for Loan ─────────────────────────────────────
export function applyForLoan(input: LoanApplicationInput): LoanApplication {
  // Validate amount bounds
  if (input.amount < MIN_LOAN_AMOUNT || input.amount > MAX_LOAN_AMOUNT) {
    throw new Error(
      `Loan amount must be between GHS ${MIN_LOAN_AMOUNT} and GHS ${MAX_LOAN_AMOUNT}`,
    );
  }

  const rate = input.interest_rate ?? DEFAULT_INTEREST_RATE;
  const termMonths = input.term_months ?? DEFAULT_TERM_MONTHS;
  const totalPayable = calculateTotalPayable(input.amount, rate);

  const loan: LoanApplication = {
    id: crypto.randomUUID(),
    user_id: input.user_id,
    amount: input.amount,
    interest_rate: rate,
    total_payable: totalPayable,
    balance: totalPayable,
    status: "pending",
    term_months: termMonths,
    daily_deduction: calculateDailyDeduction(totalPayable, termMonths),
    created_at: new Date(),
    updated_at: new Date(),
  };

  loans.set(loan.id, loan);
  return loan;
}

// ─── Approve Loan (Admin) ───────────────────────────────
export function approveLoan(loanId: string): DisbursementResult {
  const loan = loans.get(loanId);
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "pending") throw new Error(`Cannot approve loan in status: ${loan.status}`);

  loan.status = "approved";
  loan.updated_at = new Date();

  const termDays = loan.term_months * 30;

  return {
    loan_id: loan.id,
    amount_disbursed: loan.amount,
    daily_deduction: loan.daily_deduction,
    total_payable: loan.total_payable,
    balance: loan.balance,
    term_days: termDays,
  };
}

// ─── Reject Loan (Admin) ────────────────────────────────
export function rejectLoan(loanId: string, _reason?: string): LoanApplication {
  const loan = loans.get(loanId);
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "pending") throw new Error(`Cannot reject loan in status: ${loan.status}`);

  loan.status = "rejected";
  loan.updated_at = new Date();
  return loan;
}

// ─── Get Loan by ID ─────────────────────────────────────
export function getLoan(loanId: string): LoanApplication | undefined {
  return loans.get(loanId);
}

// ─── Get Active Loans for User ──────────────────────────
export function getUserActiveLoans(userId: string): LoanApplication[] {
  return Array.from(loans.values()).filter(
    (l) => l.user_id === userId && (l.status === "approved" || l.status === "pending"),
  );
}

// ─── Get Loan Summary for User ──────────────────────────
export function getUserLoanSummary(userId: string): {
  total_active: number;
  total_outstanding: number;
  total_repaid: number;
} {
  const userLoans = Array.from(loans.values()).filter((l) => l.user_id === userId);

  return {
    total_active: userLoans.filter((l) => l.status === "approved").length,
    total_outstanding: userLoans
      .filter((l) => l.status === "approved")
      .reduce((sum, l) => sum + l.balance, 0),
    total_repaid: userLoans
      .filter((l) => l.status === "repaid")
      .reduce((sum, l) => sum + l.total_payable, 0),
  };
}

// ─── Eligibility Check ──────────────────────────────────
export function checkLoanEligibility(
  userId: string,
  clipScore: number,
): { eligible: boolean; reason?: string } {
  if (clipScore < MIN_CLIP_SCORE) {
    return {
      eligible: false,
      reason: `ClipScore ${clipScore} is below minimum threshold of ${MIN_CLIP_SCORE}`,
    };
  }

  const activeLoans = getUserActiveLoans(userId);
  if (activeLoans.length >= 2) {
    return {
      eligible: false,
      reason: "Maximum of 2 active loans allowed",
    };
  }

  return { eligible: true };
}
