"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ContributionFormProps {
  groupId: string;
  defaultAmount?: number;
  disabled?: boolean;
  disabledReason?: string;
}

export default function ContributionForm({
  groupId,
  defaultAmount,
  disabled = false,
  disabledReason,
}: ContributionFormProps) {
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setError(null);
    setSuccess(null);
    const fbUser = auth.currentUser;
    if (!fbUser) {
      setError("You must be signed in to contribute.");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      const ref = await addDoc(collection(db, "contributions"), {
        groupId,
        userId: fbUser.uid,
        amount: numericAmount,
        status: "pending",
        contributionDate: new Date().toISOString(),
        timestamp: serverTimestamp(),
      });
      setSuccess(`Pending contribution recorded. Pay it from "My Contributions" to confirm.`);
      setAmount(defaultAmount ? String(defaultAmount) : "");
      // Optional: kick straight into Stripe checkout for this contribution.
      try {
        const token = await fbUser.getIdToken();
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ contributionId: ref.id, amount: numericAmount }),
        });
        const data = await res.json();
        if (res.ok && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } catch (checkoutErr) {
        console.warn("Checkout redirect failed; contribution still pending:", checkoutErr);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to record contribution.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${disabled ? "opacity-60" : ""}`}
    >
      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
        Make Contribution
      </h3>
      {disabled && disabledReason && (
        <div className="mb-4 p-3 bg-gray-50 text-gray-600 rounded-xl text-sm">
          {disabledReason}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <span className="absolute left-4 top-3 text-gray-400 font-bold">R</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={disabled}
            className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none font-mono disabled:cursor-not-allowed"
            required
          />
        </div>
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        {success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">{success}</div>}
        <button
          disabled={loading || disabled}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <CreditCard size={18} /> Pay with Stripe
            </>
          )}
        </button>
      </div>
    </form>
  );
}
