import { EmptyState } from "@/components/ui/EmptyState";

export default function MeetingDetailPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meeting Details</h1>
        <p className="text-sm text-gray-500 mt-1">View meeting agenda, minutes, and attendance.</p>
      </div>
      <EmptyState
        title="Meeting Details content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
