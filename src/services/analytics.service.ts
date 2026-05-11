/**
 * US-3.2: Payout History and Projections Report
 * Analytics service for payout data aggregation and projections
 */

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, doc, getDoc } from "firebase/firestore";

export interface PayoutRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  payoutDate: string;
  status: "completed" | "scheduled" | "failed";
  position: number;
}

export interface PayoutProjection {
  position: number;
  memberId: string;
  memberName: string;
  expectedDate: string;
  amount: number;
  status: "upcoming";
}

export interface PayoutReportData {
  pastPayouts: PayoutRecord[];
  upcomingProjections: PayoutProjection[];
  hasPastPayouts: boolean;
  nextPayoutDate: string | null;
  totalPaidOut: number;
  totalScheduled: number;
}

/**
 * Fetch payout history for a group (completed payouts)
 * Looks in the top-level 'payouts' collection
 */
export async function getPayoutHistory(groupId: string): Promise<PayoutRecord[]> {
  try {
    const payoutsRef = collection(db, "payouts");
    const q = query(payoutsRef, where("groupId", "==", groupId), where("status", "==", "completed"), orderBy("payoutDate", "desc"));
    const snapshot = await getDocs(q);
    
    const payouts: PayoutRecord[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      payouts.push({
        id: docSnap.id,
        memberId: data.memberId || data.userId || "",
        memberName: data.memberName || data.userName || "Unknown",
        amount: data.amount,
        payoutDate: data.payoutDate,
        status: data.status,
        position: data.position || 0,
      });
    }
    return payouts;
  } catch (error) {
    console.error("Error fetching payout history:", error);
    return [];
  }
}

/**
 * Get payout schedule (upcoming projections)
 * Looks in the top-level 'payout_schedules' collection
 */
export async function getPayoutSchedule(groupId: string): Promise<PayoutProjection[]> {
  try {
    const scheduleRef = collection(db, "payout_schedules");
    const q = query(scheduleRef, where("groupId", "==", groupId), orderBy("position", "asc"));
    const snapshot = await getDocs(q);
    
    const projections: PayoutProjection[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      projections.push({
        position: data.position,
        memberId: data.memberId || docSnap.id,
        memberName: data.name || data.memberName || "Unknown",
        expectedDate: data.expectedDate || data.payoutDate || "TBD",
        amount: data.amount || 0,
        status: "upcoming",
      });
    }
    return projections;
  } catch (error) {
    console.error("Error fetching payout schedule:", error);
    return [];
  }
}

/**
 * Get next scheduled payout
 */
export async function getNextPayout(groupId: string): Promise<PayoutProjection | null> {
  const schedule = await getPayoutSchedule(groupId);
  return schedule.length > 0 ? schedule[0] : null;
}

/**
 * Get complete payout report data (UAT 1 & 2)
 */
export async function getPayoutReportData(groupId: string): Promise<PayoutReportData> {
  const [pastPayouts, upcomingProjections] = await Promise.all([
    getPayoutHistory(groupId),
    getPayoutSchedule(groupId),
  ]);

  const nextPayout = upcomingProjections.length > 0 ? upcomingProjections[0].expectedDate : null;
  const totalPaidOut = pastPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalScheduled = upcomingProjections.reduce((sum, p) => sum + p.amount, 0);

  return {
    pastPayouts,
    upcomingProjections,
    hasPastPayouts: pastPayouts.length > 0,
    nextPayoutDate: nextPayout,
    totalPaidOut,
    totalScheduled,
  };
}