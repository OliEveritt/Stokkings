import { db } from "@/lib/firebase";
import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';

export class InvitationService {
  /**
   * Logical check for the 7-day limit (UAT 4)
   */
  static isExpired(expiresAt: Timestamp | Date): boolean {
    const expiryDate = expiresAt instanceof Timestamp ? expiresAt.toDate() : expiresAt;
    return new Date() > expiryDate;
  }

  /**
   * Core Handshake logic (UAT 2, 3, & 4)
   */
  static async acceptInvitation(params: {
    token: string,
    userId: string,
    groupId: string,
    email: string,
    firstName: string,
    surname: string
  }) {
    const inviteRef = doc(db, "invitations", params.token);
    const memberRef = doc(db, "groups", params.groupId, "group_members", params.userId);

    return await runTransaction(db, async (transaction) => {
      const inviteSnap = await transaction.get(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error("Invitation not found");
      }

      const inviteData = inviteSnap.data();

      // UAT 4: Check if already claimed
      if (inviteData.status === 'accepted') {
        throw new Error("This invitation has already been claimed");
      }

      // UAT 4: 7-Day Expiry Check
      if (this.isExpired(inviteData.expiresAt)) {
        throw new Error("This invitation link has expired (7-day limit)");
      }

      // UAT 3: Duplicate Detection
      const memberSnap = await transaction.get(memberRef);
      if (memberSnap.exists()) {
        throw new Error("User is already a member of this group");
      }

      // 3. Perform the Handshake
      transaction.update(inviteRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: params.userId
      });

      transaction.set(memberRef, {
        userId: params.userId,
        email: params.email,
        fullName: `${params.firstName} ${params.surname}`,
        role: 'Member',
        joinedAt: serverTimestamp()
      });

      return { success: true };
    });
  }
}