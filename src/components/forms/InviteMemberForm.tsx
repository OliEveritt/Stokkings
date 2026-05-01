"use client";
import { useState } from 'react';
import { useParams } from 'next/navigation'; // Use this to get the ID from the URL
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function InviteMemberForm() {
  const { groupId } = useParams(); // This grabs "TestGroup" from your URL
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Save to 'invitations' collection using the ID from the URL
      await addDoc(collection(db, 'invitations'), {
        email: email.toLowerCase(),
        groupId: groupId, // Matches the URL parameter
        token: token,
        status: 'pending',
        invitedBy: auth.currentUser?.uid,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt)
      });

      alert(`Invitation sent for group: ${groupId}`);
      setEmail('');
    } catch (error) {
      console.error("Invite failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-3xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Invite to {groupId}</h2>
      <form onSubmit={handleInvite} className="space-y-4">
        <input 
          type="email" 
          placeholder="Enter dummy email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 bg-gray-50 border rounded-2xl"
          required 
        />
        <button 
          type="submit" 
          disabled={isSending}
          className="w-full bg-[#00a369] text-white font-bold py-4 rounded-2xl"
        >
          {isSending ? "SENDING..." : "SEND INVITATION"}
        </button>
      </form>
    </div>
  );
}