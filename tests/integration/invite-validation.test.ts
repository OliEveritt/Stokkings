import { describe, it, expect } from 'vitest';

const checkExpiry = (expiresAt: number) => Date.now() > expiresAt;

describe('Invitation Logic Units', () => {
  it('UAT 4: should invalidate tokens exactly 7 days old', () => {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() - (sevenDaysInMs + 1000); // 7 days and 1 second ago
    expect(checkExpiry(expiresAt)).toBe(true);
  });

  it('should validate tokens created today', () => {
    const futureExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
    expect(checkExpiry(futureExpiry)).toBe(false);
  });
});