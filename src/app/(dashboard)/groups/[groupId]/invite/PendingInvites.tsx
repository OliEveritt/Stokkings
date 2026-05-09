"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface InviteDoc {
  id: string;
  code: string;
  status: string;
  createdAt?: Timestamp;
  expiresAt?: Timestamp;
}

export default function PendingInvites({ groupId }: { groupId: string }) {
  const [invites, setInvites] = useState<InviteDoc[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "invitations"),
      where("groupId", "==", groupId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() } as InviteDoc)));
      },
      (err) => {
        console.error("PendingInvites snapshot error:", err);
        setError("Could not load active codes");
      }
    );
    return () => unsub();
  }, [groupId]);

  const handleRevoke = async (code: string) => {
    setRevoking(code);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/invites/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to revoke");
      }
    } catch (e) {
      console.error(e);
      setError("Network error revoking code");
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-500">
          Active Invite Codes ({invites.length})
        </h2>
      </div>
      {error && <div className="p-4 bg-red-50 text-red-700 text-sm">{error}</div>}
      <ul className="divide-y divide-gray-100">
        {invites.map((invite) => {
          const expiresAt = invite.expiresAt?.toDate?.();
          const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
          return (
            <li
              key={invite.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <code className="font-mono font-bold tracking-widest text-gray-900">
                  {invite.code}
                </code>
                <div className="text-xs text-gray-400 mt-1">
                  {expiresAt
                    ? isExpired
                      ? `Expired ${expiresAt.toLocaleDateString()}`
                      : `Expires ${expiresAt.toLocaleString()}`
                    : "No expiry"}
                </div>
              </div>
              <button
                onClick={() => handleRevoke(invite.code)}
                disabled={revoking === invite.code}
                className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {revoking === invite.code ? "Revoking..." : "Revoke"}
              </button>
            </li>
          );
        })}
        {invites.length === 0 && (
          <li className="px-6 py-12 text-center text-gray-400 text-sm">
            No active invite codes. Generate one above.
          </li>
        )}
      </ul>
    </div>
  );
}
