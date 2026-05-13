import { describe, it, expect, vi, beforeEach } from "vitest";

// Must be declared before any import that transitively loads firebase.ts,
// otherwise getAuth() fires at module level and throws auth/invalid-api-key.
vi.mock("@/lib/firebase", () => ({
  db: {},
  auth: {},
}));

// Mock the repository so no Firestore calls are made during tests (compliance).
vi.mock("@/repositories/analytics.repository", () => ({
  analyticsRepository: {
    getContributionRecords: vi.fn(),
  },
}));

// Mock firebase/firestore for direct Firestore calls in the payout report (US-3.2).
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    getDocs: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
  };
});

import {
  AnalyticsService,
  getPayoutHistory,
  getPayoutSchedule,
  getPayoutReportData,
} from "@/services/analytics.service";
import * as repo from "@/repositories/analytics.repository";
import { getDocs } from "firebase/firestore";

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

describe("Analytics Service - Payout Projections (US-3.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPayoutHistory", () => {
    it("should return empty array when no payouts exist", async () => {
      vi.mocked(getDocs).mockResolvedValue({
        empty: true,
        docs: [],
        forEach: vi.fn(),
      } as any);

      const result = await getPayoutHistory("group-123");
      expect(result).toEqual([]);
    });

    it("should return formatted payouts when data exists", async () => {
      const mockDocs = {
        empty: false,
        docs: [
          {
            id: "payout-1",
            data: () => ({
              groupId: "group-123",
              memberName: "John Doe",
              amount: 500,
              payoutDate: "2026-04-15",
              status: "completed",
            }),
          },
          {
            id: "payout-2",
            data: () => ({
              groupId: "group-123",
              memberName: "Jane Smith",
              amount: 750,
              payoutDate: "2026-05-01",
              status: "completed",
            }),
          },
        ],
        forEach: (fn: any) => {
          mockDocs.docs.forEach(fn);
        },
      } as any;

      vi.mocked(getDocs).mockResolvedValue(mockDocs);

      const result = await getPayoutHistory("group-123");
      expect(result).toHaveLength(2);
      expect(result[0].memberName).toBe("John Doe");
      expect(result[0].amount).toBe(500);
      expect(result[1].memberName).toBe("Jane Smith");
      expect(result[1].amount).toBe(750);
    });
  });

  describe("getPayoutSchedule", () => {
    it("should return empty array when no schedule exists", async () => {
      vi.mocked(getDocs).mockResolvedValue({
        empty: true,
        docs: [],
        forEach: vi.fn(),
      } as any);

      const result = await getPayoutSchedule("group-123");
      expect(result).toEqual([]);
    });

    it("should return formatted schedule with correct ordering", async () => {
      const mockDocs = {
        empty: false,
        docs: [
          {
            id: "member-1",
            data: () => ({
              groupId: "group-123",
              name: "Alice",
              position: 1,
              amount: 500,
              expectedDate: "2026-06-01",
            }),
          },
          {
            id: "member-2",
            data: () => ({
              groupId: "group-123",
              name: "Bob",
              position: 2,
              amount: 500,
              expectedDate: "2026-07-01",
            }),
          },
        ],
        forEach: (fn: any) => {
          mockDocs.docs.forEach(fn);
        },
      } as any;

      vi.mocked(getDocs).mockResolvedValue(mockDocs);

      const result = await getPayoutSchedule("group-123");
      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(1);
      expect(result[0].memberName).toBe("Alice");
      expect(result[1].position).toBe(2);
      expect(result[1].memberName).toBe("Bob");
    });
  });

  describe("getPayoutReportData", () => {
    it("should combine past payouts and upcoming projections", async () => {
      const mockPayouts = {
        empty: false,
        docs: [
          {
            id: "payout-1",
            data: () => ({
              groupId: "group-123",
              memberName: "John",
              amount: 500,
              payoutDate: "2026-04-15",
              status: "completed",
            }),
          },
        ],
        forEach: (fn: any) => {
          fn(mockPayouts.docs[0]);
        },
      } as any;

      const mockSchedule = {
        empty: false,
        docs: [
          {
            id: "member-1",
            data: () => ({
              groupId: "group-123",
              name: "Alice",
              position: 1,
              amount: 500,
              expectedDate: "2026-06-01",
            }),
          },
        ],
        forEach: (fn: any) => {
          fn(mockSchedule.docs[0]);
        },
      } as any;

      vi.mocked(getDocs)
        .mockResolvedValueOnce(mockPayouts)
        .mockResolvedValueOnce(mockSchedule);

      const result = await getPayoutReportData("group-123");

      expect(result.hasPastPayouts).toBe(true);
      expect(result.pastPayouts).toHaveLength(1);
      expect(result.upcomingProjections).toHaveLength(1);
      expect(result.totalPaidOut).toBe(500);
      expect(result.totalScheduled).toBe(500);
    });

    it("should handle empty state (UAT 2)", async () => {
      const mockEmpty = {
        empty: true,
        docs: [],
        forEach: vi.fn(),
      } as any;

      vi.mocked(getDocs).mockResolvedValue(mockEmpty);

      const result = await getPayoutReportData("group-123");

      expect(result.hasPastPayouts).toBe(false);
      expect(result.pastPayouts).toHaveLength(0);
      expect(result.upcomingProjections).toHaveLength(0);
      expect(result.totalPaidOut).toBe(0);
      expect(result.totalScheduled).toBe(0);
      expect(result.nextPayoutDate).toBeNull();
    });

    it("should calculate totals correctly with multiple payouts", async () => {
      const mockPayouts = {
        empty: false,
        docs: [
          { id: "p1", data: () => ({ amount: 100, memberName: "A", payoutDate: "2026-01-01", status: "completed" }) },
          { id: "p2", data: () => ({ amount: 200, memberName: "B", payoutDate: "2026-02-01", status: "completed" }) },
          { id: "p3", data: () => ({ amount: 300, memberName: "C", payoutDate: "2026-03-01", status: "completed" }) },
        ],
        forEach: (fn: any) => {
          mockPayouts.docs.forEach(fn);
        },
      } as any;

      const mockSchedule = {
        empty: false,
        docs: [
          { id: "s1", data: () => ({ amount: 400, name: "D", position: 1, expectedDate: "2026-06-01" }) },
          { id: "s2", data: () => ({ amount: 400, name: "E", position: 2, expectedDate: "2026-07-01" }) },
        ],
        forEach: (fn: any) => {
          mockSchedule.docs.forEach(fn);
        },
      } as any;

      vi.mocked(getDocs)
        .mockResolvedValueOnce(mockPayouts)
        .mockResolvedValueOnce(mockSchedule);

      const result = await getPayoutReportData("group-123");

      expect(result.totalPaidOut).toBe(600);
      expect(result.totalScheduled).toBe(800);
    });
  });
});