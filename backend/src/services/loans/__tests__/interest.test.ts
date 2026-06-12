import { describe, it, expect } from "vitest";
import {
  calculateInterest,
  calculateTotalPayable,
  calculateDailyDeduction,
  calculateRemainingBalance,
  calculateDaysUntilRepaid,
  calculateMonthlyAccrual,
} from "../interest.js";

describe("calculateInterest", () => {
  it("calculates flat interest correctly", () => {
    expect(calculateInterest(500, 10)).toBe(50);
    expect(calculateInterest(1000, 15)).toBe(150);
    expect(calculateInterest(200, 5)).toBe(10);
  });

  it("returns 0 for 0% interest rate", () => {
    expect(calculateInterest(500, 0)).toBe(0);
  });

  it("handles decimal rates", () => {
    expect(calculateInterest(1000, 7.5)).toBe(75);
  });

  it("rounds to 2 decimal places", () => {
    expect(calculateInterest(333, 7)).toBe(23.31);
  });

  it("throws for negative principal", () => {
    expect(() => calculateInterest(-100, 10)).toThrow("Principal must be positive");
  });

  it("throws for zero principal", () => {
    expect(() => calculateInterest(0, 10)).toThrow("Principal must be positive");
  });

  it("throws for negative rate", () => {
    expect(() => calculateInterest(500, -5)).toThrow("cannot be negative");
  });
});

describe("calculateTotalPayable", () => {
  it("adds principal + interest", () => {
    expect(calculateTotalPayable(500, 10)).toBe(550);
    expect(calculateTotalPayable(1000, 15)).toBe(1150);
  });

  it("returns principal when rate is 0", () => {
    expect(calculateTotalPayable(500, 0)).toBe(500);
  });
});

describe("calculateDailyDeduction", () => {
  it("divides total by term days", () => {
    // 550 / 30 = 18.33...
    expect(calculateDailyDeduction(550, 1)).toBe(18.34); // ceil
  });

  it("handles multi-month terms", () => {
    // 1150 / 60 = 19.166...
    expect(calculateDailyDeduction(1150, 2)).toBe(19.17);
  });

  it("rounds up to nearest pesewa", () => {
    // 100 / 30 = 3.333... → ceil → 3.34
    expect(calculateDailyDeduction(100, 1)).toBe(3.34);
  });

  it("throws for zero payable", () => {
    expect(() => calculateDailyDeduction(0, 1)).toThrow("positive");
  });

  it("throws for zero term", () => {
    expect(() => calculateDailyDeduction(500, 0)).toThrow("at least 1 month");
  });
});

describe("calculateRemainingBalance", () => {
  it("subtracts deductions from total", () => {
    expect(calculateRemainingBalance(550, 18.34, 10)).toBe(366.6);
  });

  it("returns 0 when fully repaid", () => {
    expect(calculateRemainingBalance(550, 18.34, 30)).toBe(0);
  });

  it("does not go negative", () => {
    expect(calculateRemainingBalance(100, 50, 10)).toBe(0);
  });

  it("returns full amount when no days repaid", () => {
    expect(calculateRemainingBalance(550, 18.34, 0)).toBe(550);
  });
});

describe("calculateDaysUntilRepaid", () => {
  it("calculates ceiling of total/daily", () => {
    expect(calculateDaysUntilRepaid(550, 18.34)).toBe(30);
  });

  it("rounds up for uneven splits", () => {
    expect(calculateDaysUntilRepaid(100, 3.34)).toBe(30);
  });
});

describe("calculateMonthlyAccrual", () => {
  it("calculates interest on current balance", () => {
    expect(calculateMonthlyAccrual(500, 10)).toBe(50);
  });

  it("returns 0 for zero balance", () => {
    expect(calculateMonthlyAccrual(0, 10)).toBe(0);
  });

  it("returns 0 for negative balance", () => {
    expect(calculateMonthlyAccrual(-100, 10)).toBe(0);
  });
});
