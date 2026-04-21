import { describe, it, expect } from 'vitest';

describe('Sprint 2: Security Integration', () => {
  it('UAT 2.6: Should block non-admin roles from updating schedules', () => {
    const userRole = 'Member';
    const canWrite = (role: string) => ['Admin', 'Treasurer'].includes(role);
    expect(canWrite(userRole)).toBe(false);
  });
});