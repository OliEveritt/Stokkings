"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import ScheduleMeetingForm from "@/components/forms/ScheduleMeetingForm";

interface GroupOption {
  id: string;
  name: string;
}

export default function NewMeetingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "groups"), where("members", "array-contains", user.uid))
        );
        const list: GroupOption[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().group_name as string) ?? (d.data().name as string) ?? "Group",
        }));
        setGroups(list);
        if (list.length > 0) setSelectedGroupId(list[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user]);

  if (loading || authLoading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  if (groups.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No groups available</h1>
        <p className="text-gray-600">Join or create a group before scheduling a meeting.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-gray-900 mb-1">Schedule Meeting</h1>
      <p className="text-sm text-gray-500 mb-6">
        Pick a group and enter the meeting details.
      </p>

      <div className="mb-6">
        <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">
          Group
        </label>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-50 border border-transparent focus:border-emerald-500 outline-none text-sm"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {selectedGroupId && (
        <ScheduleMeetingForm
          groupId={selectedGroupId}
          onScheduled={() => router.push(`/groups/${selectedGroupId}/meetings`)}
        />
      )}
    </div>
  );
}
