"use client";

import { useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validations
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (phone.length !== 10) {
      setError("Phone number must be 10 digits");
      setLoading(false);
      return;
    }

    try {
      const fullName = `${firstName} ${surname}`;
      await signup(email, password, fullName);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Stokkings</h1>
          <p className="text-sm text-gray-500 font-medium italic">Join the Soweto Savings Circle</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">First Name</label>
              <input 
                name="firstName" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Surname</label>
              <input 
                name="surname" 
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">SA Phone Number</label>
            <input 
              name="phone" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0821234567" 
              required 
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email Address</label>
            <input 
              name="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</label>
            <input 
              name="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Confirm Password</label>
            <input 
              name="confirmPassword" 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Register Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
