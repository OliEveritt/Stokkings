"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { acceptInvitationAction } from "./actions";
import { ShieldCheck, UserPlus, Loader2, AlertCircle, XCircle } from "lucide-react";

interface Props {
  token: string;
  initialInviteInfo?: { email: string; groupName: string };
  initialError?: string;
}

export default function InviteAcceptPageClient({ token, initialInviteInfo, initialError }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(initialError || null);

  // Monitor Firebase Auth state to detect guest vs. logged-in users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleAccept = async () => {
    /**
     * AUTH ROUTING LOGIC:
     * If no user is detected, redirect to the appropriate auth page.
     * We pass the token and email to ensure a seamless return path.
     */
    if (!user) {
      const emailParam = initialInviteInfo?.email ? `&email=${encodeURIComponent(initialInviteInfo.email)}` : "";
      
      // Routing users to sign-up by default for new invites, or login if there's an existing context
      const path = "/sign-up"; 
      
      // Preserve context so the user returns here after authenticating
      router.push(`${path}?token=${token}${emailParam}&redirect=/invite/${token}`);
      return;
    }

    startTransition(async () => {
      try {
        const fullName = user.displayName || "";
        const [firstName, ...surnameParts] = fullName.split(" ");
        const surname = surnameParts.join(" ");

        /**
         * ATOMIC HANDSHAKE:
         * Executed only when a valid user session is detected.
         * This fulfills UAT-2 (Provisioning) and UAT-4 (Burn Token).
         */
        const result = await acceptInvitationAction(token, user.uid, {
          email: user.email || "",
          firstName: firstName || "Member",
          surname: surname || "",
        });

        if (result?.error) {
          setError(result.error);
        }
        // On success, the server action triggers a direct redirect to /dashboard.
      } catch (err) {
        setError("A system error occurred during the security handshake.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-sm w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Visual Header State */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${error ? 'bg-red-100' : 'bg-emerald-100'}`}>
          {error ? <XCircle className="text-red-500" size={32} /> : <UserPlus className="text-emerald-600" size={32} />}
        </div>

        {error ? (
          /* Error UI Block */
          <>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Invitation Error</h1>
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold flex items-center gap-2 border border-red-100">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
            <button 
              onClick={() => router.push("/login")} 
              className="text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors"
            >
              Sign in to another account
            </button>
          </>
        ) : (
          /* Acceptance UI Block */
          <>
            <h1 className="text-xl font-black text-gray-900 mb-1 leading-tight">Join the Circle</h1>
            {initialInviteInfo && (
              <p className="text-emerald-600 font-bold text-sm mb-6 uppercase tracking-tighter">
                {initialInviteInfo.groupName}
              </p>
            )}
            
            <p className="text-gray-400 text-xs mb-8 leading-relaxed font-medium">
              {!user 
                ? "You've been invited! Please sign in or create an account to join this group." 
                : `Logged in as ${user.email}. Click below to finalize your membership.`}
            </p>

            {/* Main CTA: Logic branches inside handleAccept */}
            <button
              onClick={handleAccept}
              disabled={isPending}
              className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-200 active:scale-[0.98]"
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={20} /> 
                  {user ? "Confirm & Join Group" : "Get Started"}
                </>
              )}
            </button>
            
            {/* Secondary Option for Existing Users who are logged out */}
            {!user && (
              <div className="mt-6 flex flex-col gap-2">
                <button 
                  onClick={() => router.push(`/login?token=${token}&redirect=/invite/${token}`)}
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-emerald-600 transition-colors"
                >
                  Already have an account? Log In
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}