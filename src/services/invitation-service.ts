import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";

/**
 * Handles the core logic for checking existing membership 
 * and creating a new invitation document.
 */
export async function createInvitation(email: string, groupId: string, adminUid: string) {
  // UAT 3: Validate if the user is already in the group
  const groupRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (groupSnap.exists()) {
    const members = groupSnap.data().members || [];
    if (members.includes(email.toLowerCase())) {
      throw new Error("This user is already a member of the group.");
    }
  }

  // UAT 1: Create the invitation record
  const inviteRef = doc(collection(db, "invitations"));
  const token = inviteRef.id; 

  const inviteData = {
    token,
    groupId,
    email: email.toLowerCase(),
    status: "pending",
    invitedBy: adminUid,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
  };

  await setDoc(inviteRef, inviteData);
  return { success: true, token };
}