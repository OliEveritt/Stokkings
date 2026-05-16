"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface DataPoint {
  period: string;
  amount: number;
  cumulative: number;
}

interface Props {
  dataPoints: DataPoint[];
}

function formatPeriod(value: string): string {
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("default", {
    month: "short", year: "numeric",
  });
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency", currency: "ZAR", maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{formatPeriod(label)}</p>
      <div className="space-y-1">
        <p className="text-emerald-600 font-medium">Cumulative: {formatAmount(payload[0]?.value)}</p>
        <p className="text-gray-500">This month: {formatAmount(payload[1]?.value)}</p>
      </div>
    </div>
  );
}

export default function SavingsGrowthChart({ dataPoints }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={dataPoints} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickFormatter={formatPeriod}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#059669"
          strokeWidth={2.5}
          fill="url(#savingsGradient)"
          dot={{ r: 4, fill: "#059669", strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#0d9488"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}