"use server";

import { db } from "@/lib/firebase";
import { 
  doc, 
  setDoc, 
  getDoc,
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion 
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export async function createInvitation(email: string, groupId: string, adminId: string) {
  try {
    if (!adminId || !groupId || !email) return { success: false, error: "Missing fields." };
    const normalizedEmail = email.toLowerCase().trim();

    const groupDoc = await getDoc(doc(db, "groups", groupId));
    if (!groupDoc.exists()) return { success: false, error: "Group not found." };
    const groupName = groupDoc.data().group_name || groupDoc.data().name || "Stokvel Group";

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await setDoc(doc(db, "invitations", token), {
      email: normalizedEmail,
      groupId: groupId,
      groupName: groupName,
      invitedBy: adminId,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
    });

    return { 
      success: true, 
      inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL}/invite/accept/${token}`,
      groupName 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * SETTLEMENT: This creates the 'group_members' doc so the dashboard shows "1"
 */
export async function settleInvitation(token: string, userId: string, userEmail: string) {
  try {
    const q = query(collection(db, "invitations"), where("token", "==", token), where("status", "==", "pending"));
    const snap = await getDocs(q);

    if (snap.empty) return { success: false, error: "Invalid or used invitation." };

    const inviteDoc = snap.docs[0];
    const { groupId, groupName } = inviteDoc.data();

    // 1. Create document in group_members (Crucial for Dashboard)
    await addDoc(collection(db, "group_members"), {
      groupId,
      groupName,
      userId,
      email: userEmail.toLowerCase(),
      role: "Member",
      joinedAt: serverTimestamp(),
    });

    // 2. Sync with the 'groups' doc members array (Matching your screenshot)
    await updateDoc(doc(db, "groups", groupId), {
      members: arrayUnion(userId)
    });

    // 3. Close the invitation
    await updateDoc(doc(db, "invitations", inviteDoc.id), {
      status: "accepted",
      acceptedBy: userId,
      acceptedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}