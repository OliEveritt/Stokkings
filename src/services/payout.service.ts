import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";

export interface PayoutMember {
  id: string;
  name: string;
  position: number;
  expectedDate: string;
  amount: number;
}

export const subscribeToPayouts = (groupId: string, callback: (data: PayoutMember[]) => void) => {
  const payoutRef = collection(db, "groups", groupId, "payout_schedule");
  const q = query(payoutRef, orderBy("position", "asc"));

  return onSnapshot(q, (snapshot) => {
    const payouts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PayoutMember[];
    callback(payouts);
  });
};

export const updatePayoutPosition = async (groupId: string, memberId: string, newPosition: number) => {
  const memberRef = doc(db, "groups", groupId, "payout_schedule", memberId);
  await updateDoc(memberRef, { position: newPosition });
};