import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ docs: [] }),
    })),
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
    })),
  })),
}));

vi.mock("@/repositories/notification.repository", () => ({
  notificationRepository: {
    createForMembers: vi.fn().mockResolvedValue(undefined),
    getForUser: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
  },
}));

import { NotificationService } from "@/services/notification.service";
import * as repo from "@/repositories/notification.repository";

const mockedRepo = vi.mocked(repo.notificationRepository);

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.clearAllMocks();
  });

  // ── notifyMeetingScheduled ───────────────────────────────────────────────

  describe("notifyMeetingScheduled", () => {
    it("does nothing when group has no members — boundary: 0 members", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue([]);
      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00", agenda: "Test"
      });
      expect(mockedRepo.createForMembers).not.toHaveBeenCalled();
    });

    it("creates notification for exactly 1 member — boundary: single member", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00", agenda: "Solo"
      });
      expect(mockedRepo.createForMembers).toHaveBeenCalledOnce();
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.memberIds).toHaveLength(1);
    });

    it("creates notifications for all members — UAT 1", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1", "u2", "u3"]);
      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00", agenda: "Budget review"
      });
      expect(mockedRepo.createForMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "meeting_scheduled",
          memberIds: ["u1", "u2", "u3"],
          meetingId: "m1",
          groupId: "g1",
        })
      );
    });

    it("creates notifications for large group — boundary: 20 members", async () => {
      const members = Array.from({ length: 20 }, (_, i) => `u${i}`);
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(members);
      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00", agenda: "AGM"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.memberIds).toHaveLength(20);
    });

    it("includes date, time and agenda in message", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00", agenda: "Budget"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.message).toContain("2026-06-01");
      expect(call.message).toContain("10:00");
      expect(call.message).toContain("Budget");
    });

    it("uses correct notification type — meeting_scheduled", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00", agenda: "Test"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.type).toBe("meeting_scheduled");
    });

    it("passes correct meetingId and groupId", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingScheduled({
        groupId: "group-abc", meetingId: "meeting-xyz", date: "2026-06-01", time: "09:00", agenda: "Review"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.groupId).toBe("group-abc");
      expect(call.meetingId).toBe("meeting-xyz");
    });

    it("handles agenda with special characters", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00",
        agenda: "Budget & Finance: Q2 Review (R500,000)"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.message).toContain("Budget & Finance");
    });

    it("calls createForMembers exactly once per invocation", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1", "u2"]);
      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00", agenda: "Test"
      });
      expect(mockedRepo.createForMembers).toHaveBeenCalledTimes(1);
    });
  });

  // ── notifyMeetingUpdated ─────────────────────────────────────────────────

  describe("notifyMeetingUpdated", () => {
    it("does nothing when group has no members — boundary: 0 members", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue([]);
      await service.notifyMeetingUpdated({
        groupId: "g1", meetingId: "m1", date: "2026-06-02", time: "11:00"
      });
      expect(mockedRepo.createForMembers).not.toHaveBeenCalled();
    });

    it("creates notification for exactly 1 member — boundary: single member", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingUpdated({
        groupId: "g1", meetingId: "m1", date: "2026-06-02", time: "11:00"
      });
      expect(mockedRepo.createForMembers).toHaveBeenCalledOnce();
    });

    it("creates notifications for all members — UAT 2", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1", "u2"]);
      await service.notifyMeetingUpdated({
        groupId: "g1", meetingId: "m1", date: "2026-06-02", time: "11:00"
      });
      expect(mockedRepo.createForMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "meeting_updated",
          memberIds: ["u1", "u2"],
        })
      );
    });

    it("includes new date and time in message", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingUpdated({
        groupId: "g1", meetingId: "m1", date: "2026-06-02", time: "11:00"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.message).toContain("2026-06-02");
      expect(call.message).toContain("11:00");
    });

    it("uses correct notification type — meeting_updated", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingUpdated({
        groupId: "g1", meetingId: "m1", date: "2026-06-02", time: "11:00"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.type).toBe("meeting_updated");
    });

    it("passes correct meetingId and groupId", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingUpdated({
        groupId: "group-abc", meetingId: "meeting-xyz", date: "2026-06-02", time: "11:00"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.groupId).toBe("group-abc");
      expect(call.meetingId).toBe("meeting-xyz");
    });

    it("handles midnight time — boundary: 00:00", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingUpdated({
        groupId: "g1", meetingId: "m1", date: "2026-06-02", time: "00:00"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.message).toContain("00:00");
    });

    it("handles end of day time — boundary: 23:59", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      await service.notifyMeetingUpdated({
        groupId: "g1", meetingId: "m1", date: "2026-06-02", time: "23:59"
      });
      const call = mockedRepo.createForMembers.mock.calls[0][0];
      expect(call.message).toContain("23:59");
    });
  });

  // ── getGroupMemberIds ────────────────────────────────────────────────────

  describe("getGroupMemberIds", () => {
    it("returns empty array when group has no members — boundary: 0", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue([]);
      const result = await service.getGroupMemberIds("empty-group");
      expect(result).toEqual([]);
    });

    it("returns single member ID — boundary: 1 member", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);
      const result = await service.getGroupMemberIds("g1");
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("u1");
    });

    it("returns multiple member IDs", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1", "u2", "u3"]);
      const result = await service.getGroupMemberIds("g1");
      expect(result).toHaveLength(3);
    });

    it("returns correct member IDs", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["alice", "bob"]);
      const result = await service.getGroupMemberIds("g1");
      expect(result).toContain("alice");
      expect(result).toContain("bob");
    });
  });

  // ── notification type equivalence ────────────────────────────────────────

  describe("notification type equivalence", () => {
    it("scheduled and updated produce different notification types", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1"]);

      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00", agenda: "Test"
      });
      await service.notifyMeetingUpdated({
        groupId: "g1", meetingId: "m1", date: "2026-06-02", time: "11:00"
      });

      expect(mockedRepo.createForMembers).toHaveBeenCalledTimes(2);
      expect(mockedRepo.createForMembers.mock.calls[0][0].type).toBe("meeting_scheduled");
      expect(mockedRepo.createForMembers.mock.calls[1][0].type).toBe("meeting_updated");
    });

    it("multiple meetings produce independent notifications", async () => {
      vi.spyOn(service, "getGroupMemberIds").mockResolvedValue(["u1", "u2"]);

      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m1", date: "2026-06-01", time: "10:00", agenda: "First"
      });
      await service.notifyMeetingScheduled({
        groupId: "g1", meetingId: "m2", date: "2026-07-01", time: "14:00", agenda: "Second"
      });

      expect(mockedRepo.createForMembers).toHaveBeenCalledTimes(2);
      expect(mockedRepo.createForMembers.mock.calls[0][0].meetingId).toBe("m1");
      expect(mockedRepo.createForMembers.mock.calls[1][0].meetingId).toBe("m2");
    });
  });
});