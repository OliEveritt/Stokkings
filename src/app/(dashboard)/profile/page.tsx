import { EmptyState } from "@/components/ui/EmptyState";

export default function ProfilePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account details and preferences.</p>
      </div>
      <EmptyState
        title="Profile content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
