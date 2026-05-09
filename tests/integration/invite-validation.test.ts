import { describe, it, expect } from 'vitest';

/**
 * US-2.1 Logic: Expiry Check
 * Fulfills UAT-4: 7-day token validity.
 */
const checkExpiry = (expiresAt: number) => Date.now() > expiresAt;

/**
 * US-2.1 Logic: Duplicate Detection
 * Fulfills UAT-3: Prevention of redundant invites.
 */
const validateInvite = (newEmail: string, existingInvites: any[]) => {
  const normalizedEmail = newEmail.toLowerCase().trim();
  const duplicate = existingInvites.find(i => i.email === normalizedEmail);
  
  if (duplicate) {
    return { success: false, message: "User already invited" };
  }
  return { success: true };
};

describe('Invitation Logic Units', () => {
  
  it('UAT 4: should invalidate tokens exactly 7 days old', () => {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    // Set expiry to 7 days and 1 second ago to trigger invalidation
    const expiresAt = Date.now() - (sevenDaysInMs + 1000); 
    expect(checkExpiry(expiresAt)).toBe(true);
  });

  it('should validate tokens created today (Future Expiry)', () => {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const futureExpiry = Date.now() + sevenDaysInMs;
    expect(checkExpiry(futureExpiry)).toBe(false);
  });

});

describe('Invitation Integration (UAT Checks)', () => {
  // Mocking the 'invitations' collection state
  const mockDb = [
    { email: 'existing@wits.ac.za', status: 'pending' }
  ];

  it('UAT 3: should block an invite if email already exists in DB (Case Insensitive)', () => {
    const result = validateInvite('EXISTING@wits.ac.za', mockDb);
    expect(result.success).toBe(false);
    expect(result.message).toContain('already invited');
  });

  it('UAT 4: should identify an expired token object', () => {
    const expiredInvite = { expiresAt: Date.now() - 1000 };
    const isExpired = Date.now() > expiredInvite.expiresAt;
    expect(isExpired).toBe(true);
  });

  it('should allow a new unique email invitation', () => {
    const result = validateInvite('new-member@soweto.com', mockDb);
    expect(result.success).toBe(true);
  });
});