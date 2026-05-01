import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; // You'll need an admin setup for server-side writes

export async function POST(req: Request) {
  try {
    const { token, userId, email, groupId, firstName, surname } = await req.json();

    const inviteRef = adminDb.collection("invitations").doc(token);

    // Run a transaction to satisfy UAT 2 and UAT 4
    await adminDb.runTransaction(async (transaction) => {
      const inviteDoc = await transaction.get(inviteRef);

      // UAT 4: Verify invitation is valid and pending
      if (!inviteDoc.exists || inviteDoc.data()?.status !== "pending") {
        throw new Error("Invitation already claimed or invalid.");
      }

      // Create User Profile
      const userRef = adminDb.collection("users").doc(userId);
      transaction.set(userRef, {
        email,
        firstName,
        surname,
        role: "member",
        createdAt: new Date()
      });

      // Add to Group Members
      const memberRef = adminDb.collection("groups").doc(groupId).collection("members").doc(userId);
      transaction.set(memberRef, {
        userId,
        joinedAt: new Date()
      });

      // Update Invite Status
      transaction.update(inviteRef, { 
        status: "accepted", 
        acceptedBy: userId 
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}