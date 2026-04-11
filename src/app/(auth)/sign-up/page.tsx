import { signUp } from "@/app/(auth)/actions";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Stokkings</h1>
          <p className="text-sm text-gray-500 font-medium italic">Join the Soweto Savings Circle</p>
        </div>

        <form action={signUp} className="space-y-5">
          {/* USER DETAILS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">First Name</label>
              <input name="firstName" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Surname</label>
              <input name="surname" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">SA Phone Number</label>
            <input name="phone" placeholder="082 123 4567" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" />
          </div>

          {/* GROUP CREATION: The "Missing Link" */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
            <label className="text-[10px] font-black text-emerald-700 uppercase ml-1">New Stokvel Group Name</label>
            <input 
              name="groupName" 
              placeholder="e.g. Soweto Savings Circle" 
              required 
              className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-bold text-emerald-900" 
            />
            <p className="text-[9px] text-emerald-600 italic ml-1 mt-1">As the creator, you will be assigned the <b>Admin</b> role.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email Address</label>
            <input name="email" type="email" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</label>
            <input name="password" type="password" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all" />
          </div>

          <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]">
            Register Account & Group
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