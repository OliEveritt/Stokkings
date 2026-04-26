import { describe, it, expect, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

// Mocking the behavior we built in your Onboarding Center
const createInviteLogic = (email: string, groupId: string) => {
  return {
    email: email.toLowerCase().trim(),
    groupId,
    token: uuidv4(),
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
  };
};

describe('Invitation Unit Logic', () => {
  it('should normalize emails to lowercase', () => {
    const invite = createInviteLogic('AUBREY@Wits.ac.za', 'Stokvel_001');
    expect(invite.email).toBe('aubrey@wits.ac.za');
  });

  it('should generate a valid 36-character UUID token', () => {
    const invite = createInviteLogic('test@test.com', 'group1');
    expect(invite.token).toHaveLength(36);
  });

  it('should set an expiry date exactly 7 days in the future', () => {
    const invite = createInviteLogic('test@test.com', 'group1');
    const daysDiff = Math.round((invite.expiresAt - invite.createdAt) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(7);
  });
});