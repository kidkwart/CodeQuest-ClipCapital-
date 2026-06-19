// ─── Loan Types ─────────────────────────────────────────

export type LoanStatus = "pending" | "approved" | "rejected" | "repaid" | "defaulted";

export interface LoanApplication {
  id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  total_payable: number;
  balance: number;
  status: LoanStatus;
  term_months: number;
  daily_deduction: number;
  created_at: Date;
  updated_at: Date;
}

export interface LoanApplicationInput {
  user_id: string;
  amount: number;
  term_months?: number;
  interest_rate?: number;
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  amount: number;
  status: "pending" | "confirmed";
  created_at: Date;
}

export interface DisbursementResult {
  loan_id: string;
  amount_disbursed: number;
  daily_deduction: number;
  total_payable: number;
  balance: number;
  term_days: number;
}

export interface MicroDeductionResult {
  loan_id: string;
  amount_deducted: number;
  remaining_balance: number;
  is_fully_repaid: boolean;
  deduction_date: Date;
}

export interface LoanSummary {
  total_active_loans: number;
  total_outstanding: number;
  total_repaid: number;
  next_deduction_date: Date | null;
}
