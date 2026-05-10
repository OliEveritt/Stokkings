import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export interface RawContributionRecord {
  memberId: string;
  memberName: string;
  period: string; // "YYYY-MM"
  expected: number;
  confirmed: number;
}

/**
 * Queries the flat top-level `contributions` collection filtered by groupId.
 * Uses the same Firebase client SDK pattern as /api/analytics/summary/route.ts.
 *
 * Expected contribution document fields:
 *   groupId:    string
 *   memberId:   string
 *   memberName: string
 *   dueDate:    Firestore Timestamp
 *   status:     "PENDING" | "CONFIRMED" | "MISSED"
 */
export const analyticsRepository = {
  async getContributionRecords(groupId: string): Promise<RawContributionRecord[]> {
    const q = query(
      collection(db, "contributions"),
      where("groupId", "==", groupId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    // Key: "memberId::YYYY-MM"
    const agg = new Map<
      string,
      { memberId: string; memberName: string; period: string; expected: number; confirmed: number }
    >();

    snapshot.forEach((doc) => {
      const d = doc.data();
      const memberId: string = d.memberId ?? doc.id;
      const memberName: string = d.memberName ?? "Unknown";
      const raw = d.dueDate?.toDate?.() ?? new Date((d.timestamp?.seconds ?? 0) * 1000);
      const dueDate: Date = raw instanceof Date ? raw : new Date();
      const status: string = d.status ?? "PENDING";
      const period = toPeriod(dueDate);
      const key = `${memberId}::${period}`;

      if (!agg.has(key)) {
        agg.set(key, { memberId, memberName, period, expected: 0, confirmed: 0 });
      }

      const entry = agg.get(key)!;
      entry.expected += 1;
      if (status === "CONFIRMED") entry.confirmed += 1;
    });

    return Array.from(agg.values());
  },
};

function toPeriod(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}