import { EmptyState } from "@/components/ui/EmptyState";

export default function GroupSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Group Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure contribution amounts, payout frequency, and group details.</p>
      </div>
      <EmptyState
        title="Group Settings content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
