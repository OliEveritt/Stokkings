import { EmptyState } from "@/components/ui/EmptyState";

export default function ManageContributionsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Contributions</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage member contributions.</p>
      </div>
      <EmptyState
        title="Manage Contributions content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
