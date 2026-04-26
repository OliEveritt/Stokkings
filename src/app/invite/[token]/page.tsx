"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { CheckCircle, Loader2, PartyPopper, ShieldAlert } from "lucide-react";

export default function AcceptInvitationPage({ 
  params 
}: { 
  params: Promise<{ token: string }> 
}) {
  const router = useRouter();
  const decodedParams = use(params);
  const token = decodedParams?.token;
  
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleJoin = async () => {
    if (!token) return;
    setStatus("processing");

    try {
      // 1. Search for the invitation by the token string
      const invitationsRef = collection(db, "invitations");
      const q = query(invitationsRef, where("token", "==", token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("This invitation link is invalid or has expired.");
      }

      // 2. Get the specific document reference
      const inviteDoc = querySnapshot.docs[0];
      const inviteRef = doc(db, "invitations", inviteDoc.id);

      // 3. Update the status to 'accepted'
      await updateDoc(inviteRef, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      setStatus("success");
    } catch (err: any) {
      console.error("Acceptance Error:", err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-gray-100">
        
        {status === "idle" && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-emerald-600">
              <PartyPopper size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">
              Invitation Received
            </h1>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              You've been invited to join the **Stokvel** group. Click below to activate your membership.
            </p>
            <button 
              onClick={handleJoin}
              className="mt-10 w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
            >
              Accept & Join Group
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="py-16 animate-pulse">
            <Loader2 className="mx-auto text-emerald-600 animate-spin mb-6" size={56} />
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">Updating Ledger</h2>
            <p className="text-xs text-gray-400 mt-2">Syncing your profile with the group fund...</p>
          </div>
        )}

        {status === "success" && (
          <div className="animate-in zoom-in fade-in duration-500">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 text-white shadow-lg shadow-emerald-500/30">
               <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-black text-gray-900">Welcome Aboard!</h2>
            <p className="text-sm text-gray-500 mt-3">Membership activated. You are now a verified contributor.</p>
            <button 
              onClick={() => router.push('/member')}
              className="mt-10 w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-sm hover:bg-black transition-colors"
            >
              Enter Member Dashboard
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="animate-in shake duration-300">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-rose-500">
              <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Invalid Link</h2>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed px-4">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}