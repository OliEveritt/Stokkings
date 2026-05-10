import { describe, it, expect, vi, beforeEach } from "vitest";

// Must be declared before any import that transitively loads firebase.ts,
// otherwise getAuth() fires at module level and throws auth/invalid-api-key.
vi.mock("@/lib/firebase", () => ({
  db: {},
  auth: {},
}));

// Mock the repository so no Firestore calls are made during tests.
vi.mock("@/repositories/analytics.repository");

import { AnalyticsService } from "@/services/analytics.service";
import * as repo from "@/repositories/analytics.repository";

const mockedRepo = vi.mocked(repo.analyticsRepository);

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    vi.clearAllMocks();
  });

  // ── calculateCompliancePercentage ────────────────────────────────────────

  describe("calculateCompliancePercentage", () => {
    it("returns 0 when expected is 0 (no obligation defined)", () => {
      expect(service.calculateCompliancePercentage(0, 0)).toBe(0);
    });

    it("returns 0 when confirmed is 0 out of N expected", () => {
      expect(service.calculateCompliancePercentage(0, 12)).toBe(0);
    });

    it("returns 100 when confirmed equals expected", () => {
      expect(service.calculateCompliancePercentage(12, 12)).toBe(100);
    });

    it("returns 100 when confirmed exceeds expected", () => {
      expect(service.calculateCompliancePercentage(13, 12)).toBe(100);
    });

    it("returns 83 for 10 out of 12 — UAT 3 scenario", () => {
      expect(service.calculateCompliancePercentage(10, 12)).toBe(83);
    });

    it("returns 50 for 1 out of 2", () => {
      expect(service.calculateCompliancePercentage(1, 2)).toBe(50);
    });

    it("rounds partial percentages correctly", () => {
      expect(service.calculateCompliancePercentage(1, 3)).toBe(33); // 33.33...
      expect(service.calculateCompliancePercentage(2, 3)).toBe(67); // 66.66...
    });
  });

  // ── calculateOverallCompliance ───────────────────────────────────────────

  describe("calculateOverallCompliance", () => {
    it("returns 0 for an empty history", () => {
      expect(service.calculateOverallCompliance([])).toBe(0);
    });

    it("returns the single value when history has one entry", () => {
      expect(service.calculateOverallCompliance([{ compliancePercentage: 83 }])).toBe(83);
    });

    it("returns the mean rounded to the nearest integer", () => {
      // (100 + 83 + 50) / 3 = 77.66 → 78
      const history = [
        { compliancePercentage: 100 },
        { compliancePercentage: 83 },
        { compliancePercentage: 50 },
      ];
      expect(service.calculateOverallCompliance(history)).toBe(78);
    });

    it("returns 100 when all periods are fully compliant", () => {
      const history = Array.from({ length: 12 }, () => ({ compliancePercentage: 100 }));
      expect(service.calculateOverallCompliance(history)).toBe(100);
    });

    it("returns 0 when all periods are 0%", () => {
      const history = Array.from({ length: 6 }, () => ({ compliancePercentage: 0 }));
      expect(service.calculateOverallCompliance(history)).toBe(0);
    });
  });

  // ── getContributionComplianceReport ─────────────────────────────────────

  describe("getContributionComplianceReport", () => {
    it("returns hasData: false when Firestore returns no records — UAT 2", async () => {
      mockedRepo.getContributionRecords = vi.fn().mockResolvedValue([]);

      const result = await service.getContributionComplianceReport("group-1");

      expect(result.hasData).toBe(false);
      expect(result.members).toHaveLength(0);
      expect(result.periods).toHaveLength(0);
    });

    it("returns hasData: true with correct shape when records exist — UAT 1", async () => {
      mockedRepo.getContributionRecords = vi.fn().mockResolvedValue([
        { memberId: "m1", memberName: "Alice", period: "2024-01", expected: 1, confirmed: 1 },
        { memberId: "m1", memberName: "Alice", period: "2024-02", expected: 1, confirmed: 0 },
        { memberId: "m2", memberName: "Bob",   period: "2024-01", expected: 1, confirmed: 1 },
        { memberId: "m2", memberName: "Bob",   period: "2024-02", expected: 1, confirmed: 1 },
      ]);

      const result = await service.getContributionComplianceReport("group-1");

      expect(result.hasData).toBe(true);
      expect(result.periods).toEqual(["2024-01", "2024-02"]);
      expect(result.members).toHaveLength(2);

      const alice = result.members.find((m) => m.memberId === "m1")!;
      expect(alice.history[0]).toEqual({ period: "2024-01", compliancePercentage: 100 });
      expect(alice.history[1]).toEqual({ period: "2024-02", compliancePercentage: 0 });
      expect(alice.overallCompliance).toBe(50);

      const bob = result.members.find((m) => m.memberId === "m2")!;
      expect(bob.overallCompliance).toBe(100);
    });

    it("sorts history chronologically regardless of Firestore return order", async () => {
      mockedRepo.getContributionRecords = vi.fn().mockResolvedValue([
        { memberId: "m1", memberName: "Alice", period: "2024-03", expected: 1, confirmed: 1 },
        { memberId: "m1", memberName: "Alice", period: "2024-01", expected: 1, confirmed: 1 },
        { memberId: "m1", memberName: "Alice", period: "2024-02", expected: 1, confirmed: 0 },
      ]);

      const result = await service.getContributionComplianceReport("group-1");
      const periods = result.members[0].history.map((h) => h.period);
      expect(periods).toEqual(["2024-01", "2024-02", "2024-03"]);
    });

    it("applies UAT 3: 10 of 12 confirmed → 83% compliance", async () => {
      mockedRepo.getContributionRecords = vi.fn().mockResolvedValue([
        { memberId: "m1", memberName: "Carol", period: "2024-01", expected: 12, confirmed: 10 },
      ]);

      const result = await service.getContributionComplianceReport("group-1");
      expect(result.members[0].history[0].compliancePercentage).toBe(83);
      expect(result.members[0].overallCompliance).toBe(83);
    });
  });
});