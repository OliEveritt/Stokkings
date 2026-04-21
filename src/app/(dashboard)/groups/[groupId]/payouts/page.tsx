"use client";

import { use, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, writeBatch, doc } from "firebase/firestore";
import { reorderSchedule } from "@/lib/utils/payout-utils";
import { GripVertical, Calculator, ShieldCheck } from "lucide-react";

export default function PayoutPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "payout_schedules"), where("groupId", "==", groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedule(data.sort((a, b) => a.position - b.position));
    });
    return () => unsubscribe();
  }, [groupId]);

  const handleReorder = async (startIndex: number, endIndex: number) => {
    const newOrder = reorderSchedule(schedule, startIndex, endIndex);
    const batch = writeBatch(db);
    
    newOrder.forEach((item) => {
      const ref = doc(db, "payout_schedules", item.id);
      batch.update(ref, { position: item.position });
    });

    await batch.commit(); // Atomic update for financial consistency
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg">
          <Calculator size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Payout Schedule</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">US-2.6: Rotational Integrity</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        {schedule.map((item, index) => (
          <div key={item.id} className="flex items-center p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
            <div className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-emerald-500 mr-6">
              <GripVertical size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-emerald-600 mb-1">POSITION {item.position}</p>
              <h3 className="font-bold text-gray-800">{item.memberName}</h3>
            </div>
            <div className="text-right">
              <p className="font-black text-gray-900">R {item.amount.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-gray-400">{item.expectedDate}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <ShieldCheck className="text-blue-500" size={20} />
        <p className="text-xs text-blue-700 font-medium">
          <strong>Audit Note:</strong> Drag and drop updates are processed via Firestore Batched Writes to ensure all positions are updated atomically.
        </p>
      </div>
    </div>
  );
}