"use server";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getActiveMembership(requestedGroupId?: number) {
  // For now, return mock data until we migrate the data
  // This keeps the dashboard working
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
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
  } catch {
    return null;
  }
}

export async function getAllUserMandates() {
  // Return empty array for now
  return [];
}

export async function getDashboardStats(groupId: string | number) {
  // Return mock stats
  return {
    totalContributions: 0,
    memberCount: 1,
    nextPayout: null,
    complianceRate: 0
  };
}
