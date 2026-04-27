import { describe, it, expect } from "vitest";
import {
  calculateProjection,
  getProjectionSummary,
} from "@/services/projection.service";

// --- Helpers ---

function pointAt(month: number, input: Parameters<typeof calculateProjection>[0]) {
  return calculateProjection(input).find((p) => p.month === month)!;
}

// --- Equivalence classes ---

describe("calculateProjection — equivalence classes", () => {
  const base = { principal: 1000, monthlyPMT: 500, annualRate: 11.75, months: 12 };

  it("returns month-0 point equal to principal with no interest growth", () => {
    const p = pointAt(0, base);
    expect(p.withInterest).toBe(1000);
    expect(p.withoutInterest).toBe(1000);
  });

  it("withInterest > withoutInterest for any positive rate after month 1", () => {
    const p = pointAt(6, base);
    expect(p.withInterest).toBeGreaterThan(p.withoutInterest);
  });

  it("withInterest === withoutInterest when rate is 0", () => {
    const p = pointAt(6, { ...base, annualRate: 0 });
    expect(p.withInterest).toBeCloseTo(p.withoutInterest, 2);
  });

  it("withoutInterest equals principal + PMT × months (simple sum)", () => {
    const p = pointAt(12, base);
    expect(p.withoutInterest).toBeCloseTo(1000 + 500 * 12, 2);
  });

  it("zero PMT still grows principal via interest", () => {
    const p = pointAt(12, { ...base, monthlyPMT: 0 });
    expect(p.withInterest).toBeGreaterThan(base.principal);
    expect(p.withoutInterest).toBe(base.principal);
  });

  it("zero principal still accumulates PMT contributions", () => {
    const p = pointAt(12, { ...base, principal: 0 });
    expect(p.withoutInterest).toBeCloseTo(500 * 12, 2);
    expect(p.withInterest).toBeGreaterThan(p.withoutInterest);
  });

  it("returns months+1 data points (month 0 through months)", () => {
    const points = calculateProjection(base);
    expect(points).toHaveLength(13); // 0 … 12 inclusive
  });

  it("data points are ordered by month ascending", () => {
    const points = calculateProjection(base);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].month).toBe(points[i - 1].month + 1);
    }
  });

  it("withInterest grows monotonically when PMT > 0", () => {
    const points = calculateProjection(base);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].withInterest).toBeGreaterThanOrEqual(points[i - 1].withInterest);
    }
  });
});

// --- Boundary values ---

describe("calculateProjection — boundary values", () => {
  it("months=1 returns exactly 2 points (month 0 and month 1)", () => {
    const points = calculateProjection({ principal: 500, monthlyPMT: 100, annualRate: 11.75, months: 1 });
    expect(points).toHaveLength(2);
  });

  it("months=0 returns only the initial point", () => {
    const points = calculateProjection({ principal: 500, monthlyPMT: 100, annualRate: 11.75, months: 0 });
    expect(points).toHaveLength(1);
    expect(points[0].month).toBe(0);
  });

  it("very high rate (100% p.a.) produces large growth", () => {
    const p = pointAt(12, { principal: 1000, monthlyPMT: 0, annualRate: 100, months: 12 });
    expect(p.withInterest).toBeGreaterThan(2000);
  });

  it("very small principal (R0.01) produces valid positive result", () => {
    const p = pointAt(12, { principal: 0.01, monthlyPMT: 0, annualRate: 11.75, months: 12 });
    expect(p.withInterest).toBeGreaterThan(0);
  });

  it("results are rounded to 2 decimal places", () => {
    const points = calculateProjection({ principal: 1000, monthlyPMT: 333.33, annualRate: 11.75, months: 12 });
    for (const p of points) {
      const decimals = (p.withInterest.toString().split(".")[1] ?? "").length;
      expect(decimals).toBeLessThanOrEqual(2);
    }
  });

  it("6-month projection is less than 12-month projection", () => {
    const input = { principal: 1000, monthlyPMT: 500, annualRate: 11.75, months: 12 };
    const p6 = pointAt(6, input);
    const p12 = pointAt(12, input);
    expect(p12.withInterest).toBeGreaterThan(p6.withInterest);
  });
});

// --- Formula spot-check ---

describe("calculateProjection — formula correctness", () => {
  it("matches manual A = P(1+r/n)^(nt) + PMT×((1+r/n)^(nt)-1)/(r/n) for known inputs", () => {
    // P=1000, PMT=500, r=0.1175, n=12, t=1 (12 months)
    const r = 0.1175;
    const n = 12;
    const t = 1;
    const base = Math.pow(1 + r / n, n * t);
    const expected = 1000 * base + 500 * ((base - 1) / (r / n));
    const p = pointAt(12, { principal: 1000, monthlyPMT: 500, annualRate: 11.75, months: 12 });
    expect(p.withInterest).toBeCloseTo(expected, 1);
  });
});

// --- getProjectionSummary ---

describe("getProjectionSummary", () => {
  const points = calculateProjection({ principal: 1000, monthlyPMT: 500, annualRate: 11.75, months: 12 });

  it("returns at6 and at12 data points", () => {
    const { at6, at12 } = getProjectionSummary(points);
    expect(at6?.month).toBe(6);
    expect(at12?.month).toBe(12);
  });

  it("returns null for at6/at12 when months < 12", () => {
    const short = calculateProjection({ principal: 1000, monthlyPMT: 500, annualRate: 11.75, months: 3 });
    const { at6, at12 } = getProjectionSummary(short);
    expect(at6).toBeNull();
    expect(at12).toBeNull();
  });
});
