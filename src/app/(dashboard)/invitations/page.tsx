import { EmptyState } from "@/components/ui/EmptyState";

export default function InvitationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invitations</h1>
        <p className="text-sm text-gray-500 mt-1">Invite new members to join the group.</p>
      </div>
      <EmptyState
        title="Invitations content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
