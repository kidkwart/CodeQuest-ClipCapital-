import { describe, it, expect, beforeEach } from "vitest";
import {
  applyForLoan,
  approveLoan,
  rejectLoan,
  getLoan,
  getUserActiveLoans,
  checkLoanEligibility,
} from "../index.js";

// Reset in-memory store between tests
beforeEach(() => {
  // Clear the loans map by re-importing isn't possible with in-memory,
  // so we rely on unique user_ids per test
});

describe("applyForLoan", () => {
  it("creates a pending loan application", () => {
    const loan = applyForLoan({ user_id: "user-1", amount: 500 });

    expect(loan.status).toBe("pending");
    expect(loan.amount).toBe(500);
    expect(loan.user_id).toBe("user-1");
    expect(loan.total_payable).toBe(550); // 500 + 10%
    expect(loan.id).toBeDefined();
  });

  it("applies default interest rate (10%)", () => {
    const loan = applyForLoan({ user_id: "user-2", amount: 1000 });
    expect(loan.interest_rate).toBe(10);
    expect(loan.total_payable).toBe(1100);
  });

  it("accepts custom interest rate", () => {
    const loan = applyForLoan({
      user_id: "user-3",
      amount: 1000,
      interest_rate: 15,
    });
    expect(loan.total_payable).toBe(1150);
  });

  it("calculates daily deduction", () => {
    const loan = applyForLoan({ user_id: "user-4", amount: 500 });
    // 550 / 30 = 18.333... → ceil → 18.34
    expect(loan.daily_deduction).toBe(18.34);
  });

  it("throws for amount below minimum", () => {
    expect(() =>
      applyForLoan({ user_id: "user-5", amount: 30 }),
    ).toThrow("between GHS 50 and GHS 5000");
  });

  it("throws for amount above maximum", () => {
    expect(() =>
      applyForLoan({ user_id: "user-6", amount: 10000 }),
    ).toThrow("between GHS 50 and GHS 5000");
  });
});

describe("approveLoan", () => {
  it("approves a pending loan and returns disbursement details", () => {
    const loan = applyForLoan({ user_id: "user-7", amount: 500 });
    const result = approveLoan(loan.id);

    expect(result.loan_id).toBe(loan.id);
    expect(result.amount_disbursed).toBe(500);
    expect(result.daily_deduction).toBe(18.34);
    expect(result.total_payable).toBe(550);
    expect(result.term_days).toBe(30);
  });

  it("throws for non-existent loan", () => {
    expect(() => approveLoan("fake-id")).toThrow("Loan not found");
  });

  it("throws for already approved loan", () => {
    const loan = applyForLoan({ user_id: "user-8", amount: 500 });
    approveLoan(loan.id);
    expect(() => approveLoan(loan.id)).toThrow("Cannot approve loan in status: approved");
  });
});

describe("rejectLoan", () => {
  it("rejects a pending loan", () => {
    const loan = applyForLoan({ user_id: "user-9", amount: 500 });
    const rejected = rejectLoan(loan.id, "Insufficient income");

    expect(rejected.status).toBe("rejected");
  });

  it("throws for non-existent loan", () => {
    expect(() => rejectLoan("fake-id")).toThrow("Loan not found");
  });
});

describe("checkLoanEligibility", () => {
  it("allows when score >= 600 and no active loans", () => {
    const result = checkLoanEligibility("user-10", 700);
    expect(result.eligible).toBe(true);
  });

  it("rejects when score < 600", () => {
    const result = checkLoanEligibility("user-11", 400);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("below minimum");
  });

  it("rejects when score exactly 599", () => {
    const result = checkLoanEligibility("user-12", 599);
    expect(result.eligible).toBe(false);
  });

  it("allows when score exactly 600", () => {
    const result = checkLoanEligibility("user-13", 600);
    expect(result.eligible).toBe(true);
  });
});

describe("getUserActiveLoans", () => {
  it("returns pending and approved loans", () => {
    const user = "user-14";
    applyForLoan({ user_id: user, amount: 500 });
    applyForLoan({ user_id: user, amount: 300 });

    const active = getUserActiveLoans(user);
    expect(active.length).toBe(2);
  });

  it("excludes rejected loans", () => {
    const user = "user-15";
    const loan = applyForLoan({ user_id: user, amount: 500 });
    rejectLoan(loan.id);

    const active = getUserActiveLoans(user);
    expect(active.length).toBe(0);
  });
});
