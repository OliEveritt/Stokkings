import { notificationRepository } from "@/repositories/notification.repository";
import { getAdminDb } from "@/lib/firebase-admin";

export class NotificationService {
  /**
   * Fetches all member IDs from the group's members array.
   * Uses root-level members array since group_members subcollection
   * may not contain all members.
   */
  async getGroupMemberIds(groupId: string): Promise<string[]> {
    const db = getAdminDb();
    const groupSnap = await db.doc(`groups/${groupId}`).get();
    if (!groupSnap.exists) return [];
    const members = groupSnap.data()?.members as string[] ?? [];
    return members;
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