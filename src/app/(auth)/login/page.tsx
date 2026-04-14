"use client";

import { use } from "react";
import { login } from "../actions";
import Link from "next/link";

export default function LoginPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string }> 
}) {
  const resolvedSearchParams = use(searchParams);
  const error = resolvedSearchParams.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Stokkings</h2>
          <p className="mt-2 text-sm text-gray-500">Access your secure portal</p>
        </div>

        {/* Dynamic Error Handling */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100 italic">
            {error === 'invalid_credentials' ? "Invalid email or password" : 
             `Error: ${error.replace(/_/g, ' ')}`}
          </div>
        )}

        <form action={login} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Email Address</label>
            <input name="email" type="email" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 outline-none" />
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Password</label>
            <input name="password" type="password" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 outline-none" />
          </div>

          <button 
            type="submit" 
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg mt-4 active:scale-[0.98]"
          >
            Sign In
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
