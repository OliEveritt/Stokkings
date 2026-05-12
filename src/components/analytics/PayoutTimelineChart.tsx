"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PayoutDataPoint {
  date: string;
  amount: number;
  type: "past" | "upcoming";
  memberName: string;
}

interface PayoutTimelineChartProps {
  pastPayouts: Array<{ payoutDate: string; amount: number; memberName: string }>;
  upcomingProjections: Array<{ expectedDate: string; amount: number; memberName: string }>;
}

export default function PayoutTimelineChart({
  pastPayouts,
  upcomingProjections,
}: PayoutTimelineChartProps) {
  // Combine and format data for the chart
  const chartData: PayoutDataPoint[] = [
    ...pastPayouts.map((p) => ({
      date: new Date(p.payoutDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }),
      amount: p.amount,
      type: "past" as const,
      memberName: p.memberName,
      fullDate: p.payoutDate,
    })),
    ...upcomingProjections.map((p) => ({
      date: new Date(p.expectedDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }),
      amount: p.amount,
      type: "upcoming" as const,
      memberName: p.memberName,
      fullDate: p.expectedDate,
    })),
  ].sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No payout data available to display in chart.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">Member: {data.memberName}</p>
          <p className="text-sm font-bold text-emerald-600">
            Amount: R {data.amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.type === "past" ? "✅ Completed" : "⏳ Scheduled"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Payout Timeline</h3>
      <p className="text-sm text-gray-500 mb-6">
        Visual timeline of past payouts and upcoming projections
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={70} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="amount" name="Payout Amount (R)" fill="#8884d8">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.type === "past" ? "#10b981" : "#f59e0b"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Past Payouts (Completed)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span>Upcoming Projected Payouts</span>
        </div>
      </div>
    </div>
  );
}
