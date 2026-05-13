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

    // Fetch contributions for this group
    const contribSnap = await adminDb
      .collection("contributions")
      .where("groupId", "==", groupId)
      .get();

    if (contribSnap.empty) {
      return NextResponse.json({ members: [], periods: [], hasData: false });
    }

    // Collect unique userIds to look up names
    const userIds = [...new Set(contribSnap.docs.map((d) => d.data().userId))];

    // Fetch user names in parallel
    const userDocs = await Promise.all(
      userIds.map((uid) => adminDb.collection("users").doc(uid).get())
    );
    const userNames: Record<string, string> = {};
    userDocs.forEach((doc) => {
      if (doc.exists) {
        userNames[doc.id] = doc.data()?.name ?? "Unknown";
      }
    });

    // Aggregate by userId + YYYY-MM period
    const agg = new Map<string, {
      memberId: string; memberName: string; period: string;
      expected: number; confirmed: number;
    }>();

    contribSnap.forEach((doc) => {
      const d = doc.data();
      const memberId: string = d.userId ?? doc.id;
      const memberName: string = userNames[memberId] ?? "Unknown";
      // contributionDate is an ISO string e.g. "2026-05-09T18:52:01.664Z"
      const raw = d.contributionDate
        ? new Date(d.contributionDate)
        : d.timestamp?.toDate?.() ?? new Date();
      const y = raw.getFullYear();
      const m = String(raw.getMonth() + 1).padStart(2, "0");
      const period = `${y}-${m}`;
      const key = `${memberId}::${period}`;

      if (!agg.has(key)) {
        agg.set(key, { memberId, memberName, period, expected: 0, confirmed: 0 });
      }
      const entry = agg.get(key)!;
      entry.expected += 1;
      // status is lowercase "confirmed" in Firestore
      if (d.status === "confirmed") entry.confirmed += 1;
    });

    const records = Array.from(agg.values());
    const periods = [...new Set(records.map((r) => r.period))].sort();

    const memberMap = new Map<string, {
      memberId: string; memberName: string;
      overallCompliance: number;
      history: { period: string; compliancePercentage: number }[];
    }>();

    for (const record of records) {
      if (!memberMap.has(record.memberId)) {
        memberMap.set(record.memberId, {
          memberId: record.memberId,
          memberName: record.memberName,
          overallCompliance: 0,
          history: [],
        });
      }
      let pct = 0;
      if (record.expected > 0 && record.confirmed > 0) {
        pct = record.confirmed >= record.expected
          ? 100
          : Math.round((record.confirmed / record.expected) * 100);
      }
      memberMap.get(record.memberId)!.history.push({
        period: record.period,
        compliancePercentage: pct,
      });
    }

    for (const member of memberMap.values()) {
      member.history.sort((a, b) => a.period.localeCompare(b.period));
      const total = member.history.reduce((sum, h) => sum + h.compliancePercentage, 0);
      member.overallCompliance = Math.round(total / member.history.length);
    }

    return NextResponse.json({
      members: Array.from(memberMap.values()),
      periods,
      hasData: true,
    });
  } catch (error) {
    console.error("[analytics/contribution-compliance] Error:", error);
    return NextResponse.json({ error: "Failed to aggregate compliance data" }, { status: 500 });
  }
}
