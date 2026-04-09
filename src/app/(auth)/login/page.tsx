"use client";

import { useState, use } from "react"; // 1. Added 'use' to our toolkit
import { login, signUp } from "../actions";

// 2. Updated the type definition: searchParams is now a Promise
export default function AuthPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string }> 
}) {
  const [isLogin, setIsLogin] = useState(true);

  // 3. Unwrap the Promise to get the actual parameters
  const resolvedSearchParams = use(searchParams);
  const error = resolvedSearchParams.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Stokkings</h2>
          <p className="mt-2 text-sm text-gray-500">
            {isLogin ? "Access your secure stokvel portal" : "Join the Soweto Savings Circle"}
          </p>
        </div>

        {/* 4. Use the unwrapped error variable */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100 italic">
            Audit Alert: {error.replace('_', ' ')}
          </div>
        )}

        <form action={isLogin ? login : signUp} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">First Name</label>
                  <input name="firstName" type="text" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Surname</label>
                  <input name="surname" type="text" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">SA Phone Number</label>
                <input name="phone" type="tel" placeholder="082 123 4567" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Email Address</label>
            <input name="email" type="email" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase">Password</label>
            <input name="password" type="password" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500" />
          </div>

          <button type="submit" className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 mt-4">
            {isLogin ? "Sign In" : "Register Account"}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-100">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}