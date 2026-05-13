import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const adminAuth = await import("@/lib/firebase-admin").then(m => m.getAdminAuth());
    await adminAuth.verifyIdToken(token);

    const { groupId, memberName, amount, payoutDate } = await req.json();

    if (!groupId || !memberName || !amount || !payoutDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("payouts").add({
      groupId,
      memberName,
      amount: parseFloat(amount),
      payoutDate,
      status: "completed",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording payout:", error);
    return NextResponse.json({ error: "Failed to record payout" }, { status: 500 });
  }
}
