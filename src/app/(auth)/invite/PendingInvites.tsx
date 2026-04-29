"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

import { Clock } from "lucide-react";

export default function PendingInvites({ groupId }: { groupId: string }) {
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {

import { Clock, Mail } from "lucide-react";

interface PendingInvitesProps {
  groupId: string;
}

export default function PendingInvites({ groupId }: PendingInvitesProps) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    // Filter by the specific group and only show pending invites for the audit trail
 80825cc
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvites(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  if (loading) return <p className="text-xs text-gray-400 animate-pulse">Loading audit trail...</p>;

  return (
    <div className="space-y-3">
      {invites.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No pending invitations for this group.</p>
      ) : (
        invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{invite.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase">
              <Clock size={10} />
              Exp {new Date(invite.expiresAt).toLocaleDateString()}
            </div>
          </div>
        ))
      )}
 80825cc
    </div>
  );
}