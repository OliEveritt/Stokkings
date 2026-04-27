<<<<<<< Updated upstream
"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import PayoutScheduleTable from "@/components/dashboard/PayoutScheduleTable";

export default function PayoutSchedulePage() {
  const { user } = useFirebaseAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayouts() {
      if (!user) return;
      try {
        // 1. First, find the group this user belongs to
        const groupQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid));
        const groupSnap = await getDocs(groupQuery);
        
        if (!groupSnap.empty) {
          const groupData = groupSnap.docs[0].data();
          const groupId = groupSnap.docs[0].id;

          // 2. Fetch the specific payout schedule for this group
          const payoutQuery = query(
            collection(db, "payout_schedules"),
            where("groupId", "==", groupId),
            orderBy("position", "asc")
          );
          
          const payoutSnap = await getDocs(payoutQuery);
          const list = payoutSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          setSchedule(list);
        }
      } catch (error) {
        console.error("Error fetching payout schedule:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayouts();
  }, [user]);

  if (loading) return <div className="p-8 animate-pulse text-gray-500">Calculating schedule...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payout Schedule</h1>
        <p className="text-gray-500 text-sm">View and manage the sequence of group payouts.</p>
      </div>

      {schedule.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed rounded-3xl">
          <p className="text-gray-400">No payout rotation has been set for this group yet.</p>
        </div>
      ) : (
        <PayoutScheduleTable 
          schedule={schedule} 
          isTreasurer={user?.role === "Admin" || user?.role === "Treasurer"} 
        />
      )}
=======
import PayoutSchedule from "@/components/payouts/PayoutSchedule";

export default function PayoutsPage() {
  // In your real app, pull these from your Auth Context/Session
  const currentGroupId = "stokvel_alpha_2026"; 
  const currentUserRole = "Admin"; 

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-10">
      <PayoutSchedule 
        groupId={currentGroupId} 
        userRole={currentUserRole} 
      />
>>>>>>> Stashed changes
    </div>
  );
}