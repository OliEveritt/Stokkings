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
 * Sprint 2: Invitation System Logic
 * Handles Token Generation, Expiry, and Duplicate Detection (UAT 3)
 */
export async function createInvitation(email: string, groupId: string, adminId: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // --- UAT 3: DUPLICATE DETECTION ---
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

    // --- TOKEN GENERATION (UUID v4) ---
    const token = uuidv4(); 
    
    // --- EXPIRY LOGIC (T + 7 Days) ---
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // --- DATABASE PERSISTENCE ---
    await setDoc(doc(db, "invitations", token), {
      email: normalizedEmail,
      groupId: groupId,
      invitedBy: adminId,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    return { 
      success: true, 
      token: token,
      expiresAt: expiresAt.toISOString() 
    };

  } catch (error: any) {
    console.error("Invitation Action Error:", error.message);
    return { 
      success: false, 
      error: "Critical Error: System failed to generate invitation." 
    };
  }
}