import { describe, it, expect } from "vitest";
import { calculateCommission } from "../marketplace/index.js";

describe("Marketplace Commission Logic", () => {
  it("should calculate 10% commission correctly", async () => {
    const total = 100;
    const commission = await calculateCommission(total);
    expect(commission).toBe(10);
  });

  it("should handle decimal amounts", async () => {
    const total = 150.75;
    const commission = await calculateCommission(total);
    expect(commission).toBe(15.08);
  });

  it("should return 0 for zero amount", async () => {
    const commission = await calculateCommission(0);
    expect(commission).toBe(0);
  });

  it("should handle large amounts", async () => {
    const total = 1000000;
    const commission = await calculateCommission(total);
    expect(commission).toBe(100000);
  });
});