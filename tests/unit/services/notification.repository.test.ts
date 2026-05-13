import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase-admin before imports
vi.mock("@/lib/firebase-admin", () => {
  const mockDocRef = {
    id: "generated-id",
    update: vi.fn().mockResolvedValue(undefined),
  };

  const mockBatch = {
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };

  const mockCollection = vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnValue(mockDocRef),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ docs: [] }),
  });

  return {
    getAdminDb: vi.fn(() => ({
      collection: mockCollection,
      doc: vi.fn().mockReturnValue(mockDocRef),
      batch: vi.fn().mockReturnValue(mockBatch),
    })),
  };
});

import { notificationRepository } from "@/repositories/notification.repository";

describe("notificationRepository", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createForMembers ─────────────────────────────────────────────────────

  describe("createForMembers", () => {
    it("does not throw when memberIds is empty — boundary: 0 members", async () => {
      await expect(
        notificationRepository.createForMembers({
          groupId: "g1",
          meetingId: "m1",
          type: "meeting_scheduled",
          message: "Test",
          memberIds: [],
        })
      ).resolves.not.toThrow();
    });

    it("resolves successfully for a single member — boundary: 1 member", async () => {
      await expect(
        notificationRepository.createForMembers({
          groupId: "g1",
          meetingId: "m1",
          type: "meeting_scheduled",
          message: "New meeting",
          memberIds: ["u1"],
        })
      ).resolves.not.toThrow();
    });

    it("resolves successfully for multiple members", async () => {
      await expect(
        notificationRepository.createForMembers({
          groupId: "g1",
          meetingId: "m1",
          type: "meeting_scheduled",
          message: "New meeting",
          memberIds: ["u1", "u2", "u3"],
        })
      ).resolves.not.toThrow();
    });

    it("accepts meeting_scheduled type", async () => {
      await expect(
        notificationRepository.createForMembers({
          groupId: "g1",
          meetingId: "m1",
          type: "meeting_scheduled",
          message: "Scheduled",
          memberIds: ["u1"],
        })
      ).resolves.not.toThrow();
    });

    it("accepts meeting_updated type", async () => {
      await expect(
        notificationRepository.createForMembers({
          groupId: "g1",
          meetingId: "m1",
          type: "meeting_updated",
          message: "Updated",
          memberIds: ["u1"],
        })
      ).resolves.not.toThrow();
    });

    it("resolves for large group — boundary: 20 members", async () => {
      const memberIds = Array.from({ length: 20 }, (_, i) => `u${i}`);
      await expect(
        notificationRepository.createForMembers({
          groupId: "g1",
          meetingId: "m1",
          type: "meeting_scheduled",
          message: "AGM",
          memberIds,
        })
      ).resolves.not.toThrow();
    });
  });

  // ── getForUser ───────────────────────────────────────────────────────────

  describe("getForUser", () => {
    it("returns empty array when user has no notifications — boundary: 0", async () => {
      const result = await notificationRepository.getForUser("u1");
      expect(result).toEqual([]);
    });

    it("returns array type always", async () => {
      const result = await notificationRepository.getForUser("u1");
      expect(Array.isArray(result)).toBe(true);
    });

    it("does not throw for unknown userId", async () => {
      await expect(
        notificationRepository.getForUser("non-existent-user")
      ).resolves.not.toThrow();
    });
  });

  // ── markAsRead ───────────────────────────────────────────────────────────

  describe("markAsRead", () => {
    it("resolves without error for a valid notification ID", async () => {
      await expect(
        notificationRepository.markAsRead("notif-123")
      ).resolves.not.toThrow();
    });

    it("resolves without error for any string ID — equivalence: any ID", async () => {
      await expect(
        notificationRepository.markAsRead("any-id-here")
      ).resolves.not.toThrow();
    });
  });

  // ── markAllAsRead ────────────────────────────────────────────────────────

  describe("markAllAsRead", () => {
    it("resolves without error when user has no unread notifications — boundary: 0", async () => {
      await expect(
        notificationRepository.markAllAsRead("u1")
      ).resolves.not.toThrow();
    });

    it("resolves without error for any userId", async () => {
      await expect(
        notificationRepository.markAllAsRead("any-user")
      ).resolves.not.toThrow();
    });
  });
});