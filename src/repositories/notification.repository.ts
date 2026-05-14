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
   expiresAt?: string;
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

    // Notifications expire after 7 days
    const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

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
        expiresAt: expiresAt.toISOString(),
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

    const now = new Date().toISOString();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationRecord))
      .filter((n) => !n.expiresAt || n.expiresAt > now);
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