import { notificationRepository } from "@/repositories/notification.repository";
import { getAdminDb } from "@/lib/firebase-admin";

export class NotificationService {
  /**
   * Fetches all member IDs for a group from group_members subcollection.
   */
  async getGroupMemberIds(groupId: string): Promise<string[]> {
    const db = getAdminDb();
    const snap = await db.collection(`groups/${groupId}/group_members`).get();
    return snap.docs.map((d) => d.id);
  }

  /**
   * UAT 1: Notify all members when a meeting is scheduled.
   */
  async notifyMeetingScheduled(params: {
    groupId: string;
    meetingId: string;
    date: string;
    time: string;
    agenda: string;
  }): Promise<void> {
    const memberIds = await this.getGroupMemberIds(params.groupId);
    if (memberIds.length === 0) return;

    await notificationRepository.createForMembers({
      groupId: params.groupId,
      meetingId: params.meetingId,
      type: "meeting_scheduled",
      message: `📅 New meeting scheduled for ${params.date} at ${params.time}. Agenda: ${params.agenda}`,
      memberIds,
    });
  }

  /**
   * UAT 2: Notify all members when a meeting is updated.
   */
  async notifyMeetingUpdated(params: {
    groupId: string;
    meetingId: string;
    date: string;
    time: string;
  }): Promise<void> {
    const memberIds = await this.getGroupMemberIds(params.groupId);
    if (memberIds.length === 0) return;

    await notificationRepository.createForMembers({
      groupId: params.groupId,
      meetingId: params.meetingId,
      type: "meeting_updated",
      message: `🔔 Meeting rescheduled to ${params.date} at ${params.time}.`,
      memberIds,
    });
  }
}

export const notificationService = new NotificationService();