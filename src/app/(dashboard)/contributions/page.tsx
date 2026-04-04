import { EmptyState } from "@/components/ui/EmptyState";

export default function ContributionsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Contributions</h1>
        <p className="text-sm text-gray-500 mt-1">Track your contribution history and payment status.</p>
      </div>
      <EmptyState
        title="My Contributions content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
