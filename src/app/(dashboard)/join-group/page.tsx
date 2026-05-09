"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { INVITE_CODE_REGEX, normalizeInviteCode } from "@/lib/invite-code";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";

export default function JoinGroupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = normalizeInviteCode(input);
    if (!INVITE_CODE_REGEX.test(code)) {
      setError("That doesn't look like a valid code. Codes are formatted XXXX-XXXX.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/invites/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not redeem this code");
        return;
      }
      router.push(`/dashboard/${data.groupId}`);
    } catch (e) {
      console.error(e);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }
  if (!user) {
    router.push("/login?redirect=/join-group");
    return null;
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Join a Group</h1>
        <p className="text-sm text-gray-500 mt-2">
          Enter the invite code an admin shared with you.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
          Invite Code
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ABCD-EFGH"
          autoComplete="off"
          autoCapitalize="characters"
          className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-mono tracking-widest text-lg"
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
        >
          {submitting ? "Joining..." : "Join Group"}
        </button>
      </form>
    </div>
  );
}
