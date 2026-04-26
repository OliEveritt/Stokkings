"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export async function createInvitation(email: string, groupId: string, adminId: string) {
  try {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    // 1. Write to Firestore Ledger
    const docRef = await addDoc(collection(db, "invitations"), {
      email,
      groupId,
      invitedBy: adminId,
      token,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    // 2. Dispatch Email (Logical Bridge)
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/accept/${token}`;
    
    // Replace this with your actual email service (e.g., Resend)
    await sendEmailNotification(email, inviteLink, groupId);

    return { success: true, token };
  } catch (error) {
    console.error("Invitation Error:", error);
    return { success: false, error: "System failed to dispatch invitation." };
  }
}

async function sendEmailNotification(to: string, link: string, group: string) {
  // Logic to trigger your email API would go here
  console.log(`Email sent to ${to} for group ${group}. Link: ${link}`);
}