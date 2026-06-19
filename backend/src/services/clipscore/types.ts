// ─── ClipScore Types ────────────────────────────────────

export interface ClipScoreBreakdown {
  base: number;
  income_bonus: number;
  savings_bonus: number;
  loan_bonus: number;
  referral_bonus: number;
  total: number;
}

export interface ClipScoreInput {
  user_id: string;
  // Income metrics
  total_income_30d: number;
  income_entries_count_30d: number;
  // Savings metrics
  total_susu_contributions: number;
  susu_groups_active: number;
  // Loan metrics
  loans_completed: number;
  loans_on_time: number;
  loans_defaulted: number;
  // Referral metrics
  referrals_joined: number;
}

export interface CreditScoreRecord {
  id: string;
  user_id: string;
  score: number;
  breakdown: ClipScoreBreakdown;
  calculated_at: Date;
  next_calculation_at: Date;
}

export type ScoreTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

// ─── Score Configuration ────────────────────────────────
const SCORE_CONFIG = {
  // Base score every user starts with
  BASE_SCORE: 100,

  // Income scoring (max +400)
  INCOME_POINTS_PER_ENTRY: 10,    // per income entry in last 30 days
  INCOME_STREAK_MULTIPLIER: 1.5,  // bonus for 7+ entries
  MAX_INCOME_BONUS: 400,

  // Savings scoring (max +250)
  SUSU_CONTRIBUTION_POINTS: 15,   // per confirmed contribution
  SUSU_GROUP_BONUS: 50,           // per active group
  MAX_SAVINGS_BONUS: 250,

  // Loan repayment scoring (max +300)
  LOAN_COMPLETED_POINTS: 100,     // per fully repaid loan
  LOAN_ON_TIME_BONUS: 50,         // per loan repaid on time
  LOAN_DEFAULT_PENALTY: -200,     // per defaulted loan
  MAX_LOAN_BONUS: 300,

  // Referral scoring (max +150)
  REFERRAL_POINTS: 50,            // per joined referral
  MAX_REFERRAL_BONUS: 150,

  // Final bounds
  MIN_SCORE: 0,
  MAX_SCORE: 900,
} as const;

// ─── Core Algorithm ─────────────────────────────────────

/**
 * Calculate ClipScore from user metrics.
 *
 * Formula:
 *   score = BASE + income_bonus + savings_bonus + loan_bonus + referral_bonus
 *   Clamped to [MIN_SCORE, MAX_SCORE]
 *
 * The score is designed to reward:
 *   1. Consistent income logging (daily revenue tracking)
 *   2. Active savings behaviour (Susu contributions)
 *   3. Responsible borrowing (on-time loan repayment)
 *   4. Community growth (referrals)
 */
export function calculateClipScore(input: ClipScoreInput): ClipScoreBreakdown {
  const income_bonus = calculateIncomeBonus(input);
  const savings_bonus = calculateSavingsBonus(input);
  const loan_bonus = calculateLoanBonus(input);
  const referral_bonus = calculateReferralBonus(input);

  const rawTotal =
    SCORE_CONFIG.BASE_SCORE +
    income_bonus +
    savings_bonus +
    loan_bonus +
    referral_bonus;

  const total = clamp(rawTotal, SCORE_CONFIG.MIN_SCORE, SCORE_CONFIG.MAX_SCORE);

  return {
    base: SCORE_CONFIG.BASE_SCORE,
    income_bonus,
    savings_bonus,
    loan_bonus,
    referral_bonus,
    total,
  };
}

// ─── Income Scoring ─────────────────────────────────────
function calculateIncomeBonus(input: ClipScoreInput): number {
  let bonus = input.income_entries_count_30d * SCORE_CONFIG.INCOME_POINTS_PER_ENTRY;

  // Streak multiplier: 7+ entries in 30 days = consistent
  if (input.income_entries_count_30d >= 7) {
    bonus = Math.round(bonus * SCORE_CONFIG.INCOME_STREAK_MULTIPLIER);
  }

  return Math.min(bonus, SCORE_CONFIG.MAX_INCOME_BONUS);
}

// ─── Savings Scoring ────────────────────────────────────
function calculateSavingsBonus(input: ClipScoreInput): number {
  const contributionBonus =
    input.total_susu_contributions * SCORE_CONFIG.SUSU_CONTRIBUTION_POINTS;
  const groupBonus =
    input.susu_groups_active * SCORE_CONFIG.SUSU_GROUP_BONUS;

  return Math.min(
    contributionBonus + groupBonus,
    SCORE_CONFIG.MAX_SAVINGS_BONUS,
  );
}

// ─── Loan Scoring ───────────────────────────────────────
function calculateLoanBonus(input: ClipScoreInput): number {
  const completedBonus =
    input.loans_completed * SCORE_CONFIG.LOAN_COMPLETED_POINTS;
  const onTimeBonus =
    input.loans_on_time * SCORE_CONFIG.LOAN_ON_TIME_BONUS;
  const defaultPenalty =
    input.loans_defaulted * SCORE_CONFIG.LOAN_DEFAULT_PENALTY;

  const raw = completedBonus + onTimeBonus + defaultPenalty;
  return Math.min(Math.max(raw, 0), SCORE_CONFIG.MAX_LOAN_BONUS);
}

// ─── Referral Scoring ───────────────────────────────────
function calculateReferralBonus(input: ClipScoreInput): number {
  return Math.min(
    input.referrals_joined * SCORE_CONFIG.REFERRAL_POINTS,
    SCORE_CONFIG.MAX_REFERRAL_BONUS,
  );
}

// ─── Score Tier ─────────────────────────────────────────
export function getScoreTier(score: number): ScoreTier {
  if (score >= 800) return "diamond";
  if (score >= 650) return "platinum";
  if (score >= 500) return "gold";
  if (score >= 300) return "silver";
  return "bronze";
}

export function getTierRange(tier: ScoreTier): { min: number; max: number } {
  switch (tier) {
    case "diamond": return { min: 800, max: 900 };
    case "platinum": return { min: 650, max: 799 };
    case "gold": return { min: 500, max: 649 };
    case "silver": return { min: 300, max: 499 };
    case "bronze": return { min: 0, max: 299 };
  }
}

// ─── Helpers ────────────────────────────────────────────
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
