"use client";

import { useState, Suspense } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

/**
 * Validates and normalizes South African mobile numbers to international format (+27).
 */
function validateSANumber(phone: string): { isValid: boolean; normalized: string; error?: string } {
  const cleaned = phone.replace(/\s|-/g, '');
  const localPattern = /^0[6-8][0-9]{8}$/;
  const intlPattern = /^\+27[6-8][0-9]{8}$/;
  
  if (localPattern.test(cleaned)) {
    return { isValid: true, normalized: '+27' + cleaned.substring(1) };
  }
  if (intlPattern.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }
  return { isValid: false, normalized: '', error: "Use format: 082 123 4567" };
}

function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect"); // e.g., "/invite/abc-123"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const phoneValidation = validateSANumber(phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || "Invalid phone number");
      setLoading(false);
      return;
    }

    try {
      const fullName = `${firstName} ${surname}`;
      
      /**
       * Auth Handshake:
       * Ensure your context's signup signature matches (email, password, metadata).
       */
      await signup(email, password, fullName, phoneValidation.normalized);

      // Redirect back to the invitation page or the dashboard
      router.push(redirectTo || "/dashboard");
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        const loginParams = new URLSearchParams();
        if (redirectTo) loginParams.set("redirect", redirectTo);
        loginParams.set("email", email);
        router.push(`/login?${loginParams.toString()}`);
      } else {
        setError(err.message || "Failed to create account");
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Stokkings</h1>
        <p className="text-sm text-gray-500 font-medium italic">Soweto's Digital Savings Circle</p>
        
        {redirectTo && redirectTo.startsWith('/invite/') && (
          <div className="mt-4 p-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 animate-pulse">
            You're accepting an invitation
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">First Name</label>
            <input 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required 
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-700" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Surname</label>
            <input 
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required 
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-700" 
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Mobile Number</label>
          <input 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="082 123 4567" 
            required 
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-700" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-700" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-700" 
          />
        </div>

        <div className="space-y-1 pb-2">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Confirm Password</label>
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required 
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-700" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : "CREATE ACCOUNT"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link 
          href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"} 
          className="text-sm font-black text-emerald-600 hover:text-emerald-700 tracking-tight"
        >
          Already a member? Sign In
        </Link>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <Suspense fallback={<Loader2 className="animate-spin text-emerald-600" />}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
