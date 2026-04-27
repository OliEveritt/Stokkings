"use client";

import { useState, useEffect, Suspense } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useFirebaseAuth();
  const router = useRouter();
  
  // Use searchParams to detect if this login is part of an invitation flow
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Log when user changes and handle redirects
  useEffect(() => {
    if (user) {
      console.log("LoginPage: User authenticated, checking destination...");
      
      // If there is no token, go to the standard dashboard
      // Using window.location.href forces a clean state reload for the Stokvel Ledger
      window.location.href = "/dashboard";
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("LoginPage: Attempting login for", email);
      await login(email, password);
      
      // If a token exists, we don't need to do extra logic here because 
      // the 'AcceptInvitationPage' already updated the Firestore ledger 
      // or set the session state.
    } catch (err: any) {
      console.error("LoginPage: Auth Error", err);
      setError(err.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md space-y-8 rounded-[2.5rem] bg-white p-10 shadow-2xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Stokkings</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            {token ? "Sign in to claim your invitation" : "Access your secure portal"}
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-600 border border-rose-100 animate-in shake-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="name@wits.ac.za"
              className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="••••••••"
              className="block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-5 text-white font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 mt-4 active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? "Syncing Identity..." : "Sign In"}
          </button>
        </form>

        <div className="text-center pt-6 border-t border-gray-50">
          <Link 
            href={token ? `/sign-up?token=${token}` : "/sign-up"} 
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
          >
            {token ? "New here? Create Account" : "Need a vault? Sign Up"}
          </Link>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Secure Portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}