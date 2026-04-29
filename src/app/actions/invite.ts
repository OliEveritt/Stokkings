"use server";

import { db } from "@/lib/firebase";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";


import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
 10-us-26-view-and-manage-payout-schedule
import { v4 as uuidv4 } from "uuid";

export async function createInvitation(email: string, groupId: string, adminId: string) {
  try {

    const token = uuidv4();

    const normalizedEmail = email.toLowerCase().trim();

    // --- UAT 3: DUPLICATE DETECTION ---

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
 80825cc
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
 10-us-26-view-and-manage-payout-schedule
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry


    // 1. Write to Firestore Ledger
    const docRef = await addDoc(collection(db, "invitations"), {
      email,
      groupId,

    // --- DATABASE PERSISTENCE ---

    if (!memberSnapshot.empty) {
      return { success: false, error: "Audit Alert: User is already a member." };
    }

    // 3. Logic: Token & Expiry
    const token = uuidv4(); 
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 4. Persistence
 80825cc
    await setDoc(doc(db, "invitations", token), {
      email: normalizedEmail,
      groupId: groupId,
 10-us-26-view-and-manage-payout-schedule
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

    return { success: true, token };
  } catch (error: any) {
    console.error("Invite Error:", error.message);
    return { success: false, error: "Critical Failure: " + error.message };
 80825cc
 10-us-26-view-and-manage-payout-schedule
  }
}

async function sendEmailNotification(to: string, link: string, group: string) {
  // Logic to trigger your email API would go here
  console.log(`Email sent to ${to} for group ${group}. Link: ${link}`);
}