import { EmptyState } from "@/components/ui/EmptyState";

export default function PayoutsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payout Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage the group payout order.</p>
      </div>
      <EmptyState
        title="Payout Schedule content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
