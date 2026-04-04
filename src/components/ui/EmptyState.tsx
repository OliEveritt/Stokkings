import { ClipboardList } from "lucide-react";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
      <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      {subtitle && (
        <p className="text-gray-300 text-xs mt-1">{subtitle}</p>
      )}
    </div>
  );
}
