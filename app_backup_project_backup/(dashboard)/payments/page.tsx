import { EmptyState } from "@/components/ui/EmptyState";

export default function PaymentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Make a Payment</h1>
        <p className="text-sm text-gray-500 mt-1">Pay your contribution online via Yoco.</p>
      </div>
      <EmptyState
        title="Make a Payment content will be implemented here"
        subtitle="Sprint backlog item — ready for development"
      />
    </div>
  );
}
