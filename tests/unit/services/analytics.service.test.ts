import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPayoutHistory, getPayoutSchedule, getPayoutReportData } from '@/services/analytics.service';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    getDocs: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
  };
});

describe('Analytics Service - Payout Projections (US-3.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPayoutHistory', () => {
    it('should return empty array when no payouts exist', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        empty: true,
        docs: [],
        forEach: vi.fn(),
      } as any);

      const result = await getPayoutHistory('group-123');
      expect(result).toEqual([]);
    });

    it('should return formatted payouts when data exists', async () => {
      const mockDocs = {
        empty: false,
        docs: [
          {
            id: 'payout-1',
            data: () => ({
              groupId: 'group-123',
              memberName: 'John Doe',
              amount: 500,
              payoutDate: '2026-04-15',
              status: 'completed',
            }),
          },
          {
            id: 'payout-2',
            data: () => ({
              groupId: 'group-123',
              memberName: 'Jane Smith',
              amount: 750,
              payoutDate: '2026-05-01',
              status: 'completed',
            }),
          },
        ],
        forEach: (fn: any) => {
          mockDocs.docs.forEach(fn);
        },
      } as any;

      vi.mocked(getDocs).mockResolvedValue(mockDocs);

      const result = await getPayoutHistory('group-123');
      expect(result).toHaveLength(2);
      expect(result[0].memberName).toBe('John Doe');
      expect(result[0].amount).toBe(500);
      expect(result[1].memberName).toBe('Jane Smith');
      expect(result[1].amount).toBe(750);
    });
  });

  describe('getPayoutSchedule', () => {
    it('should return empty array when no schedule exists', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        empty: true,
        docs: [],
        forEach: vi.fn(),
      } as any);

      const result = await getPayoutSchedule('group-123');
      expect(result).toEqual([]);
    });

    it('should return formatted schedule with correct ordering', async () => {
      const mockDocs = {
        empty: false,
        docs: [
          {
            id: 'member-1',
            data: () => ({
              groupId: 'group-123',
              name: 'Alice',
              position: 1,
              amount: 500,
              expectedDate: '2026-06-01',
            }),
          },
          {
            id: 'member-2',
            data: () => ({
              groupId: 'group-123',
              name: 'Bob',
              position: 2,
              amount: 500,
              expectedDate: '2026-07-01',
            }),
          },
        ],
        forEach: (fn: any) => {
          mockDocs.docs.forEach(fn);
        },
      } as any;

      vi.mocked(getDocs).mockResolvedValue(mockDocs);

      const result = await getPayoutSchedule('group-123');
      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(1);
      expect(result[0].memberName).toBe('Alice');
      expect(result[1].position).toBe(2);
      expect(result[1].memberName).toBe('Bob');
    });
  });

  describe('getPayoutReportData', () => {
    it('should combine past payouts and upcoming projections', async () => {
      // Mock past payouts
      const mockPayouts = {
        empty: false,
        docs: [{
          id: 'payout-1',
          data: () => ({
            groupId: 'group-123',
            memberName: 'John',
            amount: 500,
            payoutDate: '2026-04-15',
            status: 'completed',
          }),
        }],
        forEach: (fn: any) => { fn(mockPayouts.docs[0]); },
      } as any;

      // Mock schedule
      const mockSchedule = {
        empty: false,
        docs: [{
          id: 'member-1',
          data: () => ({
            groupId: 'group-123',
            name: 'Alice',
            position: 1,
            amount: 500,
            expectedDate: '2026-06-01',
          }),
        }],
        forEach: (fn: any) => { fn(mockSchedule.docs[0]); },
      } as any;

      vi.mocked(getDocs)
        .mockResolvedValueOnce(mockPayouts)
        .mockResolvedValueOnce(mockSchedule);

      const result = await getPayoutReportData('group-123');
      
      expect(result.hasPastPayouts).toBe(true);
      expect(result.pastPayouts).toHaveLength(1);
      expect(result.upcomingProjections).toHaveLength(1);
      expect(result.totalPaidOut).toBe(500);
      expect(result.totalScheduled).toBe(500);
    });

    it('should handle empty state (UAT 2)', async () => {
      const mockEmpty = {
        empty: true,
        docs: [],
        forEach: vi.fn(),
      } as any;

      vi.mocked(getDocs).mockResolvedValue(mockEmpty);

      const result = await getPayoutReportData('group-123');
      
      expect(result.hasPastPayouts).toBe(false);
      expect(result.pastPayouts).toHaveLength(0);
      expect(result.upcomingProjections).toHaveLength(0);
      expect(result.totalPaidOut).toBe(0);
      expect(result.totalScheduled).toBe(0);
      expect(result.nextPayoutDate).toBeNull();
    });

    it('should calculate totals correctly with multiple payouts', async () => {
      const mockPayouts = {
        empty: false,
        docs: [
          { id: 'p1', data: () => ({ amount: 100, memberName: 'A', payoutDate: '2026-01-01', status: 'completed' }) },
          { id: 'p2', data: () => ({ amount: 200, memberName: 'B', payoutDate: '2026-02-01', status: 'completed' }) },
          { id: 'p3', data: () => ({ amount: 300, memberName: 'C', payoutDate: '2026-03-01', status: 'completed' }) },
        ],
        forEach: (fn: any) => { mockPayouts.docs.forEach(fn); },
      } as any;

      const mockSchedule = {
        empty: false,
        docs: [
          { id: 's1', data: () => ({ amount: 400, name: 'D', position: 1, expectedDate: '2026-06-01' }) },
          { id: 's2', data: () => ({ amount: 400, name: 'E', position: 2, expectedDate: '2026-07-01' }) },
        ],
        forEach: (fn: any) => { mockSchedule.docs.forEach(fn); },
      } as any;

      vi.mocked(getDocs)
        .mockResolvedValueOnce(mockPayouts)
        .mockResolvedValueOnce(mockSchedule);

      const result = await getPayoutReportData('group-123');
      
      expect(result.totalPaidOut).toBe(600);
      expect(result.totalScheduled).toBe(800);
    });
  });
});
