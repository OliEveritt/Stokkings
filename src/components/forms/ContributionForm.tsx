"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ContributionForm({ groupId, memberId }: { groupId: string; memberId: string }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "contributions"), {
        groupId,
        memberId,
        amount: parseFloat(amount),
        status: "verified", // In a real app, this would be 'pending' until bank verification
        timestamp: serverTimestamp(),
      });
      setAmount("");
      alert("Contribution recorded successfully!");
    } catch (error) {
      alert("Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Make Contribution</h3>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <span className="absolute left-4 top-3 text-gray-400 font-bold">R</span>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
            required
          />
        </div>
        <button 
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><CreditCard size={18}/> Record Payment</>}
        </button>
      </div>
    </form>
  );
}