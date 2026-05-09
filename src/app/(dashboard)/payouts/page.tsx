"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import PayoutSchedule from "@/components/payouts/PayoutSchedule";

interface GroupOption {
  id: string;
  name: string;
}

export default function PayoutSchedulePage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupRole, setGroupRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "groups"), where("members", "array-contains", user.uid))
        );
        if (cancelled) return;
        const list: GroupOption[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().group_name as string) ?? (d.data().name as string) ?? "Group",
        }));
        setGroups(list);
        if (list.length > 0) {
          setSelectedGroupId((current) => current || list[0].id);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  useEffect(() => {
    if (!user || !selectedGroupId) {
      setGroupRole(null);
      return;
    }
    getDoc(doc(db, "groups", selectedGroupId, "group_members", user.uid)).then((snap) => {
      setGroupRole(snap.exists() ? (snap.data().role as string) : null);
    });
  }, [user, selectedGroupId]);

  if (loading || authLoading) {
    return <div className="p-8 animate-pulse text-gray-500">Loading payout schedule...</div>;
  }

  if (groups.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No groups</h1>
        <p className="text-gray-600">Join or create a group to see a payout schedule.</p>
      </div>
    );
  }

  const role =
    groupRole === "Admin" ||
    user?.role === "Admin" ||
    user?.role === "Treasurer"
      ? "Treasurer"
      : "Member";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payout Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">
            {groups.find((g) => g.id === selectedGroupId)?.name ?? "Select a group"}
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

      {selectedGroupId && <PayoutSchedule groupId={selectedGroupId} userRole={role} />}
    </div>
  );
}
