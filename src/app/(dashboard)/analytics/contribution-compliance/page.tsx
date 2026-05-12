"use client";

import { useEffect, useState } from "react";

import { useActiveGroup } from "@/context/GroupContext";
import { ComplianceChart } from "@/components/charts/ComplianceChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { ComplianceReportData } from "@/services/analytics.service";

export default function ContributionCompliancePage() {
  
  const { allGroups, activeGroup, loading: groupLoading } = useActiveGroup();

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [report, setReport] = useState<ComplianceReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default selected group to activeGroup once loaded
  useEffect(() => {
    if (!groupLoading && activeGroup?.id && !selectedGroupId) {
      setSelectedGroupId(activeGroup.id);
    }
  },  [activeGroup?.id, groupLoading, selectedGroupId]);

  // Fetch report whenever selected group changes
  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      setReport(null);
      try {
        const res = await fetch(
          `/api/analytics/contribution-compliance?groupId=${selectedGroupId}`
        );
        if (!res.ok) throw new Error("Failed to load report");
        const data: ComplianceReportData = await res.json();
        setReport(data);
      } catch (err) {
        console.error(err);
        setError("Could not load compliance report. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedGroupId]);

  const selectedGroup = allGroups.find((g) => g.id === selectedGroupId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Contribution Compliance</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track each member&apos;s payment compliance over time.
            </p>
          </div>

          {/* Group selector */}
          {allGroups.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Group
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {allGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.group_name ?? g.name ?? g.id}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {groupLoading || loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      ) : !report?.hasData ? (
        <EmptyState
          title="No contribution data yet"
          subtitle={`Compliance data will appear here once contributions have been recorded for ${selectedGroup?.group_name ?? selectedGroup?.name ?? "this group"}.`}
        />
      ) : (
        <>
          {/* Per-member summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {report.members.map((member) => (
              <Card key={member.memberId} className="p-4">
                <p className="text-xs text-gray-500 truncate">{member.memberName}</p>
                <p
                  className={`mt-1 text-2xl font-semibold ${
                    member.overallCompliance >= 80
                      ? "text-green-600"
                      : member.overallCompliance >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {member.overallCompliance}%
                </p>
                <p className="text-xs text-gray-400">Overall</p>
              </Card>
            ))}
          </div>

          {/* Compliance chart */}
          <Card className="p-6">
            <h2 className="text-base font-medium text-gray-700 mb-4">Compliance over time</h2>
            <ComplianceChart members={report.members} periods={report.periods} />
          </Card>
        </>
      )}
    </div>
  );
}