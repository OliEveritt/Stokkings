import { describe, it, expect } from 'vitest';

// Business Logic: Invitations expire after 7 days
const isTokenExpired = (createdAt: string) => {
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(new Date(createdAt).getTime() + sevenDaysInMs);
  return new Date() > expiryDate;
};

describe('US 2.1: Member Onboarding Logic', () => {
  it('should validate a fresh token', () => {
    const today = new Date().toISOString();
    expect(isTokenExpired(today)).toBe(false);
  });

  it('should invalidate a token older than 7 days', () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    
    expect(isTokenExpired(eightDaysAgo.toISOString())).toBe(true);
  });
});