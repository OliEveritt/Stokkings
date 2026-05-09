"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import PayoutSchedule from "@/components/payouts/PayoutSchedule";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GroupPayoutsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [groupRole, setGroupRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !groupId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "groups", groupId, "group_members", user.uid));
        setGroupRole(snap.exists() ? (snap.data().role as string) : null);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, groupId]);

  if (loading || authLoading) {
    return <div className="p-8 text-gray-500">Loading payout schedule...</div>;
  }

  if (!groupRole) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Not a member</h1>
        <p className="text-gray-600">You need to be a member of this group to view its payout schedule.</p>
      </div>
    );
  }

  // Treasurer access combines group-level role and top-level role.
  // Group Admins always have treasurer powers in their group.
  const topLevelRole = user?.role;
  const role =
    groupRole === "Admin" || topLevelRole === "Admin" || topLevelRole === "Treasurer"
      ? "Treasurer"
      : "Member";

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-10">
      <div className="max-w-4xl mx-auto mb-6">
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          Back to group
        </Link>
      </div>
      <PayoutSchedule groupId={groupId!} userRole={role} />
    </div>
  );
}
