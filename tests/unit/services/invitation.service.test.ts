import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvitationService } from '@/services/invitation.service';
import * as firestore from 'firebase/firestore';

// 1. Mock the internal firebase lib to prevent config errors
vi.mock('@/lib/firebase', () => ({
  db: {} 
}));

// 2. Comprehensive Firestore Mocking
vi.mock('firebase/firestore', () => {
  class Timestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() { return new Date(this.seconds * 1000); }
    static fromDate(date: Date) {
      return new Timestamp(Math.floor(date.getTime() / 1000), 0);
    }
  }

  return {
    doc: vi.fn((_db, ...segments) => ({ path: segments.join('/') })),
    getDoc: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    Timestamp,
  };
});

describe('InvitationService Coverage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- isExpired() unit tests ---

  it('UAT 4: detects expired invitations correctly', () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    expect(InvitationService.isExpired(eightDaysAgo)).toBe(true);
  });

  it('validates active invitations using Timestamp (UAT 4 path)', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(InvitationService.isExpired(tomorrow)).toBe(false);
  });

  // --- acceptInvitation() transaction tests ---

  it('covers the internal transaction logic (UAT 2 & 3)', async () => {
    const mockedRunTransaction = vi.mocked(firestore.runTransaction);

    mockedRunTransaction.mockImplementationOnce(async (_db, callback) => {
      const mockTx = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.path.includes('group_members')) {
            return { exists: () => false };
          }
          return {
            exists: () => true,
            data: () => ({
              status: 'pending',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }),
          };
        }),
        update: vi.fn(),
        set: vi.fn(),
      };
      return await callback(mockTx);
    });

    const result = await InvitationService.acceptInvitation({
      token: 'valid-token',
      userId: 'user-123',
      groupId: 'group-456',
      email: 'test@wits.ac.za',
      firstName: 'Aubrey',
      surname: 'M',
    });

    expect(result.success).toBe(true);
    expect(mockedRunTransaction).toHaveBeenCalled();
  });

  it('throws when invitation is already accepted (UAT 2)', async () => {
    const mockedRunTransaction = vi.mocked(firestore.runTransaction);

    mockedRunTransaction.mockImplementationOnce(async (_db, callback) => {
      const mockTx = {
        get: vi.fn().mockReturnValue({
          exists: () => true,
          data: () => ({
            status: 'accepted',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }),
        }),
        update: vi.fn(),
        set: vi.fn(),
      };
      return await callback(mockTx);
    });

    await expect(
      InvitationService.acceptInvitation({
        token: 'used-token',
        userId: 'user-123',
        groupId: 'group-456',
        email: 'test@wits.ac.za',
        firstName: 'Aubrey',
        surname: 'M',
      })
    ).rejects.toThrow('This invitation has already been claimed');
  });

  it('throws when invitation is expired (UAT 4)', async () => {
    const mockedRunTransaction = vi.mocked(firestore.runTransaction);

    mockedRunTransaction.mockImplementationOnce(async (_db, callback) => {
      const mockTx = {
        get: vi.fn().mockReturnValue({
          exists: () => true,
          data: () => ({
            status: 'pending',
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          }),
        }),
        update: vi.fn(),
        set: vi.fn(),
      };
      return await callback(mockTx);
    });

    await expect(
      InvitationService.acceptInvitation({
        token: 'expired-token',
        userId: 'user-123',
        groupId: 'group-456',
        email: 'test@wits.ac.za',
        firstName: 'Aubrey',
        surname: 'M',
      })
    ).rejects.toThrow('This invitation link has expired (7-day limit)');
  });

  it('throws when user is already a member (UAT 3)', async () => {
    const mockedRunTransaction = vi.mocked(firestore.runTransaction);

    mockedRunTransaction.mockImplementationOnce(async (_db, callback) => {
      const mockTx = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.path.includes('group_members')) {
            return { exists: () => true };
          }
          return {
            exists: () => true,
            data: () => ({
              status: 'pending',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }),
          };
        }),
        update: vi.fn(),
        set: vi.fn(),
      };
      return await callback(mockTx);
    });

    await expect(
      InvitationService.acceptInvitation({
        token: 'valid-token',
        userId: 'user-123',
        groupId: 'group-456',
        email: 'test@wits.ac.za',
        firstName: 'Aubrey',
        surname: 'M',
      })
    ).rejects.toThrow('User is already a member of this group');
  });

  it('throws when invitation is not found', async () => {
    const mockedRunTransaction = vi.mocked(firestore.runTransaction);

    mockedRunTransaction.mockImplementationOnce(async (_db, callback) => {
      const mockTx = {
        get: vi.fn().mockReturnValue({ exists: () => false }),
        update: vi.fn(),
        set: vi.fn(),
      };
      return await callback(mockTx);
    });

    await expect(
      InvitationService.acceptInvitation({
        token: 'ghost-token',
        userId: 'user-123',
        groupId: 'group-456',
        email: 'test@wits.ac.za',
        firstName: 'Aubrey',
        surname: 'M',
      })
    ).rejects.toThrow('Invitation not found');
  });
});