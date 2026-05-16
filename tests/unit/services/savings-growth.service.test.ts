import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    })),
  })),
}));

// We test the aggregation logic directly by extracting it
// The route aggregates confirmed contributions by period and computes cumulative totals

interface RawContribution {
  status: string;
  contributionDate?: string;
  amount: number;
}

interface DataPoint {
  period: string;
  amount: number;
  cumulative: number;
}

// Pure aggregation function extracted from the route for unit testing
function aggregateSavingsGrowth(contributions: RawContribution[]): {
  hasData: boolean;
  dataPoints: DataPoint[];
} {
  const confirmed = contributions.filter((c) => c.status === "confirmed");
  if (confirmed.length === 0) return { hasData: false, dataPoints: [] };

  const periodMap = new Map<string, number>();

  for (const c of confirmed) {
    const raw = c.contributionDate ? new Date(c.contributionDate) : new Date();
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    const period = `${y}-${m}`;
    const amount = typeof c.amount === "number" ? c.amount : 0;
    periodMap.set(period, (periodMap.get(period) ?? 0) + amount);
  }

  const sorted = [...periodMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  let cumulative = 0;
  const dataPoints = sorted.map(([period, amount]) => {
    cumulative += amount;
    return { period, amount, cumulative };
  });

  return { hasData: true, dataPoints };
}

describe("SavingsGrowth aggregation", () => {

  // ── UAT 3: Zero data ─────────────────────────────────────────────────────

  describe("zero data — UAT 3", () => {
    it("returns hasData: false when no contributions exist — boundary: empty array", () => {
      const result = aggregateSavingsGrowth([]);
      expect(result.hasData).toBe(false);
      expect(result.dataPoints).toHaveLength(0);
    });

    it("returns hasData: false when all contributions are pending", () => {
      const result = aggregateSavingsGrowth([
        { status: "pending", contributionDate: "2026-01-15", amount: 500 },
        { status: "pending", contributionDate: "2026-02-15", amount: 500 },
      ]);
      expect(result.hasData).toBe(false);
    });

    it("returns hasData: false when all contributions are missed", () => {
      const result = aggregateSavingsGrowth([
        { status: "missed", contributionDate: "2026-01-15", amount: 500 },
      ]);
      expect(result.hasData).toBe(false);
    });
  });

  // ── UAT 1: Single contribution ───────────────────────────────────────────

  describe("single contribution — boundary: 1 data point", () => {
    it("returns hasData: true with one data point", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-01-15", amount: 500 },
      ]);
      expect(result.hasData).toBe(true);
      expect(result.dataPoints).toHaveLength(1);
    });

    it("cumulative equals amount for single contribution", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-01-15", amount: 500 },
      ]);
      expect(result.dataPoints[0].cumulative).toBe(500);
      expect(result.dataPoints[0].amount).toBe(500);
    });

    it("period is correctly formatted as YYYY-MM", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-03-10", amount: 300 },
      ]);
      expect(result.dataPoints[0].period).toBe("2026-03");
    });
  });

  // ── UAT 1: Multiple months ───────────────────────────────────────────────

  describe("multiple months — UAT 1", () => {
    it("sorts data points chronologically", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-03-15", amount: 300 },
        { status: "confirmed", contributionDate: "2026-01-15", amount: 500 },
        { status: "confirmed", contributionDate: "2026-02-15", amount: 400 },
      ]);
      const periods = result.dataPoints.map((d) => d.period);
      expect(periods).toEqual(["2026-01", "2026-02", "2026-03"]);
    });

    it("computes cumulative totals correctly across months", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-01-15", amount: 500 },
        { status: "confirmed", contributionDate: "2026-02-15", amount: 400 },
        { status: "confirmed", contributionDate: "2026-03-15", amount: 300 },
      ]);
      expect(result.dataPoints[0].cumulative).toBe(500);
      expect(result.dataPoints[1].cumulative).toBe(900);
      expect(result.dataPoints[2].cumulative).toBe(1200);
    });

    it("returns correct number of data points — boundary: 12 months", () => {
      const contributions = Array.from({ length: 12 }, (_, i) => ({
        status: "confirmed",
        contributionDate: `2026-${String(i + 1).padStart(2, "0")}-15`,
        amount: 500,
      }));
      const result = aggregateSavingsGrowth(contributions);
      expect(result.dataPoints).toHaveLength(12);
      expect(result.dataPoints[11].cumulative).toBe(6000);
    });
  });

  // ── UAT 2: Multiple members ──────────────────────────────────────────────

  describe("multiple members — UAT 2", () => {
    it("aggregates all members contributions in same period", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-01-10", amount: 500 },
        { status: "confirmed", contributionDate: "2026-01-15", amount: 500 },
        { status: "confirmed", contributionDate: "2026-01-20", amount: 500 },
      ]);
      expect(result.dataPoints[0].amount).toBe(1500);
      expect(result.dataPoints[0].cumulative).toBe(1500);
    });

    it("reflects total of all members not just one — UAT 2", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-01-10", amount: 300 },
        { status: "confirmed", contributionDate: "2026-01-15", amount: 400 },
        { status: "confirmed", contributionDate: "2026-01-20", amount: 500 },
      ]);
      expect(result.dataPoints[0].amount).toBe(1200);
    });

    it("excludes non-confirmed contributions from total — UAT 2", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-01-10", amount: 500 },
        { status: "pending", contributionDate: "2026-01-15", amount: 500 },
        { status: "missed", contributionDate: "2026-01-20", amount: 500 },
      ]);
      expect(result.dataPoints[0].amount).toBe(500);
    });

    it("handles contributions across months from multiple members", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-01-10", amount: 500 },
        { status: "confirmed", contributionDate: "2026-01-15", amount: 500 },
        { status: "confirmed", contributionDate: "2026-02-10", amount: 500 },
        { status: "confirmed", contributionDate: "2026-02-15", amount: 500 },
      ]);
      expect(result.dataPoints).toHaveLength(2);
      expect(result.dataPoints[0].amount).toBe(1000);
      expect(result.dataPoints[1].amount).toBe(1000);
      expect(result.dataPoints[1].cumulative).toBe(2000);
    });
  });

  // ── Boundary: zero amount ────────────────────────────────────────────────

  describe("boundary: zero amount contributions", () => {
    it("handles zero amount contribution", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-01-15", amount: 0 },
      ]);
      expect(result.hasData).toBe(true);
      expect(result.dataPoints[0].cumulative).toBe(0);
    });

    it("handles mix of zero and non-zero amounts", () => {
      const result = aggregateSavingsGrowth([
        { status: "confirmed", contributionDate: "2026-01-15", amount: 0 },
        { status: "confirmed", contributionDate: "2026-01-20", amount: 500 },
      ]);
      expect(result.dataPoints[0].amount).toBe(500);
    });
  });
});