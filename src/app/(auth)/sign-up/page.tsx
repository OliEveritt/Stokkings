"use client";

import { Suspense, useState, useEffect } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowRight, Users, Target, CheckCircle2 } from "lucide-react";

// --- Validation Helper ---
function validateSANumber(phone: string): { isValid: boolean; normalized: string; error?: string } {
  const cleaned = phone.replace(/\s|-/g, '');
  const localPattern = /^0[6-8][0-9]{8}$/;
  const intlPattern = /^\+27[6-8][0-9]{8}$/;
  if (localPattern.test(cleaned)) return { isValid: true, normalized: '+27' + cleaned.substring(1) };
  if (intlPattern.test(cleaned)) return { isValid: true, normalized: cleaned };
  return { isValid: false, normalized: '', error: "Enter a valid SA mobile number" };
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white">Loading...</div>}>
      <AuthManager />
    </Suspense>
  );
}

function AuthManager() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login, signup, user } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  useEffect(() => {
    if (user) router.push(redirectTo || "/dashboard");
  }, [user, router, redirectTo]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Sign Up Logic
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        const phoneVal = validateSANumber(phone);
        if (!phoneVal.isValid) throw new Error(phoneVal.error);
        
        await signup(email, password, `${firstName} ${surname}`, phoneVal.normalized);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-0 md:p-8">
      {/* Container with Layout Animation */}
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`relative w-full max-w-6xl min-h-[750px] bg-white shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col ${
          isLogin ? 'lg:flex-row' : 'lg:flex-row-reverse'
        }`}
      >
        
        {/* --- BRANDING SIDE (Green) --- */}
        <motion.div 
          layout
          className="w-full lg:w-5/12 bg-emerald-600 p-12 text-white flex flex-col justify-between relative overflow-hidden"
        >
          {/* Animated Background Pulse */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -top-20 -left-20 w-96 h-96 bg-white rounded-full blur-3xl"
          />

          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tighter italic">Stokkings</h1>
            <div className="mt-12 space-y-6">
              <motion.h2 
                key={isLogin ? 'l-h2' : 's-h2'}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold leading-tight"
              >
                {isLogin ? "Welcome back to the circle." : "Start your savings journey today."}
              </motion.h2>
              <p className="text-emerald-100 text-lg opacity-90">
                {isLogin 
                  ? "Manage your Stokvel contributions and track group growth from your secure dashboard." 
                  : "Join thousands of South Africans building transparent wealth through community power."}
              </p>
            </div>
          </div>

          {/* Value Props */}
          <div className="relative z-10 space-y-4 pt-8 border-t border-white/20">
            <div className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 size={18} className="text-emerald-300" /> Secure Bank-Grade Encryption
            </div>
            <div className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 size={18} className="text-emerald-300" /> Automated Group Payouts
            </div>
          </div>
        </motion.div>

        {/* --- FORM SIDE (White) --- */}
        <motion.div 
          layout
          className="w-full lg:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? -30 : 30 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-10">
                <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="text-emerald-600" size={28} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {isLogin ? "Sign In" : "Register Account"}
                </h3>
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-emerald-600 font-bold text-sm hover:underline mt-2"
                >
                  {isLogin ? "New here? Create an account" : "Already have an account? Sign in instead"}
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                      <input value={firstName} onChange={e => setFirstName(e.target.value)} required type="text" className="auth-input" placeholder="Lebo" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Surname</label>
                      <input value={surname} onChange={e => setSurname(e.target.value)} required type="text" className="auth-input" placeholder="Mokoena" />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} required type="email" className="auth-input" placeholder="lebo@example.com" />
                </div>

                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SA Phone Number</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} required type="tel" className="auth-input" placeholder="082 123 4567" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                    <input value={password} onChange={e => setPassword(e.target.value)} required type="password" className="auth-input" placeholder="••••••••" />
                  </div>
                  {!isLogin && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm</label>
                      <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required type="password" className="auth-input" placeholder="••••••••" />
                    </div>
                  )}
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 font-medium ml-1">
                    {error}
                  </motion.p>
                )}

                <button 
                  disabled={loading}
                  className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold mt-6 flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-xl disabled:opacity-50"
                >
                  {loading ? "Processing..." : isLogin ? "Sign In" : "Register"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </motion.div>

      <style jsx>{`
        .auth-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          background: #f9fafb;
        }
        .auth-input:focus {
          border-color: #10b981;
          background: white;
          box-shadow: 0 0 0 4px #ecfdf5;
        }
      `}</style>
    </div>
  );
}