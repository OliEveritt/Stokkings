import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { groupId } = await req.json();

    if (!groupId) {
      return NextResponse.json({ error: "groupId required" }, { status: 400 });
    }

    const membersSnapshot = await getDocs(collection(db, "groups", groupId, "group_members"));
    const members = membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as { name?: string }),
    }));

    if (members.length === 0) {
      return NextResponse.json({ error: "No members found" }, { status: 404 });
    }

    const existingSchedules = await getDocs(collection(db, "payout_schedules"));
    for (const scheduleDoc of existingSchedules.docs) {
      await deleteDoc(scheduleDoc.ref);
    }

    let position = 1;
    for (const member of members) {
      await addDoc(collection(db, "payout_schedules"), {
        groupId: groupId,
        memberId: member.id,
        name: member.name || "Member",
        position: position,
        amount: 500,
        expectedDate: new Date(Date.now() + position * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "scheduled",
      });
      position++;
    }

    await addDoc(collection(db, "payouts"), {
      groupId: groupId,
      memberName: "Test Member",
      amount: 500,
      payoutDate: "2026-04-15",
      status: "completed",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}