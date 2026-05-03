"use server";

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";

// Initialize Firebase Admin once using the service account file
async function initAdmin() {
  if (getApps().length) return;

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH!;
  const serviceAccount = JSON.parse(await fs.readFile(keyPath, "utf8"));
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export async function createInvitation(email: string, groupId: string, idToken: string) {
  await initAdmin();
  try {
    // Verify the ID token (sent from client)
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const adminId = decodedToken.uid;

    // Check if the user is an admin of the group
    const memberRef = db.doc(`groups/${groupId}/group_members/${adminId}`);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists || memberSnap.data()?.role !== "Admin") {
      return { success: false, error: "Only group admins can send invitations." };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store invitation using token as document ID
    await db.collection("invitations").doc(token).set({
      email: normalizedEmail,
      groupId,
      invitedBy: adminId,
      token,
      status: "pending",
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/invite/${token}`;
    return { success: true, inviteLink, token };
  } catch (error: any) {
    console.error("Invitation action error:", error);
    return { success: false, error: error.message || "Failed to create invitation." };
  }
}