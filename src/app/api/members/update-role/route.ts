import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const adminUserId = decodedToken.uid;

    // Check if requester is Admin
    const adminDoc = await getDoc(doc(db, "users", adminUserId));
    const adminData = adminDoc.data();

    if (!adminData || adminData.role !== 'Admin') {
      return NextResponse.json({ error: "Only Admins can update roles" }, { status: 403 });
    }

    const { user_id, role_name } = await req.json();

    // Update user role in Firestore
    const userRef = doc(db, "users", user_id);
    await updateDoc(userRef, {
      role: role_name,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}