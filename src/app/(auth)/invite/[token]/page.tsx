"use client";
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Handle Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // UAT 4: Validate Token and Expiry
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const q = query(collection(db, 'invitations'), where('token', '==', params.token));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setError("This invitation link is invalid.");
          return;
        }

        const data = snap.docs[0].data();
        const expiryDate = data.expiresAt?.toDate();

        if (data.status !== 'pending') {
          setError("This invitation has already been claimed.");
        } else if (expiryDate < new Date()) {
          setError("This invitation has expired.");
        } else {
          setInvitation({ id: snap.docs[0].id, ...data });
        }
      } catch (err) {
        setError("Error fetching invitation details.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [params.token]);

  // UAT 2: Onboard user into the group
  const handleAccept = async () => {
    if (!user) {
      router.push(`/login?callback=/invite/${params.token}`);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const groupRef = doc(db, 'groups', invitation.groupId);
        const inviteRef = doc(db, 'invitations', invitation.id);

        // Add user to the group members array
        transaction.update(groupRef, {
          members: arrayUnion(user.uid)
        });

        // Mark invite as accepted
        transaction.update(inviteRef, {
          status: 'accepted',
          acceptedBy: user.uid,
          acceptedAt: new Date()
        });
      });

      alert("Successfully joined the group!");
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      alert("Failed to join the group. Please try again.");
    }
  };

  if (loading) return <div className="p-10 text-center">Checking invitation...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h1 className="text-3xl font-extrabold mb-2">Stokkings Invitation</h1>
      <p className="text-gray-600 mb-8">
        You have been invited to join the group: <br />
        <span className="text-black font-mono font-bold text-lg">{invitation.groupId}</span>
      </p>
      
      {!user ? (
        <button 
          onClick={() => router.push('/login')}
          className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition"
        >
          Sign in to Accept
        </button>
      ) : (
        <button 
          onClick={handleAccept}
          className="bg-green-600 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-green-700 transition"
        >
          Accept & Join Group
        </button>
      )}
    </div>
  );
}