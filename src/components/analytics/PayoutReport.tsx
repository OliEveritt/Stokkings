"use client";

import { useEffect, useState } from "react";
import { getPayoutReportData, PayoutReportData } from "@/services/analytics.service";
import PayoutTimelineChart from "./PayoutTimelineChart";

interface PayoutReportProps {
  groupId: string;
}

export default function PayoutReport({ groupId }: PayoutReportProps) {
  const [data, setData] = useState<PayoutReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadReport();
    }
  }, [groupId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const reportData = await getPayoutReportData(groupId);
      setData(reportData);
    } catch (err) {
      console.error("Error loading payout report:", err);
      setError("Failed to load payout data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "TBD") return "TBD";
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading payout report...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-gray-500">No payout data available</div>;
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Total Paid Out</p>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(data.totalPaidOut)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Scheduled</p>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(data.totalScheduled)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Next Payout</p>
          <p className="text-2xl font-bold text-gray-900">{formatDate(data.nextPayoutDate || "")}</p>
        </div>
      </div>

      {/* Timeline Chart (UAT 1 - visual timeline) */}
      <PayoutTimelineChart
        pastPayouts={data.pastPayouts}
        upcomingProjections={data.upcomingProjections}
      />

      {/* Past Payouts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">📋 Past Payouts</h2>
          <p className="text-sm text-gray-500">Completed payouts with dates and amounts (detailed list)</p>
        </div>
        <div className="p-6">
          {!data.hasPastPayouts ? (
            <div className="text-center py-8 text-gray-500">
              No past payouts recorded yet. Upcoming payouts are shown below.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.pastPayouts.map((payout, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(payout.payoutDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{payout.memberName}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatAmount(payout.amount)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          ✅ Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Projections Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">📅 Upcoming Projected Payouts</h2>
          <p className="text-sm text-gray-500">Future payouts based on current schedule (detailed list)</p>
        </div>
        <div className="p-6">
          {data.upcomingProjections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No upcoming payouts scheduled.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.upcomingProjections.map((projection) => (
                    <tr key={projection.position} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">#{projection.position}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{projection.memberName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(projection.expectedDate)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatAmount(projection.amount)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          ⏳ Scheduled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
