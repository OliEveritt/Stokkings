import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) {
    return NextResponse.json({ error: "Missing Group ID" }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();
    const contribSnap = await adminDb
      .collection("contributions")
      .where("groupId", "==", groupId)
      .where("status", "==", "confirmed")
      .get();

    if (contribSnap.empty) {
      return NextResponse.json({ hasData: false, dataPoints: [] });
    }

    // Aggregate confirmed amounts by period (YYYY-MM)
    const periodMap = new Map<string, number>();

    contribSnap.forEach((doc) => {
      const d = doc.data();
      const raw = d.contributionDate
        ? new Date(d.contributionDate)
        : d.timestamp?.toDate?.() ?? new Date();
      const y = raw.getFullYear();
      const m = String(raw.getMonth() + 1).padStart(2, "0");
      const period = `${y}-${m}`;
      const amount = typeof d.amount === "number" ? d.amount : 0;
      periodMap.set(period, (periodMap.get(period) ?? 0) + amount);
    });

    // Sort periods and compute cumulative totals
    const sorted = [...periodMap.entries()].sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;
    const dataPoints = sorted.map(([period, amount]) => {
      cumulative += amount;
      return { period, amount, cumulative };
    });

    return NextResponse.json({ hasData: true, dataPoints });
  } catch (error) {
    console.error("[analytics/savings-growth] Error:", error);
    return NextResponse.json({ error: "Failed to aggregate savings data" }, { status: 500 });
  }
}