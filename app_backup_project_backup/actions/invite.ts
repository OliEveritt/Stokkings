"use server";

import { db } from "@/lib/firebase";
import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

/**
 * Sprint 2: Invitation System Implementation
 * Aubrey de Bruyn (2609389)
 */
export async function createInvitation(email: string, groupId: string, adminId: string) {
  try {
    // 1. Validate Admin Context
    if (!adminId) {
      return { success: false, error: "Authentication Error: No Admin ID detected." };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. UAT 3: Duplicate Detection (Check if already a group member)
    const memberQuery = query(
      collection(db, "group_members"),
      where("groupId", "==", groupId),
      where("email", "==", normalizedEmail)
    );
    
    const memberSnapshot = await getDocs(memberQuery);
    
    if (!memberSnapshot.empty) {
      return { 
        success: false, 
        error: "Audit Alert: This user is already a member of the group." 
      };
    }

    // 3. Logic: Token Generation & Expiry (T + 7 Days)
    const token = uuidv4(); 
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4. Persistence: Write to Firestore Ledger
    // Using the token as the document ID for direct retrieval
    await setDoc(doc(db, "invitations", token), {
      email: normalizedEmail,
      groupId: groupId,
      invitedBy: adminId,
      token: token,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    // 5. Dispatch Email (Logical Bridge)
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${token}`;
    
    // Optional: Trigger external email service
    await sendEmailNotification(normalizedEmail, inviteLink, groupId);

    return { 
      success: true, 
      token: token,
      expiresAt: expiresAt.toISOString() 
    };

  } catch (error: any) {
    console.error("Invitation Action Error:", error.message);
    return { 
      success: false, 
      error: "Critical Failure: " + (error.message || "System failed to generate invitation.")
    };
  }
}

/**
 * Logical Bridge for Email Services (e.g., Resend, SendGrid)
 */
async function sendEmailNotification(to: string, link: string, group: string) {
  // Logic to trigger your email API would go here
  console.log(`Email dispatched to ${to} for group ${group}. Link: ${link}`);
}