"use server";

import { db } from "@/lib/firebase";
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
=======
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
>>>>>>> 80825cc (feat: finalized Sprint 2 delivery (TDD, Routing, and Coverage) - Aubrey 2609389)
import { v4 as uuidv4 } from "uuid";

/**
 * Sprint 2: Invitation System Implementation
 * Aubrey de Bruyn (2609389)
 */
export async function createInvitation(email: string, groupId: string, adminId: string) {
  try {
    // 1. Validate that we have an Admin ID from the frontend
    if (!adminId) {
      return { success: false, error: "Authentication Error: No Admin ID detected." };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. UAT 3: Duplicate Detection
    const memberQuery = query(
      collection(db, "group_members"),
      where("groupId", "==", groupId),
      where("email", "==", normalizedEmail)
    );
    
    const memberSnapshot = await getDocs(memberQuery);
    if (!memberSnapshot.empty) {
      return { success: false, error: "Audit Alert: User is already a member." };
    }

    // 3. Logic: Token & Expiry
    const token = uuidv4(); 
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4. Persistence
    await setDoc(doc(db, "invitations", token), {
      email: normalizedEmail,
      groupId: groupId,
      invitedBy: adminId,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    return { success: true, token };
  } catch (error: any) {
    console.error("Invite Error:", error.message);
    return { success: false, error: "Critical Failure: " + error.message };
  }
>>>>>>> d7027ce (ci: implement automated testing for US 2.1 and 2.6 on develop branch)
}