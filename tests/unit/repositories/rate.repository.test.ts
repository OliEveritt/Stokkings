import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateRepository } from "@/repositories/rate.repository";

const mockPrisma = {
  saRate: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe("RateRepository", () => {
  let repository: RateRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new RateRepository(mockPrisma as any);
  });

  describe("save", () => {
    it("should insert a repo and prime row in a transaction", async () => {
      mockPrisma.$transaction.mockResolvedValueOnce([{}, {}]);

      const result = await repository.save({ repo: 6.75, prime: 10.25 });

      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
      const txArgs = mockPrisma.$transaction.mock.calls[0][0];
      expect(txArgs).toHaveLength(2);
      expect(result.repo).toBe(6.75);
      expect(result.prime).toBe(10.25);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("findLatest", () => {
    it("should query the latest repo and prime rows separately", async () => {
      const now = new Date();
      mockPrisma.saRate.findFirst
        .mockResolvedValueOnce({
          rateId: 1,
          rateType: "repo",
          rate: 6.75,
          updatedAt: now,
        })
        .mockResolvedValueOnce({
          rateId: 2,
          rateType: "prime",
          rate: 10.25,
          updatedAt: now,
        });

      const result = await repository.findLatest();

      expect(mockPrisma.saRate.findFirst).toHaveBeenCalledTimes(2);
      expect(mockPrisma.saRate.findFirst).toHaveBeenCalledWith({
        where: { rateType: "repo" },
        orderBy: { updatedAt: "desc" },
      });
      expect(mockPrisma.saRate.findFirst).toHaveBeenCalledWith({
        where: { rateType: "prime" },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toEqual({ repo: 6.75, prime: 10.25, updatedAt: now });
    });

    it("should return null when no repo row exists", async () => {
      mockPrisma.saRate.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          rateId: 2,
          rateType: "prime",
          rate: 10.25,
          updatedAt: new Date(),
        });

      const result = await repository.findLatest();

      expect(result).toBeNull();
    });

    it("should return null when no prime row exists", async () => {
      mockPrisma.saRate.findFirst
        .mockResolvedValueOnce({
          rateId: 1,
          rateType: "repo",
          rate: 6.75,
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce(null);

      const result = await repository.findLatest();

      expect(result).toBeNull();
    });

    it("should use the most recent updatedAt between the two rows", async () => {
      const older = new Date("2026-04-01T00:00:00Z");
      const newer = new Date("2026-04-02T00:00:00Z");
      mockPrisma.saRate.findFirst
        .mockResolvedValueOnce({
          rateId: 1,
          rateType: "repo",
          rate: 6.75,
          updatedAt: older,
        })
        .mockResolvedValueOnce({
          rateId: 2,
          rateType: "prime",
          rate: 10.25,
          updatedAt: newer,
        });

      const result = await repository.findLatest();

      expect(result!.updatedAt).toEqual(newer);
    });
  });
});
