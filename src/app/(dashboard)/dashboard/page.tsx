// src/app/(dashboard)/dashboard/page.tsx
import { getDashboardStats } from "../actions"; // Import our Back Office engine
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function DashboardPage() {
  // 1. Fetch live metrics for Group ID 1 (Soweto Savings Circle) 
  const liveStats = await getDashboardStats(2);

  // 2. Formatting engine for South African currency
  const zar = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  });

  // 3. Re-mapping the live data to the StatCard structure
  const dynamicStats = [
    { 
      label: "Total Contributions", 
      value: zar.format(liveStats.totalContributions), 
      color: "text-emerald-700", 
      bg: "bg-emerald-50" 
    },
    { 
      label: "Members", 
      value: liveStats.memberCount.toString(), 
      color: "text-blue-700", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Next Payout", 
      value: liveStats.nextPayout 
        ? new Date(liveStats.nextPayout).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
        : "TBD", 
      color: "text-amber-700", 
      bg: "bg-amber-50" 
    },
    { 
      label: "Compliance Rate", 
      value: `${liveStats.complianceRate}%`, 
      color: "text-violet-700", 
      bg: "bg-violet-50" 
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back! Here&apos;s a live overview of your stokvel group.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dynamicStats.map((c, i) => (
          <StatCard key={i} label={c.label} value={c.value} color={c.color} bg={c.bg} />
        ))}
      </div>

      <EmptyState
        title="Recent Activity"
        subtitle="Sprint 2 backlog — Transaction history coming soon"
      />
    </div>
  );
}