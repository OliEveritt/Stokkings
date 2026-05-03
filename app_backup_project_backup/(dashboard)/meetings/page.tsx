import { EmptyState } from "@/components/ui/EmptyState";

export default function MeetingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meetings</h1>
        <p className="text-sm text-gray-500 mt-1">View upcoming meetings, agendas, and past minutes.</p>
      </div>
      <EmptyState
        title="Meetings content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
