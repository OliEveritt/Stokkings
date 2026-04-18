import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateService } from "@/services/rate.service";

// Mock dependencies
const mockRepository = {
  save: vi.fn(),
  findLatest: vi.fn(),
};

const mockSarbClient = {
  fetchSarbRates: vi.fn(),
};

describe("RateService", () => {
  let service: RateService;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new RateService(mockRepository as any, mockSarbClient as any);
  });

  describe("getLatestRates", () => {
    it("should return cached rates when they are fresh (less than 24h old)", async () => {
      const freshRecord = {
        id: 1,
        repo: 8.25,
        prime: 11.75,
        updatedAt: new Date(), // now — fresh
      };
      mockRepository.findLatest.mockResolvedValueOnce(freshRecord);

      const result = await service.getLatestRates();

      expect(result).toEqual({
        repo: 8.25,
        prime: 11.75,
        updated: freshRecord.updatedAt.toISOString(),
      });
      expect(mockSarbClient.fetchSarbRates).not.toHaveBeenCalled();
    });

    it("should fetch from SARB and save when no cached rates exist", async () => {
      mockRepository.findLatest.mockResolvedValueOnce(null);
      mockSarbClient.fetchSarbRates.mockResolvedValueOnce({
        repo: 8.25,
        prime: 11.75,
      });
      const savedRecord = {
        id: 1,
        repo: 8.25,
        prime: 11.75,
        updatedAt: new Date("2026-04-05T12:00:00Z"),
      };
      mockRepository.save.mockResolvedValueOnce(savedRecord);

      const result = await service.getLatestRates();

      expect(mockSarbClient.fetchSarbRates).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith({
        repo: 8.25,
        prime: 11.75,
      });
      expect(result).toEqual({
        repo: 8.25,
        prime: 11.75,
        updated: savedRecord.updatedAt.toISOString(),
      });
    });

    it("should fetch from SARB and save when cached rates are stale (older than 24h)", async () => {
      const staleDate = new Date();
      staleDate.setHours(staleDate.getHours() - 25); // 25 hours ago
      const staleRecord = {
        id: 1,
        repo: 7.75,
        prime: 11.25,
        updatedAt: staleDate,
      };
      mockRepository.findLatest.mockResolvedValueOnce(staleRecord);
      mockSarbClient.fetchSarbRates.mockResolvedValueOnce({
        repo: 8.25,
        prime: 11.75,
      });
      const newRecord = {
        id: 2,
        repo: 8.25,
        prime: 11.75,
        updatedAt: new Date(),
      };
      mockRepository.save.mockResolvedValueOnce(newRecord);

      const result = await service.getLatestRates();

      expect(mockSarbClient.fetchSarbRates).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith({
        repo: 8.25,
        prime: 11.75,
      });
      expect(result.repo).toBe(8.25);
      expect(result.prime).toBe(11.75);
    });

    it("should return stale cached rates when SARB fetch fails", async () => {
      const staleDate = new Date();
      staleDate.setHours(staleDate.getHours() - 25);
      const staleRecord = {
        id: 1,
        repo: 7.75,
        prime: 11.25,
        updatedAt: staleDate,
      };
      mockRepository.findLatest.mockResolvedValueOnce(staleRecord);
      mockSarbClient.fetchSarbRates.mockRejectedValueOnce(
        new Error("SARB unavailable")
      );

      const result = await service.getLatestRates();

      expect(result).toEqual({
        repo: 7.75,
        prime: 11.25,
        updated: staleDate.toISOString(),
      });
    });

    it("should throw when no cached rates exist and SARB fetch fails", async () => {
      mockRepository.findLatest.mockResolvedValueOnce(null);
      mockSarbClient.fetchSarbRates.mockRejectedValueOnce(
        new Error("SARB unavailable")
      );

      await expect(service.getLatestRates()).rejects.toThrow(
        /unable to retrieve rates/i
      );
    });

    it("should fetch from SARB when DB is unavailable for reads", async () => {
      mockRepository.findLatest.mockRejectedValueOnce(
        new Error("DB connection refused")
      );
      mockSarbClient.fetchSarbRates.mockResolvedValueOnce({
        repo: 8.25,
        prime: 11.75,
      });
      mockRepository.save.mockRejectedValueOnce(
        new Error("DB connection refused")
      );

      const result = await service.getLatestRates();

      expect(mockSarbClient.fetchSarbRates).toHaveBeenCalledOnce();
      expect(result.repo).toBe(8.25);
      expect(result.prime).toBe(11.75);
    });

    it("should return SARB rates even when DB save fails", async () => {
      mockRepository.findLatest.mockResolvedValueOnce(null);
      mockSarbClient.fetchSarbRates.mockResolvedValueOnce({
        repo: 8.25,
        prime: 11.75,
      });
      mockRepository.save.mockRejectedValueOnce(
        new Error("DB connection refused")
      );

      const result = await service.getLatestRates();

      expect(result.repo).toBe(8.25);
      expect(result.prime).toBe(11.75);
    });

    it("should throw when both DB and SARB are unavailable", async () => {
      mockRepository.findLatest.mockRejectedValueOnce(
        new Error("DB connection refused")
      );
      mockSarbClient.fetchSarbRates.mockRejectedValueOnce(
        new Error("SARB unavailable")
      );

      await expect(service.getLatestRates()).rejects.toThrow(
        /unable to retrieve rates/i
      );
    });
  });
});
