"use server";

import { db } from "@/lib/firebase";
<<<<<<< HEAD
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
=======
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
>>>>>>> 80825cc
    const memberQuery = query(
      collection(db, "group_members"),
      where("groupId", "==", groupId),
      where("email", "==", normalizedEmail)
    );
    
    const memberSnapshot = await getDocs(memberQuery);
<<<<<<< HEAD
    
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
=======
    if (!memberSnapshot.empty) {
      return { success: false, error: "Audit Alert: User is already a member." };
    }

    // 3. Logic: Token & Expiry
    const token = uuidv4(); 
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4. Persistence
>>>>>>> 80825cc
    await setDoc(doc(db, "invitations", token), {
      email: normalizedEmail,
      groupId: groupId,
      invitedBy: adminId,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

<<<<<<< HEAD
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
=======
    return { success: true, token };
  } catch (error: any) {
    console.error("Invite Error:", error.message);
    return { success: false, error: "Critical Failure: " + error.message };
>>>>>>> 80825cc
  }
}