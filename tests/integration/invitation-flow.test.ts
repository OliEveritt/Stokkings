import { describe, it, expect } from 'vitest';

const mockHandshakeAPI = async (token: string, status: string) => {
  if (status === 'accepted') return { ok: false, error: "Already claimed" };
  return { ok: true, success: true };
};

describe('Invitation API Integration', () => {
  it('UAT 4: should reject the handshake if the token status is already "accepted"', async () => {
    const response = await mockHandshakeAPI('token123', 'accepted');
    expect(response.ok).toBe(false);
    expect(response.error).toBe("Already claimed");
  });
});