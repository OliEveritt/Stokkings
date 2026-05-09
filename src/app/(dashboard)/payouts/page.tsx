"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import PayoutScheduleTable from "@/components/dashboard/PayoutScheduleTable";
import { Loader2, CalendarRange } from "lucide-react";

export default function PayoutSchedulePage() {
  // Destructure userRole and loading state from context to fix ts(2304) and ts(2339)
  const { user, userRole, loading: authLoading } = useFirebaseAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayouts() {
      if (!user) return;
      
      try {
        setLoading(true);
        // 1. Identify which group the user belongs to
        const groupQuery = query(
          collection(db, "groups"), 
          where("members", "array-contains", user.uid)
        );
        const groupSnap = await getDocs(groupQuery);
        
        if (!groupSnap.empty) {
          const groupId = groupSnap.docs[0].id;
          
          // 2. Fetch the specific payout rotation for that group
          const payoutQuery = query(
            collection(db, "payout_schedules"),
            where("groupId", "==", groupId),
            orderBy("position", "asc")
          );
          
          const payoutSnap = await getDocs(payoutQuery);
          const list = payoutSnap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          setSchedule(list);
        }
      } catch (error) {
        console.error("Audit Failure - Payout Schedule Fetch:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchPayouts();
    }
  }, [user, authLoading]);

  // Handle loading states for both Auth and Data
  if (authLoading || loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="animate-spin mb-4 text-emerald-600" size={32} />
        <p className="font-medium animate-pulse">Synchronizing rotation ledger...</p>
      </div>
    );
  }

  // Fixed duplicate declaration and used context-provided userRole
  const isAuthorized = userRole === "Admin" || userRole === "Treasurer";

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
          <CalendarRange size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Payout Rotation</h1>
          <p className="text-sm text-gray-500">Official sequence for group payouts</p>
        </div>
      </header>

      {schedule.length === 0 ? (
        <div className="bg-white p-16 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarRange className="text-gray-300" size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No rotation set</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">
            The group treasurer hasn't finalized the payout order for this cycle yet.
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PayoutScheduleTable 
            schedule={schedule} 
            isTreasurer={isAuthorized} 
          />
        </div>
      )}
    </div>
  );
}