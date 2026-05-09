"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

/**
 * US-2.1: Secure Member Invitation
 */
export async function createInvitation(email: string, groupId: string, userId: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. RBAC Check: Verify requester is an Admin
    const userSnap = await adminDb.collection("users").doc(userId).get();
    const userRole = userSnap.data()?.role;

    if (!userSnap.exists || userRole !== "Admin") {
      return { success: false, error: "Unauthorized: Only group admins can send invitations." };
    }

    // 2. UAT-3: Group-specific Member Check
    const memberSnapshot = await adminDb
      .collection("groups")
      .doc(groupId)
      .collection("group_members")
      .where("email", "==", normalizedEmail)
      .get();

    if (!memberSnapshot.empty) {
      return { success: false, error: "This user is already a member of this group." };
    }

    // 3. Generate secure token (7-day expiry)
    const token = uuidv4();
    const expiresAtDate = new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + 7);

    const inviteData = {
      email: normalizedEmail,
      groupId,
      invitedBy: userId,
      token,
      status: "pending",
      expiresAt: Timestamp.fromDate(expiresAtDate),
      createdAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection("invitations").doc(token).set(inviteData);

    return { success: true, token, expiresAt: expiresAtDate.toISOString() };
  } catch (error: any) {
    console.error("Invitation Creation Error:", error.message);
    return { success: false, error: "Internal server error." };
  }
}

/**
 * US-2.2: Accept Invitation & Onboarding logic
 * IMPORTANT: Never overwrites name - signup already set it correctly.
 */
export async function acceptInvitationAction(params: {
  token: string;
  userId: string;
  email: string;
  firstName: string;
  surname: string;
}) {
  try {
    const inviteRef = adminDb.collection("invitations").doc(params.token);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      return { success: false, error: "Invalid invitation link." };
    }

    const inviteData = inviteSnap.data()!;

    if (inviteData.expiresAt.toDate() < new Date()) {
      await inviteRef.update({ status: "expired" });
      return { success: false, error: "This invitation has expired." };
    }

    if (inviteData.status !== "pending") {
      return { success: false, error: "This invitation has already been used." };
    }

    const batch = adminDb.batch();

    // Only set groupId and role - NEVER overwrite name (set by signup form)
    const userRef = adminDb.doc(`users/${params.userId}`);
    batch.set(userRef, {
      email: params.email,
      groupId: inviteData.groupId,
      role: "Member",
    }, { merge: true }); // merge:true preserves existing name field

    // Add to group members subcollection
    const memberRef = adminDb.doc(`groups/${inviteData.groupId}/group_members/${params.userId}`);
    batch.set(memberRef, {
      email: params.email,
      role: "Member",
      joinedAt: FieldValue.serverTimestamp(),
    });

    // Add to group members array for dashboard query
    const groupRef = adminDb.collection("groups").doc(inviteData.groupId);
    batch.update(groupRef, {
      members: FieldValue.arrayUnion(params.userId),
    });

    // Burn token (UAT-4)
    batch.update(inviteRef, { status: "accepted" });

    await batch.commit();

    return { success: true, groupId: inviteData.groupId };
  } catch (error: any) {
    console.error("Accept Action Error:", error.message);
    return { success: false, error: "Failed to join group." };
  }
}
