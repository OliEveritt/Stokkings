import { EmptyState } from "@/components/ui/EmptyState";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Contribution compliance, payout history, and custom reports.</p>
      </div>
      <EmptyState
        title="Analytics content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
