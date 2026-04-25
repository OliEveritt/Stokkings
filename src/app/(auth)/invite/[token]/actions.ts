"use server";

import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { redirect } from "next/navigation";

export async function acceptInvitationAction(invitationId: string, userId: string) {
  try {
    // 1. Fetch the invitation to get the Group ID
    const inviteRef = doc(db, "invitations", invitationId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists() || inviteSnap.data().status !== "pending") {
      throw new Error("Invitation is invalid or already claimed.");
    }

    const { groupId } = inviteSnap.data();

    // 2. Perform Atomic Updates (UAT 2 & 4)
    // A. Mark invite as claimed
    await updateDoc(inviteRef, {
      status: "claimed",
      claimedAt: new Date().toISOString()
    });

    // B. Add user to the group members list
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId)
    });

  } catch (error) {
    console.error("Acceptance Error:", error);
    return { error: "Could not join group. Please contact the admin." };
  }

  // 3. Onboarding complete
  redirect("/dashboard");
}