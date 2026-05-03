"use client";
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function InvitationsPage() {
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Helper to handle Firestore Timestamps vs Serialized Dates
  const formatExpiryDate = (expiresAt: any) => {
    if (!expiresAt) return 'No expiry';
    
    // Check if it's a Firestore Timestamp object
    if (typeof expiresAt.toDate === 'function') {
      return expiresAt.toDate().toLocaleDateString();
    }
    
    // Fallback for serialized strings or plain Date objects
    return new Date(expiresAt).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Manage Invitations</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-700">Email</th>
              <th className="p-4 text-sm font-semibold text-gray-700">Group</th>
              <th className="p-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="p-4 text-sm font-semibold text-gray-700">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invites.map(invite => (
              <tr key={invite.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm text-gray-900">{invite.email}</td>
                <td className="p-4 font-mono text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 inline-block mt-3 ml-4">
                  {invite.groupId}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    invite.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-sm">
                  {formatExpiryDate(invite.expiresAt)}
                </td>
              </tr>
            ))}
            {invites.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                  No invitations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}