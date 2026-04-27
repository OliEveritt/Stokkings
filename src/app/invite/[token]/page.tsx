"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { settleInvitation } from "@/app/actions/invite"; 
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { CheckCircle, Loader2, PartyPopper, ShieldAlert, ArrowRight } from "lucide-react";

export default function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading, logout } = useFirebaseAuth();
  const { token } = use(params);
  
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) return;
      const q = query(collection(db, "invitations"), where("token", "==", token));
      const snap = await getDocs(q);
      if (!snap.empty) setInviteData(snap.docs[0].data());
      else setStatus("error");
    };
    fetchInvite();
  }, [token]);

  const handleAction = async () => {
    if (!firebaseUser) {
      sessionStorage.setItem("pending_invite_token", token || "");
      router.push(`/sign-up?token=${token}`);
      return;
    }

    if (firebaseUser.email !== inviteData?.email) {
      await logout();
      router.push(`/login?token=${token}`);
      return;
    }

    setStatus("processing");
    const result = await settleInvitation(token!, firebaseUser.uid, firebaseUser.email!);

    if (result.success) setStatus("success");
    else setStatus("error");
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center">
        {status === "idle" && (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600"><PartyPopper size={40}/></div>
            <h1 className="text-3xl font-black">Join {inviteData?.groupName}</h1>
            <button onClick={handleAction} className="mt-8 w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold">
              {firebaseUser ? "Confirm Membership" : "Sign Up to Join"}
            </button>
          </>
        )}

        {status === "processing" && <Loader2 className="mx-auto animate-spin text-emerald-600" size={48}/>}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto text-emerald-500 mb-6" size={64}/>
            <h2 className="text-2xl font-bold">Welcome to the Group!</h2>
            <button onClick={() => window.location.href = "/dashboard"} className="mt-8 w-full bg-black text-white py-5 rounded-2xl font-bold">
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}