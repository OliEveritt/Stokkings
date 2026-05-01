import { describe, it, expect } from 'vitest';
import { 
  calculateExpectedDate, 
  validateInviteToken, 
  calculateProRataContribution 
} from '@/lib/sprint2-logic';

describe('Sprint 2 TDD Suite: US 2.1 (Invites) & US 2.6 (Payouts)', () => {
  
  /**
   * US 2.1: Invitation Security Logic
   */
  describe('Invitation Security (US 2.1)', () => {
    it('should accept a valid UUID v4 token', () => {
      const validToken = "550e8400-e29b-41d4-a716-446655440000";
      expect(validateInviteToken(validToken)).toBe(true);
    });

    it('should reject tokens that do not follow the UUID format', () => {
      const invalidToken = "stokkings-invite-123";
      expect(validateInviteToken(invalidToken)).toBe(false);
    });

    it('should reject empty or null tokens', () => {
      expect(validateInviteToken("")).toBe(false);
    });
  });

  /**
   * US 2.6: Financial Projection Logic (Banking Metrics)
   */
  describe('Payout Date Projection (US 2.6)', () => {
    it('should project the correct date for monthly cycles', () => {
      const baseDate = "2026-05-25";
      const frequency = "monthly";
      expect(calculateExpectedDate(baseDate, frequency)).toBe("2026-06-25");
    });

    it('should project 3 months ahead for quarterly payouts', () => {
      const baseDate = "2026-05-25";
      const frequency = "quarterly";
      expect(calculateExpectedDate(baseDate, frequency)).toBe("2026-08-25");
    });

    it('should handle end-of-year rollovers correctly', () => {
      const baseDate = "2026-11-15";
      const frequency = "quarterly";
      expect(calculateExpectedDate(baseDate, frequency)).toBe("2027-02-15");
    });
  });

  /**
   * US 2.2: Prorated Contributions (NII/NIR Logic)
   * Essential for banking performance measurement.
   */
  describe('Banking Performance Metrics', () => {
    it('should calculate the correct contribution for a partial month', () => {
      const monthlyTarget = 1000;
      const daysActive = 15;
      const daysInMonth = 30;
      // Expected: (1000 / 30) * 15 = 500
      expect(calculateProRataContribution(monthlyTarget, daysActive, daysInMonth)).toBe(500);
    });
  });
});