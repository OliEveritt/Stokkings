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
        const groupQuery = query(collection(db, "groups"), where("members", "array-contains", user.uid));
        const groupSnap = await getDocs(groupQuery);
        
        if (!groupSnap.empty) {
          const groupId = groupSnap.docs[0].id;
          const payoutQuery = query(
            collection(db, "payout_schedules"),
            where("groupId", "==", groupId),
            orderBy("position", "asc")
          );
          const payoutSnap = await getDocs(payoutQuery);
          setSchedule(payoutSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (error) {
        console.error("Error fetching payouts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayouts();
  }, [user]);

  if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading schedule...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payout Schedule</h1>
      {schedule.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed rounded-xl text-gray-400">
          No payout rotation has been set yet.
        </div>
      ) : (
        <PayoutScheduleTable 
          schedule={schedule} 
          isTreasurer={userRole === "Admin" || userRole === "Treasurer"} 
        />
      )}
    </div>
  );
}