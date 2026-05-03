"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, getDocs, collection, query, where, runTransaction } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const q = query(collection(db, "invitations"), where("token", "==", token));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Invalid invitation.");
        const data = snap.docs[0].data();
        if (data.status !== "pending") throw new Error("Invitation already used.");
        setInvitation({ id: snap.docs[0].id, ...data });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchInvite();
  }, [token]);

  // Redirect to sign-up if not logged in
  useEffect(() => {
    if (!loading && !user && invitation && !error) {
      router.push(`/sign-up?redirect=/invite/${token}`);
    }
  }, [loading, user, invitation, error]);

  const acceptInvitation = async () => {
    if (!user || !invitation) return;
    try {
      const memberRef = doc(db, "groups", invitation.groupId, "group_members", user.uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        router.push(`/dashboard/${invitation.groupId}`);
        return;
      }
      await runTransaction(db, async (transaction) => {
        transaction.set(memberRef, {
          userId: user.uid,
          email: user.email,
          role: "member",
          joinedAt: new Date(),
        });
        transaction.update(doc(db, "invitations", invitation.id), { status: "accepted", acceptedBy: user.uid, acceptedAt: new Date() });
      });
      router.push(`/dashboard/${invitation.groupId}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (user && invitation && !loading && !error) acceptInvitation();
  }, [user, invitation, loading, error]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!user) return <div>Redirecting to sign up...</div>;
  return <div>Joining group...</div>;
}