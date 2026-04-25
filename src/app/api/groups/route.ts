import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";

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

    if (!group_name || group_name.trim().length === 0) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    if (!contribution_amount || contribution_amount <= 0) {
      return NextResponse.json({ error: "Valid contribution amount is required" }, { status: 400 });
    }

    if (!payout_frequency) {
      return NextResponse.json({ error: "Payout frequency is required" }, { status: 400 });
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    const userData = userDoc.data();

    if (!userData || userData.role !== 'Admin') {
      return NextResponse.json({ error: "Only Admins can create groups" }, { status: 403 });
    }

    const groupData = {
      group_name: group_name.trim(),
      contribution_amount: parseFloat(contribution_amount),
      payout_frequency: payout_frequency,
      payout_order: payout_order || 'rotational',
      created_by: userId,
      created_by_name: userData.name,
      created_at: new Date().toISOString(),
      members: [userId],
    };

    const docRef = await addDoc(collection(db, "groups"), groupData);

    await addDoc(collection(db, "group_members"), {
      userId: userId,
      groupId: docRef.id,
      role: 'Admin',
      joinedAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      group_id: docRef.id,
      group: groupData
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const groupsSnapshot = await getDocs(collection(db, "groups"));
    const groups = [];
    groupsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.members && data.members.includes(userId)) {
        groups.push({ id: doc.id, ...data });
      }
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}