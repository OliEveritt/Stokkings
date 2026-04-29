export interface RateRecord {
  repoRate: number;
  primeRate: number;
  fetchedAt: Date;
}

// In-memory storage (no database needed)
let storedRates: RateRecord | null = null;

export const rateRepository = {
  async save(data: { repo: number; prime: number; source?: string }): Promise<RateRecord> {
    const record: RateRecord = {
      repoRate: data.repo,
      primeRate: data.prime,
      fetchedAt: new Date(),
    };
    storedRates = record;
    return record;
  },

  async findLatest(): Promise<RateRecord | null> {
    return storedRates;
  },

  async findHistory(limit: number = 30): Promise<RateRecord[]> {
    return storedRates ? [storedRates] : [];
  },
};