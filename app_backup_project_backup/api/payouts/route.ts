import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, writeBatch, doc } from "firebase/firestore";

// GET: View the Payout Schedule (UAT 1)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) return NextResponse.json({ error: "Group ID required" }, { status: 400 });

  try {
    const q = query(
      collection(db, "payout_schedules"),
      where("groupId", "==", groupId),
      orderBy("position", "asc")
    );

    const snapshot = await getDocs(q);
    const schedule = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(schedule);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

// PATCH: Reorder positions (UAT 2 - Treasurer only logic should be in middleware/wrapper)
export async function PATCH(request: Request) {
  const { updates } = await request.json(); // Array of { id, newPosition }

  try {
    const batch = writeBatch(db);
    updates.forEach((u: { id: string, newPosition: number }) => {
      const ref = doc(db, "payout_schedules", u.id);
      batch.update(ref, { position: u.newPosition });
    });

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Reordering failed" }, { status: 500 });
  }
}