"use server";

import { db } from "@/lib/firebase-admin"; // Use a separate admin config for server
import { doc, getDoc } from "firebase/firestore";

// Pass the UID from the client side call
export async function getActiveMembership(uid: string) {
  if (!uid) return null;

  try {
    // Note: On the server, you'd typically use firebase-admin
    // If you are using the client SDK in a "use server" file, 
    // it will often fail in production environments.
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data();
    
    if (!userData) return null;
    
    return {
      first_name: userData.name?.split(' ')[0] || '',
      surname: userData.name?.split(' ')[1] || '',
      email: userData.email,
      group_name: 'Default Group',
      group_id: 1,
      role_name: userData.role || 'Member'
    };
  } catch (error) {
    console.error("Action Error:", error);
    return null;
  }
}