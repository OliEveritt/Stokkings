"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";

export default function GroupDashboardPage() {
  const { id } = useParams(); // 👈 This grabs 'KambuKgIkl62CZGDZ2hs'
  const { user } = useFirebaseAuth();
  const [group, setGroup] = useState<any>(null);

  useEffect(() => {
    async function fetchGroup() {
      if (id) {
        const docRef = doc(db, "groups", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGroup(docSnap.data());
        }
      }
    }
    fetchGroup();
  }, [id]);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-black text-gray-900">Group Dashboard</h1>
      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
        <p className="text-xs font-bold text-emerald-600 uppercase">Active Group ID</p>
        <p className="text-lg font-mono text-emerald-900">{id}</p>
      </div>
      
      {group ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
           <h2 className="text-xl font-bold">{group.group_name}</h2>
           {/* PayoutScheduleTable and PendingInvites go here, passing 'id' */}
        </div>
      ) : (
        <p>Loading group data...</p>
      )}
    </div>
  );
}