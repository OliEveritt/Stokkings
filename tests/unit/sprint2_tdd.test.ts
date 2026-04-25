import { describe, it, expect } from 'vitest';
import { calculateExpectedDate, validateInviteToken } from '@/lib/sprint2-logic';

describe('TDD Cycle: US 2.1A & 2.6', () => {
  
  // US 2.1A: Invitation Security
  it('should reject tokens that do not follow the UUID format', () => {
    const invalidToken = "not-a-uuid-123";
    expect(validateInviteToken(invalidToken)).toBe(false);
  });

  // US 2.6: Payout Date Projection (Finance Logic)
  it('should project the next month date for quarterly payouts', () => {
    const baseDate = "2026-05-25";
    const frequency = "quarterly";
    const nextDate = calculateExpectedDate(baseDate, frequency);
    expect(nextDate).toBe("2026-08-25"); // 3 months later
  });
});