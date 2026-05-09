import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * CREATE GROUP (POST)
 * Restricted to users with the 'Admin' role.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { group_name, contribution_amount, payout_frequency, payout_order } = body;

    // Validation
    if (!group_name?.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }
    if (!contribution_amount || contribution_amount <= 0) {
      return NextResponse.json({ error: "Valid contribution amount is required" }, { status: 400 });
    }

    // Role Check: Fetch user data using Admin SDK
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Case-insensitive role check to match "Admin"
    if (!userData || userData.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Only Admins can create groups" }, { status: 403 });
    }

    const batch = adminDb.batch();
    const groupRef = adminDb.collection("groups").doc();
    const membershipRef = adminDb.collection("group_members").doc();

    const groupData = {
      group_name: group_name.trim(),
      contribution_amount: parseFloat(contribution_amount),
      payout_frequency: payout_frequency,
      payout_order: payout_order || 'rotational',
      created_by: userId,
      created_by_name: userData.name || "Admin", // Matches standardized 'name' field
      created_at: FieldValue.serverTimestamp(),
      members: [userId], // Primary link for Dashboard array-contains query
    };

    batch.set(groupRef, groupData);
    batch.set(membershipRef, {
      userId: userId,
      groupId: groupRef.id,
      role: 'Admin',
      joinedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      group_id: groupRef.id,
      group: groupData
    });
  } catch (error: any) {
    console.error("Error creating group:", error);
    return NextResponse.json({ error: error.message || "Failed to create group" }, { status: 500 });
  }
}

/**
 * FETCH GROUPS (GET)
 * Returns all groups where the user is a member.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // SCHEMA QUERY: Matches the 'members' array field
    const groupsRef = adminDb.collection("groups");
    const querySnapshot = await groupsRef.where("members", "array-contains", userId).get();

    const groups = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch groups" }, { status: 500 });
  }
}