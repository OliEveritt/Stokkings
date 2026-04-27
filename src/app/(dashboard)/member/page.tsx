"use client";

import { Wallet, ArrowUpRight, History, Users } from "lucide-react";

export default function MemberDashboard() {
  return (
    <div className="p-8 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900">Member Dashboard</h1>
        <p className="text-gray-500 font-medium mt-1">Welcome to the group. Your contributions start here.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* BALANCE CARD */}
        <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Total Contribution</p>
            <h2 className="text-5xl font-black tracking-tighter">R0.00</h2>
            <div className="mt-8 flex gap-2">
               <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                 Make Payment <ArrowUpRight size={14} />
               </button>
            </div>
          </div>
          <Wallet className="absolute -right-4 -bottom-4 text-white/10" size={120} />
        </div>

        {/* STATS CARDS */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col justify-between">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Group Status</p>
            <p className="text-lg font-bold text-gray-900 mt-1">Active Member</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col justify-between">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <History size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Next Payout</p>
            <p className="text-lg font-bold text-gray-900 mt-1">Pending Schedule</p>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY PLACEHOLDER */}
      <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[3rem] p-12 text-center">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em]">No Transactions Yet</p>
        <p className="text-xs text-gray-400 mt-2">Your payment history will appear here once you make your first contribution.</p>
      </div>
    </div>
  );
}