import { describe, it, expect } from "vitest";
import { calculateClipScore, getScoreTier } from "../types.js";
import type { ClipScoreInput } from "../types.js";

function makeInput(overrides: Partial<ClipScoreInput> = {}): ClipScoreInput {
  return {
    user_id: "test-user",
    total_income_30d: 0,
    income_entries_count_30d: 0,
    total_susu_contributions: 0,
    susu_groups_active: 0,
    loans_completed: 0,
    loans_on_time: 0,
    loans_defaulted: 0,
    referrals_joined: 0,
    ...overrides,
  };
}

describe("calculateClipScore", () => {
  it("returns base score for new user with no activity", () => {
    const result = calculateClipScore(makeInput());
    expect(result.base).toBe(100);
    expect(result.income_bonus).toBe(0);
    expect(result.savings_bonus).toBe(0);
    expect(result.loan_bonus).toBe(0);
    expect(result.referral_bonus).toBe(0);
    expect(result.total).toBe(100);
  });

  it("calculates income bonus correctly", () => {
    // 5 entries × 10 = 50
    const result = calculateClipScore(makeInput({ income_entries_count_30d: 5 }));
    expect(result.income_bonus).toBe(50);
  });

  it("applies income streak multiplier at 7+ entries", () => {
    // 7 entries × 10 = 70 × 1.5 = 105
    const result = calculateClipScore(makeInput({ income_entries_count_30d: 7 }));
    expect(result.income_bonus).toBe(105);
  });

  it("caps income bonus at 400", () => {
    const result = calculateClipScore(makeInput({ income_entries_count_30d: 100 }));
    expect(result.income_bonus).toBe(400);
  });

  it("calculates savings bonus correctly", () => {
    // 5 contributions × 15 = 75, 2 groups × 50 = 100 → 175
    const result = calculateClipScore(
      makeInput({ total_susu_contributions: 5, susu_groups_active: 2 }),
    );
    expect(result.savings_bonus).toBe(175);
  });

  it("caps savings bonus at 250", () => {
    const result = calculateClipScore(
      makeInput({ total_susu_contributions: 20, susu_groups_active: 5 }),
    );
    expect(result.savings_bonus).toBe(250);
  });

  it("calculates loan bonus correctly", () => {
    // 1 completed × 100 = 100, 1 on-time × 50 = 50 → 150
    const result = calculateClipScore(
      makeInput({ loans_completed: 1, loans_on_time: 1 }),
    );
    expect(result.loan_bonus).toBe(150);
  });

  it("penalizes defaulted loans", () => {
    // 1 completed × 100 = 100, 1 default × -200 = -200 → 0 (clamped)
    const result = calculateClipScore(
      makeInput({ loans_completed: 1, loans_defaulted: 1 }),
    );
    expect(result.loan_bonus).toBe(0);
  });

  it("caps loan bonus at 300", () => {
    const result = calculateClipScore(
      makeInput({ loans_completed: 5, loans_on_time: 5 }),
    );
    expect(result.loan_bonus).toBe(300);
  });

  it("calculates referral bonus correctly", () => {
    // 3 referrals × 50 = 150
    const result = calculateClipScore(makeInput({ referrals_joined: 3 }));
    expect(result.referral_bonus).toBe(150);
  });

  it("caps referral bonus at 150", () => {
    const result = calculateClipScore(makeInput({ referrals_joined: 10 }));
    expect(result.referral_bonus).toBe(150);
  });

  it("clamps total to max 900", () => {
    const result = calculateClipScore(
      makeInput({
        income_entries_count_30d: 50,
        total_susu_contributions: 20,
        susu_groups_active: 5,
        loans_completed: 5,
        loans_on_time: 5,
        referrals_joined: 10,
      }),
    );
    expect(result.total).toBe(900);
  });

  it("handles a realistic power user", () => {
    const result = calculateClipScore(
      makeInput({
        income_entries_count_30d: 20,
        total_susu_contributions: 10,
        susu_groups_active: 2,
        loans_completed: 2,
        loans_on_time: 2,
        referrals_joined: 3,
      }),
    );

    // income: 20×10×1.5 = 300
    // savings: 10×15 + 2×50 = 250
    // loans: 2×100 + 2×50 = 300
    // referrals: 3×50 = 150
    // total: 100 + 300 + 250 + 300 + 150 = 1100 → clamped to 900
    expect(result.total).toBe(900);
  });
});

describe("getScoreTier", () => {
  it("returns diamond for 800+", () => {
    expect(getScoreTier(800)).toBe("diamond");
    expect(getScoreTier(900)).toBe("diamond");
  });

  it("returns platinum for 650-799", () => {
    expect(getScoreTier(650)).toBe("platinum");
    expect(getScoreTier(799)).toBe("platinum");
  });

  it("returns gold for 500-649", () => {
    expect(getScoreTier(500)).toBe("gold");
    expect(getScoreTier(649)).toBe("gold");
  });

  it("returns silver for 300-499", () => {
    expect(getScoreTier(300)).toBe("silver");
    expect(getScoreTier(499)).toBe("silver");
  });

  it("returns bronze for 0-299", () => {
    expect(getScoreTier(0)).toBe("bronze");
    expect(getScoreTier(299)).toBe("bronze");
  });
});
