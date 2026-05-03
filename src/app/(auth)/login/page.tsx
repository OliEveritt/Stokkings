"use client";

import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  // Redirect when user becomes authenticated
  useEffect(() => {
    if (user) {
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // The useEffect above will handle redirect when user state updates
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Stokkings</h2>
          <p className="mt-2 text-sm text-gray-500">Access your secure portal</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Email Address</label>
            <input 
              name="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Password</label>
            <input 
              name="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 outline-none" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg mt-4 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-100">
          <Link href="/sign-up" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            Need an account? Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}