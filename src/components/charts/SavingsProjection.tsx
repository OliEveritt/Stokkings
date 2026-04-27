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
  ReferenceLine,
} from "recharts";
import type { ProjectionDataPoint } from "@/services/projection.service";

interface Props {
  data: ProjectionDataPoint[];
  annualRate: number;
}

function formatZAR(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 mb-1">
        {label === "0" || label === 0 ? "Now" : `Month ${label}`}
      </p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatZAR(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function SavingsProjection({ data, annualRate }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">12-Month Savings Projection</h2>
        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-medium">
          Prime rate: {annualRate.toFixed(2)}% p.a.
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Projected growth using monthly compounding at the current prime lending rate.
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tickFormatter={(v) => (v === 0 ? "Now" : `${v}m`)}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis
            tickFormatter={(v) => formatZAR(v)}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            width={88}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
          />
          <ReferenceLine x={6} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: "6 mo", position: "top", fontSize: 11, fill: "#9ca3af" }} />
          <ReferenceLine x={12} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: "12 mo", position: "top", fontSize: 11, fill: "#9ca3af" }} />
          <Line
            type="monotone"
            dataKey="withInterest"
            name="With Interest"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="withoutInterest"
            name="Without Interest"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
