"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Clock } from "lucide-react";

export default function PendingInvites({ groupId }: { groupId: string }) {
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "invitations"),
      where("groupId", "==", groupId),
      where("status", "==", "pending")
    );

    return onSnapshot(q, (snapshot) => {
      setInvites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [groupId]);

  if (invites.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Clock size={18} className="text-amber-500" /> Pending Invitations
      </h3>
      <div className="space-y-2">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-sm text-gray-600">{invite.email}</span>
            <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded uppercase">
              Expires {new Date(invite.expiresAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}