import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export const subscribeToPayouts = (groupId: string, callback: (data: any[]) => void) => {
  // 1. Reference the exact plural collection: "payout_schedules"
  const payoutRef = collection(db, "payout_schedules"); 

  // 2. The query uses your 'groupId' field
  const q = query(
    payoutRef, 
    where("groupId", "==", groupId), 
    orderBy("position", "asc") 
  );

  return onSnapshot(q, (snapshot) => {
    const payouts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        position: data.position,
        // CRITICAL: Map 'memberName' from Firestore to 'name' for your UI
        name: data.memberName, 
        expectedDate: data.expectedDate,
        amount: data.amount,
        status: data.status
      };
    });
    callback(payouts);
  }, (error) => {
    console.error("Payout Ledger Sync Error:", error);
  });
};