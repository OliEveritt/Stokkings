import { v4 as uuidv4 } from 'uuid';
import { describe, it, expect } from 'vitest';

describe('Invitation Unit Tests (TDD)', () => {
  it('should generate a valid UUID for the invitation token', () => {
    const token = uuidv4();
    expect(token).toHaveLength(36);
    expect(token).toMatch(/^[0-9a-fA-F-]{36}$/);
  });

  it('should calculate an expiry date exactly 7 days in the future', () => {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + 7);
    
    // Check that the difference is 7 days (604800000 ms)
    const diff = expiresAt.getTime() - now.getTime();
    expect(Math.round(diff / 1000)).toBe(604800); 
  });
});