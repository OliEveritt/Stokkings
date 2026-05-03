"use client";

import { use, useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const q = query(collection(db, 'invitations'), where('token', '==', token));
        const snap = await getDocs(q);
        if (snap.empty) {
          setError("Invalid link.");
          return;
        }
        const data = snap.docs[0].data();
        setInvitation({ id: snap.docs[0].id, ...data });
      } catch (err) {
        setError("Fetch error.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!user || !invitation || !invitation.groupId) return;

    try {
      await runTransaction(db, async (transaction) => {
        const groupRef = doc(db, 'groups', invitation.groupId);
        const inviteRef = doc(db, 'invitations', invitation.id);

        const groupSnap = await transaction.get(groupRef);
        if (!groupSnap.exists()) throw new Error("Target group does not exist.");

        transaction.update(groupRef, { members: arrayUnion(user.uid) });
        transaction.update(inviteRef, { 
          status: 'accepted', 
          acceptedBy: user.uid, 
          acceptedAt: new Date() 
        });
      });
      router.push('/dashboard');
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="text-center p-10">
      <h1 className="text-2xl font-bold mb-4">Join {invitation.groupId}</h1>
      <button 
        onClick={handleAccept}
        className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold"
      >
        Accept & Join Group
      </button>
    </div>
  );
}