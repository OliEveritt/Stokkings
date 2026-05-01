"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// Define Interface to resolve "Unexpected any" lint errors
interface InvitationData {
  id: string;
  groupId: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: { toDate: () => Date };
}

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
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

        const docSnap = snap.docs[0];
        const data = docSnap.data() as Omit<InvitationData, 'id'>;
        const expiryDate = data.expiresAt?.toDate();

        if (data.status !== 'pending') {
          setError("This invitation has already been claimed.");
        } else if (expiryDate && expiryDate < new Date()) {
          setError("This invitation has expired.");
        } else {
          setInvitation({ id: docSnap.id, ...data } as InvitationData);
        }
      } catch (_err) {
        // Use underscore to resolve 'unused variable' lint warning
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

    if (!invitation) return;

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
      console.error("Transaction failed: ", e);
      alert("Failed to join the group. Please try again.");
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Checking invitation...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
  if (!invitation) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
        <UserPlus size={32} />
      </div>
      <h1 className="text-3xl font-extrabold mb-2 text-gray-900">Join Group</h1>
      <p className="text-gray-600 mb-8 max-w-sm">
        You have been invited to join the Stokkings group: <br />
        <span className="text-emerald-600 font-bold text-lg">ID: {invitation.groupId}</span>
      </p>
      
      {!user ? (
        <div className="space-y-4 w-full max-w-xs">
          <button 
            onClick={() => router.push(`/login?callback=/invite/${params.token}`)}
            className="w-full bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-md"
          >
            Sign in to Accept
          </button>
          <p className="text-xs text-gray-500">You need an account to join this group.</p>
        </div>
      ) : (
        <button 
          onClick={handleAccept}
          className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition transform hover:scale-105"
        >
          Accept & Join Group
        </button>
      )}
    </div>
  );
}

// Minimal placeholder for UserPlus icon if not imported from lucide-react
function UserPlus({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}