"use client";

import { useState, use } from "react";
import { login, signUp } from "../actions";

export default function AuthPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string }> 
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  
  // Unwrap the Promise to get parameters
  const resolvedSearchParams = use(searchParams);
  const error = resolvedSearchParams.error;

  // Real-time password matching check
  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    if (isLogin) return;
    const data = new FormData(e.currentTarget);
    const pass = data.get("password");
    const confirm = data.get("confirmPassword");
    setPasswordsMatch(pass === confirm);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Stokkings</h2>
          <p className="mt-2 text-sm text-gray-500">
            {isLogin ? "Access your secure portal" : "Establish your new savings circle"}
          </p>
        </div>

        {/* Dynamic Error Handling */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100 italic animate-pulse">
            {error === 'group_exists' ? "Error: That group name is already taken." : 
             error === 'phone_must_be_10_digits' ? "Error: Phone number must be exactly 10 digits." :
             `Audit Alert: ${error.replace(/_/g, ' ')}`}
          </div>
        )}

        <form 
          action={isLogin ? login : signUp} 
          onChange={handleFormChange}
          className="space-y-4"
        >
          {!isLogin && (
            <>
              {/* 1. Group Name (Primary Focus) */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <label className="block text-[10px] font-black text-emerald-700 uppercase mb-1">New Stokvel Group Name</label>
                <input 
                  name="groupName" 
                  type="text" 
                  placeholder="e.g. Soweto Savings Circle" 
                  required 
                  className="block w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-900 focus:ring-emerald-500 outline-none" 
                />
              </div>

              {/* 2. Personal Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase ml-1">First Name</label>
                  <input name="firstName" type="text" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Surname</label>
                  <input name="surname" type="text" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              {/* 3. Phone Number (10 Digit Restrict) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase ml-1">SA Phone Number</label>
                <input 
                  name="phone" 
                  type="tel" 
                  placeholder="0821234567" 
                  required 
                  maxLength={10}
                  minLength={10}
                  pattern="[0-9]{10}"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 outline-none" 
                />
                <p className="text-[9px] text-gray-400 mt-1 italic">Must be exactly 10 digits.</p>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Email Address</label>
            <input name="email" type="email" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 outline-none" />
          </div>
          
          {/* Password Section */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Password</label>
            <input name="password" type="password" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 outline-none" />
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 uppercase ml-1">Confirm Password</label>
              <input 
                name="confirmPassword" 
                type="password" 
                required 
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${!passwordsMatch ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:border-emerald-500'}`} 
              />
              {!passwordsMatch && <p className="text-[10px] text-red-500 font-bold ml-1">Passwords do not match</p>}
            </div>
          )}

          <button 
            type="submit" 
            disabled={!isLogin && !passwordsMatch}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white font-bold hover:bg-emerald-700 disabled:bg-gray-300 transition-all shadow-lg mt-4 active:scale-[0.98]"
          >
            {isLogin ? "Sign In" : "Register Account & Group"}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-100">
          <button 
            type="button" 
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