<<<<<<< HEAD
"use client";
import { useEffect, useState } from "react";
import { subscribeToPayouts, PayoutMember } from "@/services/payout.service";

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutMember[]>([]);
  const [isAdmin] = useState(true); // Logic to be linked to your Auth context

  useEffect(() => {
    // Replace with dynamic group ID from your context
    const unsubscribe = subscribeToPayouts("current-group-id", setPayouts);
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payout Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage the group payout order.</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payouts.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{member.position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.expectedDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">R {member.amount.toLocaleString()}</td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-900 font-medium">Reorder</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
=======
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
>>>>>>> 10-us-26-view-and-manage-payout-schedule
    </div>
  );
}