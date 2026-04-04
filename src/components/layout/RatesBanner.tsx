import { TrendingUp } from "lucide-react";
import type { Rates } from "@/types";

export function RatesBanner({ rates }: { rates: Rates }) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800">
      <TrendingUp size={14} className="shrink-0" />
      <span>
        Repo Rate: <strong>{rates.repo}%</strong>
      </span>
      <span className="text-emerald-400">|</span>
      <span>
        Prime Rate: <strong>{rates.prime}%</strong>
      </span>
      <span className="ml-auto text-emerald-500">Updated {rates.updated}</span>
    </div>
  );
}
