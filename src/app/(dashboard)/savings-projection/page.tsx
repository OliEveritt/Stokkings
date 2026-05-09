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
  groupId: string;
}

interface GroupOption {
  id: string;
  name: string;
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
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchData() {
      try {
        const [contribSnap, groupsSnap] = await Promise.all([
          getDocs(query(collection(db, "contributions"), where("userId", "==", user!.uid))),
          getDocs(query(collection(db, "groups"), where("members", "array-contains", user!.uid))),
        ]);
        if (cancelled) return;
        const contribs = contribSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Contribution)
        );
        const groupList: GroupOption[] = groupsSnap.docs.map((d) => ({
          id: d.id,
          name: (d.data().group_name as string) ?? (d.data().name as string) ?? "Group",
        }));
        setContributions(contribs);
        setGroups(groupList);
        if (groupList.length > 0) {
          setSelectedGroupId((current) => current || groupList[0].id);
        }
      } catch {
        if (!cancelled) setError("Failed to load contributions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
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
    (c) =>
      c.status?.toLowerCase() === "confirmed" &&
      (!selectedGroupId || c.groupId === selectedGroupId)
  );

  const selectedGroupName =
    groups.find((g) => g.id === selectedGroupId)?.name ?? null;

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Savings Projection</h1>
          <p className="text-gray-500 mt-1">
            {selectedGroupName
              ? <>Showing projection for <span className="font-semibold text-gray-700">{selectedGroupName}</span> using the current prime lending rate.</>
              : "See how your savings could grow using the current prime lending rate."}
          </p>
        </div>
        {groups.length > 1 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">
              Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="mt-1 px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-emerald-500 outline-none text-sm font-semibold"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
              <p className="text-xs text-gray-500 mt-1">
                From {confirmedContributions.length} confirmed contribution{confirmedContributions.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Projected at 6 months</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">With interest</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {at6 ? formatZAR(at6.withInterest) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Without interest</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {at6 ? formatZAR(at6.withoutInterest) : "—"}
                  </p>
                </div>
                {at6 && (
                  <p className="text-xs text-green-600 pt-1">
                    +{formatZAR(at6.withInterest - at6.withoutInterest)} from interest
                  </p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Projected at 12 months</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">With interest</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {at12 ? formatZAR(at12.withInterest) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Without interest</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {at12 ? formatZAR(at12.withoutInterest) : "—"}
                  </p>
                </div>
                {at12 && (
                  <p className="text-xs text-green-600 pt-1">
                    +{formatZAR(at12.withInterest - at12.withoutInterest)} from interest
                  </p>
                )}
              </div>
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
