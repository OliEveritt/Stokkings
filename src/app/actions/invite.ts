"use server";

import { db } from "@/lib/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
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
}