"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
  where,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { ArrowUp, ArrowDown, Calendar, CheckCircle2, Shield } from "lucide-react";

interface PayoutMember {
  id: string;
  memberName: string;
  position: number;
  amount: number;
  expectedDate: string;
  status: string;
  userId?: string;
  groupId: string;
  cycleNumber?: number;
}

interface GroupData {
  group_name?: string;
  contribution_amount?: number;
  payout_frequency?: string;
}

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
};

function nextDate(start: Date, frequency: string, index: number): Date {
  const days = FREQUENCY_DAYS[frequency?.toLowerCase()] ?? 30;
  const d = new Date(start);
  d.setDate(d.getDate() + days * (index + 1));
  return d;
}

export default function PayoutSchedule({
  groupId,
  userRole,
}: {
  groupId: string;
  userRole: string;
}) {
  const [items, setItems] = useState<PayoutMember[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTreasurer = userRole === "Admin" || userRole === "Treasurer";
  const currentCycle = items.length > 0
    ? Math.max(...items.map((i) => i.cycleNumber ?? 1))
    : null;

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "payout_schedules"),
      where("groupId", "==", groupId),
      orderBy("position", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PayoutMember)));
      },
      (err) => {
        console.error("Payout snapshot error:", err);
        setError("Could not load payout schedule");
      }
    );
    return () => unsub();
  }, [groupId]);

  const move = async (index: number, direction: "up" | "down") => {
    if (!isTreasurer) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

    const batch = writeBatch(db);
    reordered.forEach((item, i) => {
      batch.update(doc(db, "payout_schedules", item.id), { position: i + 1 });
    });
    try {
      await batch.commit();
    } catch (err) {
      console.error("Reorder failed:", err);
      setError("Failed to save new order. Are you a Treasurer?");
    }
  };

  const generateSchedule = async () => {
    if (!isTreasurer) return;
    setGenerating(true);
    setError(null);
    try {
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      if (!groupSnap.exists()) throw new Error("Group not found");
      const group = groupSnap.data() as GroupData;
      const frequency = group.payout_frequency ?? "monthly";
      const contribution = group.contribution_amount ?? 0;

      const membersSnap = await getDocs(collection(db, "groups", groupId, "group_members"));
      if (membersSnap.empty) {
        setError("Cannot generate schedule: no members in this group yet.");
        return;
      }

      const members = membersSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as { userId?: string; email?: string; displayName?: string; name?: string }),
      }));

      const payoutAmount = contribution * members.length;
      const start = new Date();

      const batch = writeBatch(db);
      members.forEach((member, i) => {
        const ref = doc(collection(db, "payout_schedules"));
        batch.set(ref, {
          groupId,
          userId: member.userId ?? member.id,
          memberName:
            member.name ?? member.displayName ?? member.email ?? `Member ${i + 1}`,
          position: i + 1,
          amount: payoutAmount,
          expectedDate: nextDate(start, frequency, i).toISOString(),
          status: "scheduled",
          cycleNumber: 1,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Generate schedule failed:", err);
      setError("Failed to generate schedule. Are you a Treasurer?");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[3rem] shadow-2xl border border-gray-100">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
            Payout Schedule
          </h2>
          <p className="text-gray-400 font-semibold mt-1">Official Rotational Sequence</p>
        </div>
        <div className="flex items-center gap-2">
          {currentCycle !== null && (
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl text-xs font-black uppercase tracking-widest">
              Cycle {currentCycle}
            </div>
          )}
          {isTreasurer && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-widest">
              <Shield size={14} /> Treasurer Access
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm">{error}</div>
      )}

      {items.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-400 italic mb-4">No schedule found for this group.</p>
          {isTreasurer && (
            <button
              onClick={generateSchedule}
              disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl"
            >
              {generating ? "Generating..." : "Generate Schedule From Members"}
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {items.map((member, index) => (
          <div
            key={member.id}
            className="group flex items-center p-6 rounded-[2rem] border border-gray-100 bg-gray-50/30 hover:bg-white hover:shadow-lg transition-all duration-300"
          >
            <div className="flex-1 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-black text-xl text-gray-900 shadow-sm">
                {index + 1}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{member.memberName}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                  <Calendar size={12} />
                  Expected:{" "}
                  {member.expectedDate
                    ? new Date(member.expectedDate).toLocaleDateString()
                    : "TBD"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[0.6rem] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                  Payout Amount
                </p>
                <p className="text-xl font-black text-emerald-600 tracking-tight">
                  R{member.amount?.toLocaleString() ?? 0}
                </p>
              </div>
              {member.status === "paid" ? (
                <CheckCircle2 className="text-emerald-500" size={28} />
              ) : (
                <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-200" />
              )}
              {isTreasurer && (
                <div className="flex flex-col">
                  <button
                    onClick={() => move(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-20"
                    aria-label="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => move(index, "down")}
                    disabled={index === items.length - 1}
                    className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-20"
                    aria-label="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
