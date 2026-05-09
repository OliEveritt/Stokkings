"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Clock, CheckCircle2, AlertCircle, Mail, Copy, Check } from "lucide-react";

export default function PendingInvites({ groupId }: { groupId: string }) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;

    // Real-time listener scoped specifically to this group
    const q = query(
      collection(db, "invitations"),
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvites(snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // FIX: Explicitly ensure token is mapped. 
          // If the 'token' field is missing in the doc, fall back to doc.id 
          // since createInvitation uses the token as the Document ID.
          token: data.token || doc.id 
        };
      }));
      setLoading(false);
    }, (error) => {
      console.error("Audit Trail Sync Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const copyToClipboard = (token: string, id: string) => {
    // Defensive check to prevent 'undefined' links
    if (!token || token === "undefined") {
      alert("Error: Invitation token is missing from the record.");
      return;
    }

    // Generates the specific link for this group invitation
    const fullUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="p-4 text-xs font-black text-gray-400 animate-pulse uppercase tracking-widest">Syncing Audit Logs...</div>;

  if (invites.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-[2rem]">
      <Mail size={32} className="mb-2 opacity-20" />
      <p className="text-[10px] font-black uppercase tracking-widest">No Invitation History</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {invites.map((invite) => (
        <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl ${invite.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
              {invite.status === 'accepted' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{invite.email}</p>
              
              {/* Only show link if status is pending to satisfy UAT-4 */}
              {invite.status === 'pending' && (
                <button 
                  onClick={() => copyToClipboard(invite.token, invite.id)}
                  className="text-[10px] font-black text-emerald-600 flex items-center gap-1 mt-1 hover:text-emerald-700 transition-colors"
                >
                  {copiedId === invite.id ? <Check size={10} /> : <Copy size={10} />}
                  {copiedId === invite.id ? "COPIED!" : "COPY SECURE LINK"}
                </button>
              )}

              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1">
                Sent {invite.createdAt?.toDate ? invite.createdAt.toDate().toLocaleDateString() : 'Just now'} · {invite.status}
              </p>
            </div>
          </div>
          
          {invite.status === 'pending' && (
            <div className="flex items-center gap-1 text-orange-600 font-black text-[9px] uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-md">
              <AlertCircle size={10} /> Pending
            </div>
          )}
        </div>
      ))}
    </div>
  );
}