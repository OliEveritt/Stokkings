import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function seedPayoutSchedule(groupId: string) {
  const members = [
    { name: "Aubrey (Admin)", amount: 5000 },
    { name: "Oli Everitt", amount: 5000 },
    { name: "Finance Colleague", amount: 5000 }
  ];

  try {
    for (let i = 0; i < members.length; i++) {
      await addDoc(collection(db, "payout_schedules"), {
        groupId: groupId,
        memberName: members[i].name,
        position: i + 1,
        amount: members[i].amount,
        expectedDate: new Date(2026, 4 + i, 25).toISOString(), // Monthly starting May 2026
        status: "scheduled",
        createdAt: serverTimestamp()
      });
    }
    console.log("✅ Payout schedule seeded!");
  } catch (e) {
    console.error("Error seeding:", e);
  }
}