import type {
  ClipScoreInput,
  ClipScoreBreakdown,
  CreditScoreRecord,
} from "./types.js";
import { calculateClipScore, getScoreTier } from "./types.js";

// ─── ClipScore Service ──────────────────────────────────
// Manages credit scoring for ClipCapital users.
// Runs on every income entry, susu contribution, loan event, and referral.

const creditScores = new Map<string, CreditScoreRecord>();

/**
 * Compute and store a new ClipScore for a user.
 *
 * Call this whenever a score-relevant event occurs:
 * - Income logged
 * - Susu contribution confirmed
 * - Loan repaid / defaulted
 * - Referral joined
 */
export function computeAndStoreScore(
  input: ClipScoreInput,
): CreditScoreRecord {
  const breakdown = calculateClipScore(input);
  const tier = getScoreTier(breakdown.total);

  const record: CreditScoreRecord = {
    id: crypto.randomUUID(),
    user_id: input.user_id,
    score: breakdown.total,
    breakdown,
    calculated_at: new Date(),
    next_calculation_at: getNextCalculationDate(),
  };

  creditScores.set(input.user_id, record);

  console.log(
    `[clipscore] User ${input.user_id}: score=${breakdown.total} tier=${tier} ` +
    `(income=${breakdown.income_bonus} savings=${breakdown.savings_bonus} ` +
    `loans=${breakdown.loan_bonus} referrals=${breakdown.referral_bonus})`,
  );

  return record;
}

/**
 * Get the current ClipScore for a user.
 */
export function getScore(userId: string): CreditScoreRecord | undefined {
  return creditScores.get(userId);
}

/**
 * Get all credit scores (admin view).
 */
export function getAllScores(): CreditScoreRecord[] {
  return Array.from(creditScores.values());
}

/**
 * Get scores ranked by score descending (leaderboard).
 */
export function getLeaderboard(limit: number = 50): CreditScoreRecord[] {
  return getAllScores()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get score distribution (admin analytics).
 */
export function getScoreDistribution(): Record<string, number> {
  const scores = getAllScores();
  const dist: Record<string, number> = {
    diamond: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
  };

  for (const s of scores) {
    const tier = getScoreTier(s.score);
    dist[tier]++;
  }

  return dist;
}

/**
 * Check if a user qualifies for a loan at the given amount.
 * Uses ClipScore tier to determine max loanable amount.
 */
export function getMaxLoanAmount(clipScore: number): number {
  const tier = getScoreTier(clipScore);

  switch (tier) {
    case "diamond": return 5000;
    case "platinum": return 3000;
    case "gold": return 2000;
    case "silver": return 1000;
    case "bronze": return 500;
  }
}

/**
 * Build a ClipScoreInput from raw user data.
 * This is the bridge between your database and the scoring algorithm.
 */
export function buildScoreInput(params: {
  user_id: string;
  income_total_30d: number;
  income_count_30d: number;
  susu_contributions: number;
  susu_groups_active: number;
  loans_completed: number;
  loans_on_time: number;
  loans_defaulted: number;
  referrals_joined: number;
}): ClipScoreInput {
  return {
    user_id: params.user_id,
    total_income_30d: params.income_total_30d,
    income_entries_count_30d: params.income_count_30d,
    total_susu_contributions: params.susu_contributions,
    susu_groups_active: params.susu_groups_active,
    loans_completed: params.loans_completed,
    loans_on_time: params.loans_on_time,
    loans_defaulted: params.loans_defaulted,
    referrals_joined: params.referrals_joined,
  };
}

// ─── Helpers ────────────────────────────────────────────
function getNextCalculationDate(): Date {
  const next = new Date();
  next.setHours(next.getHours() + 24);
  return next;
}
