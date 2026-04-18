import type { RateRepository } from "@/repositories/rate.repository";
import type { Rates } from "@/types";

interface SarbClient {
  fetchSarbRates(): Promise<{ repo: number; prime: number }>;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export class RateService {
  constructor(
    private repository: RateRepository,
    private sarbClient: SarbClient
  ) {}

  async getLatestRates(): Promise<Rates> {
    let cached: { repo: number; prime: number; updatedAt: Date } | null = null;

    try {
      cached = await this.repository.findLatest();
    } catch {
      // DB unavailable — fall through to SARB fetch
    }

    const isFresh =
      cached &&
      Date.now() - cached.updatedAt.getTime() < STALE_THRESHOLD_MS;

    if (cached && isFresh) {
      return this.toRates(cached);
    }

    // Stale or missing — try fetching fresh rates
    try {
      const fresh = await this.sarbClient.fetchSarbRates();

      // Attempt to cache, but don't fail if DB is down
      try {
        const saved = await this.repository.save(fresh);
        return this.toRates(saved);
      } catch {
        return {
          repo: fresh.repo,
          prime: fresh.prime,
          updated: new Date().toISOString(),
        };
      }
    } catch {
      // If we have stale data, return it as fallback
      if (cached) {
        return this.toRates(cached);
      }
      throw new Error("Unable to retrieve rates");
    }
  }

  private toRates(record: { repo: number; prime: number; updatedAt: Date }): Rates {
    return {
      repo: record.repo,
      prime: record.prime,
      updated: record.updatedAt.toISOString(),
    };
  }
}
