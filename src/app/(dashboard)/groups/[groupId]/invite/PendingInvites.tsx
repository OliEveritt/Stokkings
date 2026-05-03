"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Mail, Clock, CheckCircle2 } from "lucide-react";

export default function PendingInvites({ groupId }: { groupId: string }) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Date unknown";
    if (dateValue instanceof Timestamp) return dateValue.toDate().toLocaleDateString();
    return new Date(dateValue).toLocaleDateString();
  };

  useEffect(() => {
    const q = query(
      collection(db, "invitations"),
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inviteList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInvites(inviteList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId]);

  if (loading) return <div className="animate-pulse text-gray-400 text-xs">Syncing...</div>;
  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <Mail size={24} className="text-gray-300 mb-2" />
        <p className="text-gray-400 text-sm">No pending invites</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <div key={invite.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">{invite.email}</p>
            <p className="text-xs text-gray-500">{formatDate(invite.createdAt)}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${invite.status === "pending" ? "bg-yellow-100" : "bg-green-100"}`}>
            {invite.status}
          </span>
        </div>
      ))}
    </div>
  );
}