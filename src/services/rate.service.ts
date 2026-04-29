import { fetchSarbRates, type SarbRates } from '@/lib/sarb-client';
import { rateRepository } from '@/repositories/rate.repository';

// In-memory cache for the current session
let cachedRates: SarbRates | null = null;
let lastCacheTime: Date | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export class RateService {
  async getCurrentRates(): Promise<SarbRates> {
    // Check in-memory cache first
    if (cachedRates && lastCacheTime && (Date.now() - lastCacheTime.getTime()) < CACHE_DURATION) {
      console.log('Returning rates from memory cache');
      return cachedRates;
    }

    // Try to get from stored repository (latest)
    const latestFromDb = await rateRepository.findLatest();
    
    // If we have a recent record (less than 1 hour old), use it
    if (latestFromDb && latestFromDb.fetchedAt) {
      const dbAge = Date.now() - latestFromDb.fetchedAt.getTime();
      if (dbAge < CACHE_DURATION) {
        console.log('Returning rates from stored history');
        cachedRates = {
          repo: latestFromDb.repoRate,
          prime: latestFromDb.primeRate,
          updatedAt: latestFromDb.fetchedAt,
        };
        lastCacheTime = new Date();
        return cachedRates;
      }
    }

    // Fetch fresh rates from API
    console.log('Fetching fresh rates from API Ninjas');
    const freshRates = await fetchSarbRates();
    
    // Save to repository for history
    await rateRepository.save({
      repo: freshRates.repo,
      prime: freshRates.prime,
      source: 'api-ninjas',
    });
    
    // Update memory cache
    cachedRates = freshRates;
    lastCacheTime = new Date();
    
    return freshRates;
  }

  async getRateHistory(days: number = 30): Promise<any[]> {
    return await rateRepository.findHistory(days);
  }

  async refreshRates(): Promise<SarbRates> {
    // Force refresh from API
    console.log('Force refreshing rates from API Ninjas');
    const freshRates = await fetchSarbRates();
    
    await rateRepository.save({
      repo: freshRates.repo,
      prime: freshRates.prime,
      source: 'api-ninjas-manual',
    });
    
    cachedRates = freshRates;
    lastCacheTime = new Date();
    
    return freshRates;
  }
}

export const rateService = new RateService();