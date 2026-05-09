"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import PendingInvites from "./PendingInvites";

export default function GroupInvitePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();

  const [groupName, setGroupName] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedExpiresAt, setGeneratedExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!groupId) return;

    (async () => {
      try {
        const groupSnap = await getDoc(doc(db, "groups", groupId));
        if (groupSnap.exists()) {
          const data = groupSnap.data();
          setGroupName(data.group_name || data.name || "Group");
        }
        const memberSnap = await getDoc(doc(db, "groups", groupId, "group_members", user.uid));
        setIsAdmin(memberSnap.exists() && memberSnap.data()?.role === "Admin");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, groupId, router]);

  const handleGenerate = async () => {
    setError(null);
    setGeneratedCode(null);
    setGeneratedExpiresAt(null);
    setCopied(false);
    setGenerating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/invites/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate code");
        return;
      }
      setGeneratedCode(data.code);
      setGeneratedExpiresAt(data.expiresAt);
    } catch (e) {
      console.error(e);
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  if (loading || authLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (isAdmin === false) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">Only group admins can generate invite codes.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Invite to {groupName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate a single-use invite code, then send it to the new member however you like (WhatsApp, SMS, in person). They enter it on the Join Group page to join.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all"
        >
          {generating ? "Generating..." : "Generate Invite Code"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        {generatedCode && (
          <div className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="text-xs font-bold uppercase text-emerald-700 tracking-wide mb-2">
              New invite code
            </div>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-mono font-black text-gray-900 tracking-widest select-all">
                {generatedCode}
              </code>
              <button
                onClick={handleCopy}
                className="ml-auto bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-semibold px-4 py-2 rounded-lg text-sm"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {generatedExpiresAt && (
              <div className="text-xs text-gray-600 mt-3">
                Expires {new Date(generatedExpiresAt).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      <PendingInvites groupId={groupId!} />
    </div>
  );
}
