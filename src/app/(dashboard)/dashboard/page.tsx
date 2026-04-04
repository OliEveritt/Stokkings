import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

const stats = [
  { label: "Total Contributions", value: "R 24,500", color: "text-emerald-700", bg: "bg-emerald-50" },
  { label: "Members", value: "12", color: "text-blue-700", bg: "bg-blue-50" },
  { label: "Next Payout", value: "Apr 15", color: "text-amber-700", bg: "bg-amber-50" },
  { label: "Compliance Rate", value: "91%", color: "text-violet-700", bg: "bg-violet-50" },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back! Here&apos;s an overview of your stokvel group.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((c, i) => (
          <StatCard key={i} {...c} />
        ))}
      </div>
      <EmptyState
        title="Dashboard widgets will render here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
