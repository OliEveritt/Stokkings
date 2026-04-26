export interface RateData {
  repo: number;
  prime: number;
  updatedAt: Date;
}

export class RateService {
  async getCurrentRates(): Promise<RateData> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rates`);
      const data = await response.json();
      return {
        repo: data.repo,
        prime: data.prime,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      return {
        repo: 7.75,
        prime: 11.25,
        updatedAt: new Date(),
      };
    }
  }
}
