"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { CheckCircle2, Clock, Copy, Check, ShieldAlert } from "lucide-react";

export default function InvitationsPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Establish Real-time Listener
    // Uses the 'invitations' collection identified in your database
    const q = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = (token: string, id: string) => {
    const link = `${window.location.origin}/sign-up?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return null;
    // Handles both Firestore Timestamps and serialized date strings
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return null;

    return {
      full: date.toLocaleDateString('en-ZA'), // South African formatting
      time: date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // 2. 7-Day Expiry Logic
  const isExpired = (expiresAt: any) => {
    if (!expiresAt) return false;
    const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    return new Date() > expiry;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Live Audit Trail</h2>
        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
          {invites.length} Records
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="p-4 text-[10px] font-black uppercase text-gray-400">Email & Status</th>
              <th className="p-4 text-[10px] font-black uppercase text-gray-400">Group ID</th>
              <th className="p-4 text-[10px] font-black uppercase text-gray-400">Timeline</th>
              <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invites.map(invite => {
              const expired = isExpired(invite.expiresAt);
              const accepted = invite.status === 'accepted';
              const createdDate = formatDate(invite.createdAt);
              const acceptedDate = formatDate(invite.acceptedAt); // From acceptedAt field

              return (
                <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-800 mb-1">{invite.email}</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      accepted ? 'bg-emerald-50 text-emerald-600' : expired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {accepted ? <CheckCircle2 size={10} /> : expired ? <ShieldAlert size={10} /> : <Clock size={10} />}
                      {expired && !accepted ? 'Expired' : invite.status}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <code className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {invite.groupId}
                    </code>
                  </td>

                  <td className="p-4">
                    <p className="text-[10px] text-gray-400 font-medium">Created: {createdDate?.full}</p>
                    {/* Indicates join time once accepted */}
                    {accepted && acceptedDate && (
                      <p className="text-[10px] text-emerald-600 font-bold italic mt-0.5">
                        Joined: {acceptedDate.full} @ {acceptedDate.time}
                      </p>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    {/* 3. Conditional Button logic: Hides link if Accepted or Expired */}
                    {invite.status === 'pending' && !expired ? (
                      <button 
                        onClick={() => copyToClipboard(invite.token, invite.id)}
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-[10px] font-black uppercase transition-all"
                      >
                        {copiedId === invite.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === invite.id ? 'Copied!' : 'Copy Link'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-medium italic">
                        {accepted ? "Handshake Complete" : "Link Expired"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}