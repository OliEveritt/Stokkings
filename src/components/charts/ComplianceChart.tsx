"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MemberComplianceSummary } from "@/services/analytics.service";

interface Props {
  members: MemberComplianceSummary[];
  periods: string[];
}

// Emerald-first palette matching the app's design system
const COLORS = [
  "#059669", // emerald-600 (primary)
  "#0d9488", // teal-600
  "#0284c7", // sky-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#d97706", // amber-600
  "#dc2626", // red-600
  "#65a30d", // lime-600
];

function buildChartData(
  members: MemberComplianceSummary[],
  periods: string[]
): Record<string, string | number>[] {
  return periods.map((period) => {
    const row: Record<string, string | number> = { period };
    for (const member of members) {
      const entry = member.history.find((h) => h.period === period);
      row[member.memberName] = entry?.compliancePercentage ?? 0;
    }
    return row;
  });
}

function formatPeriod(value: string): string {
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });
}

// Custom tooltip styled to match the app
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{formatPeriod(label)}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.dataKey}:</span>
          <span className="font-semibold text-gray-900">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

export function ComplianceChart({ members, periods }: Props) {
  const data = buildChartData(members, periods);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickFormatter={formatPeriod}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          width={44}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
        />
        {members.map((member, i) => (
          <Line
            key={member.memberId}
            type="monotone"
            dataKey={member.memberName}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}