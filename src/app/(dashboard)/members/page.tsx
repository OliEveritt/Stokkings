import { EmptyState } from "@/components/ui/EmptyState";

export default function MembersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Member Management</h1>
        <p className="text-sm text-gray-500 mt-1">View members, assign roles, and manage the group.</p>
      </div>
      <EmptyState
        title="Member Management content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
