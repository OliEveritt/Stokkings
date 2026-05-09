"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import Link from "next/link";
import ContributionForm from "@/components/forms/ContributionForm";

interface Member {
  id: string;
  userId: string;
  email?: string;
  displayName?: string;
  role: string;
  joinedAt: Timestamp | string | null;
}

interface GroupData {
  group_name?: string;
  name?: string;
  contribution_amount?: number;
  payout_frequency?: string;
  payout_order?: string;
  created_by_name?: string;
  created_at?: Timestamp | string;
}

interface ContributionAggregate {
  total: number;
  count: number;
  byMember: Record<string, number>;
}

const emptyAggregate: ContributionAggregate = { total: 0, count: 0, byMember: {} };

interface NextPayout {
  userId?: string;
  memberName?: string;
  amount?: number;
}

const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

const PAID_STATUSES = new Set(["verified", "confirmed", "paid"]);

function formatDate(value: Timestamp | string | null | undefined): string {
  if (!value) return "—";
  if (typeof value === "string") return new Date(value).toLocaleDateString();
  if (typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toLocaleDateString();
  }
  return "—";
}

export default function GroupDashboardPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useFirebaseAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [contributions, setContributions] = useState<ContributionAggregate>(emptyAggregate);
  const [nextPayout, setNextPayout] = useState<NextPayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!groupId || !user) return;
    const groupRef = doc(db, "groups", groupId);
    getDoc(groupRef).then((snap) => {
      if (snap.exists()) setGroup(snap.data() as GroupData);
    });
    const memberRef = doc(db, "groups", groupId, "group_members", user.uid);
    getDoc(memberRef).then((snap) => {
      const role = snap.data()?.role;
      setIsAdmin(role === "Admin");
      setIsMember(snap.exists());
    });
  }, [groupId, user]);

  useEffect(() => {
    if (!groupId) return;
    const membersRef = collection(db, "groups", groupId, "group_members");
    const q = query(membersRef, orderBy("joinedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Member[];
      setMembers(memberList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "payout_schedules"),
      where("groupId", "==", groupId),
      orderBy("position", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const first = snap.docs[0]?.data() as NextPayout | undefined;
      setNextPayout(first ?? null);
    });
    return () => unsub();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, "contributions"), where("groupId", "==", groupId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        let total = 0;
        let count = 0;
        const byMember: Record<string, number> = {};
        snap.forEach((d) => {
          const data = d.data() as { amount?: number; status?: string; userId?: string; memberId?: string };
          if (!PAID_STATUSES.has(data.status ?? "")) return;
          const amount = Number(data.amount) || 0;
          total += amount;
          count += 1;
          const member = data.userId || data.memberId || "unknown";
          byMember[member] = (byMember[member] ?? 0) + amount;
        });
        setContributions({ total, count, byMember });
      },
      (err) => console.error("contributions snapshot error:", err)
    );
    return () => unsub();
  }, [groupId]);

  if (loading) {
    return <div className="p-8 text-center">Loading group...</div>;
  }

  const groupName = group?.group_name || group?.name || "Group";
  const contributionAmount = group?.contribution_amount;
  const expectedTotalPerCycle = contributionAmount ? contributionAmount * members.length : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{groupName}</h1>
          <p className="text-xs text-gray-400 font-mono mt-1">{groupId}</p>
          {group?.created_by_name && (
            <p className="text-sm text-gray-500 mt-1">
              Created by {group.created_by_name} · {formatDate(group.created_at)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/groups/${groupId}/payouts`}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 text-gray-700 font-semibold py-2 px-5 rounded-xl transition-all"
          >
            Payout Schedule
          </Link>
          <Link
            href={`/groups/${groupId}/meetings`}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 text-gray-700 font-semibold py-2 px-5 rounded-xl transition-all"
          >
            Meetings
          </Link>
          {isAdmin && (
            <Link
              href={`/groups/${groupId}/invite`}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl transition-all"
            >
              + Invite Members
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Members"
          value={String(members.length)}
        />
        <SummaryCard
          label="Contribution / cycle"
          value={contributionAmount != null ? ZAR.format(contributionAmount) : "—"}
        />
        <SummaryCard
          label="Total contributed"
          value={ZAR.format(contributions.total)}
          sub={`${contributions.count} payment${contributions.count === 1 ? "" : "s"}`}
        />
        <SummaryCard
          label="Expected / cycle"
          value={expectedTotalPerCycle != null ? ZAR.format(expectedTotalPerCycle) : "—"}
          sub={contributionAmount ? `${ZAR.format(contributionAmount)} × ${members.length}` : undefined}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <SummaryCard label="Payout frequency" value={group?.payout_frequency || "—"} />
        <SummaryCard label="Payout order" value={group?.payout_order || "—"} />
        <SummaryCard
          label="Avg / member"
          value={
            members.length > 0
              ? ZAR.format(contributions.total / members.length)
              : "—"
          }
        />
      </div>

      {isMember && (
        <div className="mb-8">
          <ContributionForm
            groupId={groupId!}
            defaultAmount={contributionAmount}
            disabled={!!nextPayout && nextPayout.userId !== user?.uid}
            disabledReason={
              nextPayout && nextPayout.userId !== user?.uid
                ? `Next contribution: ${nextPayout.memberName ?? "—"}`
                : undefined
            }
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-500">
            Members ({members.length})
          </h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {members.map((member) => {
            const contributed = contributions.byMember[member.userId] ?? 0;
            return (
              <li
                key={member.id}
                className="px-6 py-4 flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {member.displayName || member.email || member.userId}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Joined {formatDate(member.joinedAt)} · Contributed {ZAR.format(contributed)}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    member.role === "Admin"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {member.role}
                </span>
              </li>
            );
          })}
          {members.length === 0 && (
            <li className="px-6 py-12 text-center text-gray-400">
              No members yet. Invite your first member!
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
        {label}
      </div>
      <div className="mt-2 text-2xl font-black text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
