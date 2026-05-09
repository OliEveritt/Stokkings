"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { redirect } from "next/navigation";

/**
 * Atomic Acceptance Handshake
 * Provisions the user profile and joins the group in a single transaction.
 */
export async function acceptInvitationAction(token: string, userId: string, userData: any) {
  try {
    /**
     * 1. IDENTIFY THE DOCUMENT
     * Resolve the random Document ID (e.g., O6rQHb...) using the UUID token field.
     */
    const inviteQuery = await adminDb.collection("invitations")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (inviteQuery.empty) {
      throw new Error("Invitation not found.");
    }

    const inviteDoc = inviteQuery.docs[0];
    const inviteRef = inviteDoc.ref;
    const inviteData = inviteDoc.data();

    /**
     * 2. ATOMIC TRANSACTION
     * Ensures either everything succeeds or everything fails to prevent "Ghost Provisioning".
     */
    await adminDb.runTransaction(async (transaction) => {
      const inviteSnap = await transaction.get(inviteRef);
      const userRef = adminDb.collection("users").doc(userId);
      const userSnap = await transaction.get(userRef);
      
      // UAT-4 Enforcement: Verify status is still 'pending' inside the transaction
      if (!inviteSnap.exists || inviteSnap.data()?.status !== "pending") {
        throw new Error("Invitation is invalid or already claimed.");
      }

      /**
       * 3. ROLE PROTECTION LOGIC
       * Prevents existing Admins or Treasurers from being demoted to 'Member'.
       */
      const existingData = userSnap.exists ? userSnap.data() : null;
      
      // Normalizes existing roles to ensure casing doesn't cause logic failure.
      const currentRole = existingData?.role;
      const roleToSet = (currentRole === "Admin" || currentRole === "Treasurer") 
        ? currentRole 
        : "Member";

      // 4. PROVISION USER PROFILE (Root 'users' collection)
      transaction.set(userRef, {
        email: userData.email,
        name: userData.firstName + " " + userData.surname, // Combined for schema consistency
        role: roleToSet, 
        groupId: inviteData.groupId, // Essential for dashboard group filtering
        createdAt: existingData?.createdAt || FieldValue.serverTimestamp()
      }, { merge: true });

      // 5. JOIN GROUP ARRAY (Matches 'members' array in group doc)
      // Updates the array shown in Firestore screenshots rather than a sub-collection.
      const groupRef = adminDb.collection("groups").doc(inviteData.groupId);
      transaction.update(groupRef, {
        members: FieldValue.arrayUnion(userId)
      });

      // 6. BURN TOKEN (UAT-4)
      // Marks the link as used so it cannot be claimed again.
      transaction.update(inviteRef, {
        status: "accepted",
        acceptedBy: userId,
        acceptedAt: FieldValue.serverTimestamp()
      });
    });
  } catch (err: any) {
    // Required: Next.js redirect() throws a specific error to stop execution
    if (err.message === "NEXT_REDIRECT") throw err; 
    
    console.error("Provisioning Handshake Failed:", err.message);
    return { error: "Security handshake failed. Data sync error." };
  }
  
  // Direct entry to dashboard upon successful provisioning
  redirect("/dashboard");
}
