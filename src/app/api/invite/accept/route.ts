import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/invite/accept
 * Atomic Handshake: Validates token, creates user profile, and joins group.
 * Fulfills UAT-2 (Atomic Join) and UAT-4 (Single-use Token).
 */
export async function POST(req: Request) {
  try {
    const { token, userId, email, groupId, firstName, surname } = await req.json();

    // 1. Basic Validation
    if (!token || !userId || !groupId) {
      return NextResponse.json({ error: "Missing required handshake data" }, { status: 400 });
    }

    const inviteRef = adminDb.collection("invitations").doc(token);

    // 2. Atomic Transaction to prevent race conditions or partial joins
    await adminDb.runTransaction(async (transaction) => {
      const inviteDoc = await transaction.get(inviteRef);

      // UAT-4: Verify invitation is valid and currently pending
      if (!inviteDoc.exists) {
        throw new Error("Invitation link does not exist.");
      }
      
      const inviteData = inviteDoc.data();
      if (inviteData?.status !== "pending") {
        throw new Error("This invitation has already been claimed.");
      }

      // Check Expiry (Backup check for the 7-day rule)
      if (inviteData?.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
        throw new Error("This invitation has expired.");
      }

      // 3. Create/Update Global User Profile
      const userRef = adminDb.collection("users").doc(userId);
      transaction.set(userRef, {
        email: email.toLowerCase(),
        firstName,
        surname,
        role: "Member",
        createdAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // 4. Add to Group Sub-collection (Match naming from MembersPage)
      const memberRef = adminDb
        .collection("groups")
        .doc(groupId)
        .collection("group_members")
        .doc(userId);

      transaction.set(memberRef, {
        userId,
        email: email.toLowerCase(),
        role: "Member",
        joinedAt: FieldValue.serverTimestamp()
      });

      // 5. Invalidate the Token
      transaction.update(inviteRef, { 
        status: "accepted", 
        acceptedBy: userId,
        acceptedAt: FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Successfully joined the Stokvel circle." 
    });

  } catch (error: any) {
    console.error("Banking Audit - Handshake Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Internal Handshake Failure" }, 
      { status: 400 }
    );
  }
}