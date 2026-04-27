"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  writeBatch, 
  doc,
  where 
} from "firebase/firestore";
import { GripVertical, Calendar, CheckCircle2, Shield } from "lucide-react";

interface PayoutMember {
  id: string;
  memberName: string; // Matches Firestore field exactly
  position: number;
  amount: number;
  expectedDate: string; // From your Firestore screenshot (string)
  status: string;
}

export default function PayoutSchedule({ groupId, userRole }: { groupId: string, userRole: string }) {
  const [items, setItems] = useState<PayoutMember[]>([]);
  const isTreasurer = userRole === 'Admin';

  useEffect(() => {
    // UAT 1: Fetch ordered list from top-level collection
    const q = query(
      collection(db, "payout_schedules"), 
      where("groupId", "==", groupId), 
      orderBy("position", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as PayoutMember)));
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [groupId]);

  // UAT 2: Persist reorder to DB
  const updateOrderInDb = async (newItems: PayoutMember[]) => {
    if (!isTreasurer) return;
    const batch = writeBatch(db);
    newItems.forEach((item, index) => {
      const ref = doc(db, "payout_schedules", item.id);
      batch.update(ref, { position: index + 1 });
    });
    
    try {
      await batch.commit();
    } catch (error) {
      console.error("Failed to update payout order:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-[3rem] shadow-2xl border border-gray-100">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Payout Schedule</h2>
          <p className="text-gray-400 font-semibold mt-1">Official Rotational Sequence</p>
        </div>
        {isTreasurer && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-widest">
            <Shield size={14} /> Treasurer Access
          </div>
        )}
      </div>

      <div className="space-y-4">
        {items.length === 0 && <p className="text-center text-gray-400 py-10 italic">No schedule found for this group.</p>}
        
        {items.map((member, index) => (
          <div 
            key={member.id}
            className={`group flex items-center p-6 rounded-[2rem] border transition-all duration-300 ${
              isTreasurer ? "hover:border-emerald-300 cursor-move bg-gray-50/30 hover:bg-white hover:shadow-lg" : "border-gray-50 bg-gray-50/50"
            }`}
          >
            {isTreasurer && <GripVertical className="text-gray-300 mr-4 group-hover:text-emerald-400" size={24} />}
            
            <div className="flex-1 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-black text-xl text-gray-900 shadow-sm">
                {index + 1}
              </div>
              <div>
                {/* 🔍 Mapping memberName from interface */}
                <h3 className="font-bold text-lg text-gray-900">{member.memberName}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                   <Calendar size={12} /> Expected: {member.expectedDate || 'TBD'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[0.6rem] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Payout Amount</p>
                <p className="text-xl font-black text-emerald-600 tracking-tight">R{member.amount?.toLocaleString()}</p>
              </div>
              {member.status === 'paid' ? (
                <CheckCircle2 className="text-emerald-500" size={28} />
              ) : (
                <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-200" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}