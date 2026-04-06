import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateRepository } from "@/repositories/rate.repository";

// Create a mock PrismaClient with a rate model
const mockPrisma = {
  rate: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
};

describe("RateRepository", () => {
  let repository: RateRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new RateRepository(mockPrisma as any);
  });

  describe("save", () => {
    it("should persist a rate record and return it", async () => {
      const rateData = { repo: 8.25, prime: 11.75 };
      const savedRecord = {
        id: 1,
        ...rateData,
        createdAt: new Date("2026-04-05T10:00:00Z"),
      };
      mockPrisma.rate.create.mockResolvedValueOnce(savedRecord);

      const result = await repository.save(rateData);

      expect(mockPrisma.rate.create).toHaveBeenCalledWith({
        data: rateData,
      });
      expect(result).toEqual(savedRecord);
    });
  });

  describe("findLatest", () => {
    it("should return the most recent rate record", async () => {
      const latestRecord = {
        id: 5,
        repo: 8.25,
        prime: 11.75,
        createdAt: new Date("2026-04-05T10:00:00Z"),
      };
      mockPrisma.rate.findFirst.mockResolvedValueOnce(latestRecord);

      const result = await repository.findLatest();

      expect(mockPrisma.rate.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(latestRecord);
    });

    it("should return null when no rate records exist", async () => {
      mockPrisma.rate.findFirst.mockResolvedValueOnce(null);

      const result = await repository.findLatest();

      expect(result).toBeNull();
    });
  });
});
