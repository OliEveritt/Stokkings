"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Mail, Clock, CheckCircle2 } from "lucide-react";

export default function PendingInvites({ groupId }: { groupId: string }) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to safely format dates from either Firestore Timestamps or Strings
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Date unknown";
    if (dateValue instanceof Timestamp) return dateValue.toDate().toLocaleDateString();
    return new Date(dateValue).toLocaleDateString();
  };

  useEffect(() => {
    console.log("🔍 Listening for invites in group:", groupId);

    const q = query(
      collection(db, "invitations"),
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`📊 Found ${snapshot.size} invitations in Firestore`);
      
      const inviteList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setInvites(inviteList);
      setLoading(false);
    }, (error) => {
      console.error("❌ Firestore Subscription Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-pulse text-gray-400 text-xs font-bold tracking-widest uppercase">Syncing Ledger...</div>
    </div>
  );

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4 border border-gray-100 shadow-inner">
          <Mail size={24} />
        </div>
        <h3 className="text-gray-900 font-bold">No Pending Invites</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
          Invitations for <span className="text-emerald-600 font-bold">{groupId}</span> appear here once dispatched.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {invites.map((invite) => (
        <div key={invite.id} className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 transition-all">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-colors ${
              invite.status === 'accepted' 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
            }`}>
              {invite.status === 'accepted' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
            </div>
            <div>
              <p className="text-sm font-black text-gray-800 leading-none mb-1">{invite.email}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${
                   invite.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {invite.status}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {formatDate(invite.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-gray-300 group-hover:text-gray-400 transition-colors">
              ID: {invite.token?.slice(-6) || '...'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}