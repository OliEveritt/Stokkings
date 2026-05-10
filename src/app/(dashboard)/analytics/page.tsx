"use client";

import { useRouter } from "next/navigation";
import { LineChart, CircleDollarSign, Settings } from "lucide-react";

const REPORTS = [
  {
    id: "contribution-compliance",
    label: "Contribution Compliance",
    description: "View each member's compliance percentage over time and identify members falling behind on payments.",
    icon: LineChart,
    path: "/analytics/contribution-compliance",
    available: true,
  },
  {
    id: "payout-history",
    label: "Payout History",
    description: "Track payout distributions across all group members over time.",
    icon: CircleDollarSign,
    path: "/analytics/payouts",
    available: false,
  },
  {
    id: "custom-reports",
    label: "Custom Reports",
    description: "Build and export custom reports for your group's financial activity.",
    icon: Settings,
    path: "/analytics/custom",
    available: false,
  },
];

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Contribution compliance, payout history, and custom reports.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => report.available && router.push(report.path)}
              disabled={!report.available}
              className={`text-left p-5 bg-white border rounded-xl transition-all ${
                report.available
                  ? "border-gray-200 hover:border-emerald-400 hover:shadow-sm cursor-pointer"
                  : "border-dashed border-gray-200 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${report.available ? "bg-emerald-50" : "bg-gray-50"}`}>
                  <Icon size={18} className={report.available ? "text-emerald-600" : "text-gray-400"} />
                </div>
                {!report.available && (
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">{report.label}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{report.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}