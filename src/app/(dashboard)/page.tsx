"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function DashboardLanding() {
  const { user } = useFirebaseAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchGroups = async () => {
      setLoading(true);
      try {
        // 1. Search the Bridge Collection (group_members)
        const qBridge = query(collection(db, "group_members"), where("userId", "==", user.uid));
        const bridgeSnap = await getDocs(qBridge);
        const bridgeResults = bridgeSnap.docs.map(doc => ({ 
          id: doc.data().groupId, 
          name: doc.data().groupName || "Unnamed Group" 
        }));

        // 2. Search the Group Collection (array-contains)
        const qArray = query(collection(db, "groups"), where("members", "array-contains", user.uid));
        const arraySnap = await getDocs(qArray);
        const arrayResults = arraySnap.docs.map(doc => ({ 
          id: doc.id, 
          name: doc.data().group_name || doc.data().name || "Unnamed Group" 
        }));

        // 3. Merge and De-duplicate (to ensure no double entries)
        const allGroups = Array.from(new Map([...bridgeResults, ...arrayResults].map(g => [g.id, g])).values());
        
        setGroups(allGroups);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-emerald-600" size={48} />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Auditing Memberships...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Active Groups</h1>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.length === 0 ? (
          <div className="col-span-full p-20 border-2 border-dashed border-gray-100 rounded-[3.5rem] text-center bg-white">
            <p className="text-gray-400 font-bold italic">No active memberships found for {user.email}.</p>
            <p className="text-[10px] text-gray-300 uppercase mt-4 font-black">Standard Bank Ledger Audit: 0 Records</p>
          </div>
        ) : (
          groups.map(group => (
            <Link key={group.id} href={`/dashboard/${group.id}`}>
              <div className="group p-10 bg-white border border-gray-50 rounded-[3rem] shadow-xl hover:shadow-emerald-200/40 hover:border-emerald-500 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={28} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full uppercase">Verified</span>
                </div>
                <h2 className="font-black text-2xl text-gray-900 leading-none">{group.name}</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-6 tracking-widest">ID: {group.id.substring(0, 12)}...</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 