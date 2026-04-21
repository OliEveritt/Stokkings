"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRates } from "@/hooks/useRates";
import { SavingsProjection } from "@/components/charts/SavingsProjection";
import {
  calculateProjection,
  getProjectionSummary,
} from "@/services/projection.service";

interface Contribution {
  id: string;
  amount: number;
  contributionDate: string;
  status: string;
}

function formatZAR(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
}

export default function SavingsProjectionPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const { rates, loading: ratesLoading } = useRates();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchContributions() {
      try {
        const q = query(
          collection(db, "contributions"),
          where("userId", "==", user!.uid)
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setContributions(
            snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contribution))
          );
        }
      } catch {
        if (!cancelled) setError("Failed to load contributions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchContributions();
    return () => { cancelled = true; };
  }, [user]);

  const isLoading = authLoading || loading || ratesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading projection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  const confirmedContributions = contributions.filter(
    (c) => c.status?.toLowerCase() === "confirmed"
  );

  const hasContributions = confirmedContributions.length > 0;

  const principal = confirmedContributions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  const monthlyPMT =
    confirmedContributions.length > 0
      ? principal / confirmedContributions.length
      : 0;

  const annualRate = rates.prime || 0;

  const projectionData = hasContributions
    ? calculateProjection({ principal, monthlyPMT, annualRate, months: 12 })
    : [];

  const { at6, at12 } = hasContributions
    ? getProjectionSummary(projectionData)
    : { at6: null, at12: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Savings Projection</h1>
        <p className="text-gray-500 mt-1">
          See how your savings could grow using the current prime lending rate.
        </p>
      </div>

      {!hasContributions ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">📈</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No contributions yet
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Savings projections require at least one confirmed contribution.
            Once you have contributed, we will calculate how your savings could
            grow over 6 and 12 months.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Savings</p>
              <p className="text-2xl font-bold text-gray-900">{formatZAR(principal)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Projected at 6 months</p>
              <p className="text-2xl font-bold text-blue-600">
                {at6 ? formatZAR(at6.withInterest) : "—"}
              </p>
              {at6 && (
                <p className="text-xs text-green-600 mt-1">
                  +{formatZAR(at6.withInterest - principal)} with interest
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Projected at 12 months</p>
              <p className="text-2xl font-bold text-blue-600">
                {at12 ? formatZAR(at12.withInterest) : "—"}
              </p>
              {at12 && (
                <p className="text-xs text-green-600 mt-1">
                  +{formatZAR(at12.withInterest - principal)} with interest
                </p>
              )}
            </div>
          </div>

          <SavingsProjection data={projectionData} annualRate={annualRate} />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500">
            Projections are estimates only. Formula: A = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) − 1) / (r/n)].
            Rate: prime {annualRate.toFixed(2)}% p.a., compounded monthly. Updated:{" "}
            {rates.updated
              ? new Date(rates.updated).toLocaleDateString("en-ZA")
              : "N/A"}
            .
          </div>
        </>
      )}
    </div>
  );
}
