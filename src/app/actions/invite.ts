"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

/**
 * US-2.1: Secure Member Invitation
 * Checks if email exists in the specific group before generating a pending token.
 */
export async function createInvitation(email: string, groupId: string, userId: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. RBAC Check: Ensure requester is an Admin of the specific group
    const requesterRef = adminDb.doc(`groups/${groupId}/group_members/${userId}`);
    const requesterSnap = await requesterRef.get();

    if (!requesterSnap.exists || requesterSnap.data()?.role !== "Admin") {
      return { success: false, error: "Unauthorized: Only group admins can send invitations." };
    }

    // 2. UAT-3: Group-specific Member Check
    // Validates if the email is already in the target group's members subcollection
    const memberSnapshot = await adminDb
      .collection("groups")
      .doc(groupId)
      .collection("group_members")
      .where("email", "==", normalizedEmail)
      .get();

    if (!memberSnapshot.empty) {
      return { success: false, error: "This user is already a member of this group." };
    }

    // 3. UAT-4: Generate secure token (7-day expiry)
    const token = uuidv4();
    const expiresAtDate = new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + 7);

    // 4. Persistence: Default status to "pending"
    const inviteData = {
      email: normalizedEmail,
      groupId,
      invitedBy: userId,
      token,
      status: "pending", // Default status per requirements
      expiresAt: Timestamp.fromDate(expiresAtDate),
      createdAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection("invitations").doc(token).set(inviteData);

    return { 
      success: true, 
      token,
      expiresAt: expiresAtDate.toISOString() 
    };
  } catch (error: any) {
    console.error("Invitation Creation Error:", error.message);
    return { success: false, error: "Internal server error." };
  }
}

/**
 * US-2.2: Accept Invitation & Onboarding logic
 * Handles existing users and forces new users to be added to 'users' before 'groups'.
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

    // Validation checks
    if (inviteData.expiresAt.toDate() < new Date()) {
      await inviteRef.update({ status: "expired" });
      return { success: false, error: "This invitation has expired." };
    }

    if (inviteData.status !== "pending") {
      return { success: false, error: "This invitation has already been used." };
    }

    const batch = adminDb.batch();
    
    // 1. Provision User Document if it's a new sign-up
    const userRef = adminDb.doc(`users/${params.userId}`);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      batch.set(userRef, {
        email: params.email,
        firstName: params.firstName,
        surname: params.surname,
        role: "Member", // Default role for new sign-ups
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // 2. Add to Group Members subcollection
    const memberRef = adminDb.doc(`groups/${inviteData.groupId}/group_members/${params.userId}`);
    batch.set(memberRef, {
      email: params.email,
      firstName: params.firstName,
      surname: params.surname,
      role: "Member",
      joinedAt: FieldValue.serverTimestamp(),
    });

    // 3. Mark invitation as accepted
    batch.update(inviteRef, { status: "accepted" });

    await batch.commit();

    return { success: true, groupId: inviteData.groupId };
  } catch (error: any) {
    console.error("Accept Action Error:", error.message);
    return { success: false, error: "Failed to join group." };
  }
}