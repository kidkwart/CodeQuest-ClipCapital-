// ─── Interest & Deduction Calculations ──────────────────
// Core math for ClipCapital's micro-loan model.
// All amounts in GHS (Ghana Cedis).

/**
 * Calculate flat interest on a loan amount.
 *
 * Formula: interest = principal × (rate / 100)
 *
 * Example: GHS 500 at 10% → GHS 50 interest → GHS 550 total
 */
export function calculateInterest(principal: number, ratePercent: number): number {
  if (principal <= 0) throw new Error("Principal must be positive");
  if (ratePercent < 0) throw new Error("Interest rate cannot be negative");

  const interest = principal * (ratePercent / 100);
  return roundTo2dp(interest);
}

/**
 * Calculate total payable (principal + flat interest).
 *
 * Example: GHS 500 at 10% → GHS 550 total payable
 */
export function calculateTotalPayable(principal: number, ratePercent: number): number {
  const interest = calculateInterest(principal, ratePercent);
  return roundTo2dp(principal + interest);
}

/**
 * Calculate the daily micro-deduction amount.
 *
 * Formula: totalPayable / (term_months × 30)
 *
 * This assumes ~30 days per month for simplicity.
 * Deduction is rounded up to the nearest pesewa (0.01 GHS).
 */
export function calculateDailyDeduction(
  totalPayable: number,
  termMonths: number,
): number {
  if (totalPayable <= 0) throw new Error("Total payable must be positive");
  if (termMonths <= 0) throw new Error("Term must be at least 1 month");

  const days = termMonths * 30;
  const deduction = totalPayable / days;
  return roundTo2dp(Math.ceil(deduction * 100) / 100);
}

/**
 * Calculate remaining balance after N days of deductions.
 *
 * daysRepied: number of days deductions have been applied
 */
export function calculateRemainingBalance(
  totalPayable: number,
  dailyDeduction: number,
  daysRepaid: number,
): number {
  const totalDeducted = dailyDeduction * daysRepaid;
  const remaining = totalPayable - totalDeducted;
  return remaining > 0 ? roundTo2dp(remaining) : 0;
}

/**
 * Calculate the number of days until full repayment.
 */
export function calculateDaysUntilRepaid(
  totalPayable: number,
  dailyDeduction: number,
): number {
  return Math.ceil(totalPayable / dailyDeduction);
}

/**
 * Calculate monthly interest accrual (for overdue loans).
 * Applies the monthly rate to the current outstanding balance.
 */
export function calculateMonthlyAccrual(
  currentBalance: number,
  monthlyRate: number,
): number {
  if (currentBalance <= 0) return 0;
  return roundTo2dp(calculateInterest(currentBalance, monthlyRate));
}

// ─── Helpers ────────────────────────────────────────────
function roundTo2dp(n: number): number {
  return Math.round(n * 100) / 100;
}
