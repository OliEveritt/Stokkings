import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export interface NotificationRecord {
  id: string;
  userId: string;
  type: "meeting_scheduled" | "meeting_updated";
  message: string;
  meetingId: string;
  groupId: string;
  read: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

export const notificationRepository = {
  async createForMembers(params: {
    groupId: string;
    meetingId: string;
    type: "meeting_scheduled" | "meeting_updated";
    message: string;
    memberIds: string[];
  }): Promise<void> {
    const db = getAdminDb();
    const batch = db.batch();

    for (const userId of params.memberIds) {
      const ref = db.collection("notifications").doc();
      batch.set(ref, {
        userId,
        type: params.type,
        message: params.message,
        meetingId: params.meetingId,
        groupId: params.groupId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  },

  async getForUser(userId: string): Promise<NotificationRecord[]> {
    const db = getAdminDb();
    const snap = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationRecord));
  },

  async markAsRead(notificationId: string): Promise<void> {
    const db = getAdminDb();
    await db.collection("notifications").doc(notificationId).update({ read: true });
  },

  async markAllAsRead(userId: string): Promise<void> {
    const db = getAdminDb();
    const snap = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();

    const batch = db.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  },
};