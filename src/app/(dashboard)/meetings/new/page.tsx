import { EmptyState } from "@/components/ui/EmptyState";

export default function NewMeetingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Schedule Meeting</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new meeting for your group.</p>
      </div>
      <EmptyState
        title="Schedule Meeting form will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
