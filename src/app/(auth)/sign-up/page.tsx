import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. If no active session is found (User is not logged in)
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Stokkings</h1>
        <p className="text-gray-600 mb-8">The secure mandate ledger for your Stokvel.</p>
        
        <div className="flex gap-4">
          <Link 
            href="/login" 
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            Login
          </Link>
          <Link 
            href="/signup" 
            className="px-6 py-2.5 bg-white text-emerald-600 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-all"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  // 2. If a session is active (User is recognized)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-700 font-bold text-xl">
            {user.email?.[0].toUpperCase()}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-6">{user.email}</p>
        
        <div className="space-y-3">
          <Link 
            href="/dashboard" 
            className="block w-full px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all"
          >
            Go to Dashboard
          </Link>
          
          <pre className="mt-4 p-4 bg-gray-50 rounded-lg text-left text-xs text-gray-400 overflow-auto max-h-40 border border-gray-100">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}