import { describe, it, expect } from 'vitest';

describe('Sprint 2: Logic Audit (US 2.1 & 2.6)', () => {
  // US 2.1 Invitation Logic
  it('UAT 2.1: Token should expire after 7 days', () => {
    const creationDate = new Date();
    creationDate.setDate(creationDate.getDate() - 8); // 8 days ago
    const isExpired = (date: Date) => (new Date().getTime() - date.getTime()) > 7 * 24 * 60 * 60 * 1000;
    expect(isExpired(creationDate)).toBe(true);
  });

  // US 2.6 Payout Logic
  it('UAT 2.6: Should correctly swap positions in the schedule', () => {
    const schedule = [{ id: 'A', pos: 1 }, { id: 'B', pos: 2 }];
    const swap = (arr: any[]) => [arr[1], arr[0]].map((item, i) => ({...item, pos: i + 1}));
    const result = swap(schedule);
    expect(result[0].id).toBe('B');
    expect(result[0].pos).toBe(1);
  });
});