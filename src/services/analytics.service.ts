import { analyticsRepository, RawContributionRecord } from "@/repositories/analytics.repository";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export interface MemberComplianceHistory {
  period: string;
  compliancePercentage: number;
}

export interface MemberComplianceSummary {
  memberId: string;
  memberName: string;
  overallCompliance: number;
  history: MemberComplianceHistory[];
}

export interface ComplianceReportData {
  members: MemberComplianceSummary[];
  periods: string[];
  hasData: boolean;
}

export class AnalyticsService {
  async getContributionComplianceReport(groupId: string): Promise<ComplianceReportData> {
    const rawRecords = await analyticsRepository.getContributionRecords(groupId);

    if (!rawRecords || rawRecords.length === 0) {
      return { members: [], periods: [], hasData: false };
    }

    const periods = this.extractSortedPeriods(rawRecords);
    const members = Array.from(this.aggregateByMember(rawRecords).values());

    return { members, periods, hasData: true };
  }

  private extractSortedPeriods(records: RawContributionRecord[]): string[] {
    return Array.from(new Set(records.map((r) => r.period))).sort();
  }

  private aggregateByMember(
    records: RawContributionRecord[]
  ): Map<string, MemberComplianceSummary> {
    const map = new Map<string, MemberComplianceSummary>();

    for (const record of records) {
      if (!map.has(record.memberId)) {
        map.set(record.memberId, {
          memberId: record.memberId,
          memberName: record.memberName,
          overallCompliance: 0,
          history: [],
        });
      }

      const pct = this.calculateCompliancePercentage(record.confirmed, record.expected);
      map.get(record.memberId)!.history.push({ period: record.period, compliancePercentage: pct });
    }

    for (const member of map.values()) {
      member.history.sort((a, b) => a.period.localeCompare(b.period));
      member.overallCompliance = this.calculateOverallCompliance(member.history);
    }

    return map;
  }

  /**
   * Calculates compliance % for a single period.
   * Boundary cases:
   *   expected <= 0  → 0  (no obligation defined)
   *   confirmed <= 0 → 0  (nothing paid)
   *   confirmed >= expected → 100 (fully compliant)
   *   partial → rounded to nearest integer  e.g. 10/12 = 83%
   */
  calculateCompliancePercentage(confirmed: number, expected: number): number {
    if (expected <= 0) return 0;
    if (confirmed <= 0) return 0;
    if (confirmed >= expected) return 100;
    return Math.round((confirmed / expected) * 100);
  }

  /**
   * Mean compliance across all recorded periods for a member.
   */
  calculateOverallCompliance(history: { compliancePercentage: number }[]): number {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, h) => sum + h.compliancePercentage, 0);
    return Math.round(total / history.length);
  }
}

export const analyticsService = new AnalyticsService();

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

export async function getPayoutHistory(groupId: string): Promise<PayoutRecord[]> {
  try {
    const payoutsRef = collection(db, "payouts");
    const q = query(
      payoutsRef,
      where("groupId", "==", groupId),
      where("status", "==", "completed"),
      orderBy("payoutDate", "desc")
    );
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

export async function getPayoutSchedule(groupId: string): Promise<PayoutProjection[]> {
  try {
    const scheduleRef = collection(db, "payout_schedules");
    const q = query(
      scheduleRef,
      where("groupId", "==", groupId),
      orderBy("position", "asc")
    );
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

export async function getNextPayout(groupId: string): Promise<PayoutProjection | null> {
  const schedule = await getPayoutSchedule(groupId);
  return schedule.length > 0 ? schedule[0] : null;
}

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