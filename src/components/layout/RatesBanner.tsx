"use client";

import type { Rates } from "@/types";

export default function RatesBanner({ rates }: { rates: Rates }) {
  return (
    <div className="bg-emerald-900 text-white py-2 px-4 text-xs font-medium flex justify-center gap-6 shadow-inner">
      <div className="flex items-center gap-2">
        <span className="text-emerald-400 font-bold uppercase tracking-wider">SARB Repo Rate:</span>
        <span>{rates.repo}%</span>
      </div>
      <div className="flex items-center gap-2 border-l border-emerald-800 pl-6">
        <span className="text-emerald-400 font-bold uppercase tracking-wider">Prime Lending:</span>
        <span>{rates.prime}%</span>
      </div>
      <div className="hidden sm:block border-l border-emerald-800 pl-6 text-emerald-500">
        As of {rates.updated}
      </div>
    </div>
  );
}