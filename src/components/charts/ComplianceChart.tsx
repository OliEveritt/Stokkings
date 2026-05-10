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

const COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

/**
 * Transforms per-member history into the flat row-per-period shape Recharts expects:
 * [{ period: "2024-01", "Alice": 100, "Bob": 83 }, ...]
 */
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

export function ComplianceChart({ members, periods }: Props) {
  const data = buildChartData(members, periods);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} tickFormatter={formatPeriod} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 12 }}
          width={44}
        />
        <Tooltip formatter={(value: number) => [`${value}%`, "Compliance"]} />
        <Legend />
        {members.map((member, i) => (
          <Line
            key={member.memberId}
            type="monotone"
            dataKey={member.memberName}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}