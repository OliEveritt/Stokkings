import { analyticsRepository, RawContributionRecord } from "@/repositories/analytics.repository";

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