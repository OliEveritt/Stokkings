"use client";

import { useState, useEffect, useCallback } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { 
  Users, Wallet, ArrowUpRight, TrendingUp, 
  Plus, Loader2, AlertCircle 
} from "lucide-react";
import Link from "next/link";

export default function GroupDashboardPage() {
  const { user: firebaseUser, loading: authLoading } = useFirebaseAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/groups", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error(`Failed to load dashboard: ${res.status}`);
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!authLoading) fetchDashboardData();
  }, [authLoading, fetchDashboardData]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Syncing Financial Data...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 font-medium">Welcome back, {firebaseUser?.name || "Member"}</p>
        </div>
        <Link 
          href="/invitations"
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 w-fit"
        >
          <Plus size={18} /> INVITE MEMBERS
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users size={24} /></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Groups</span>
          </div>
          <p className="text-4xl font-black text-gray-900">{groups.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={24} /></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Contributions</span>
          </div>
          <p className="text-4xl font-black text-gray-900">R 0.00</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><TrendingUp size={24} /></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Payout</span>
          </div>
          <p className="text-lg font-black text-gray-900 uppercase">None Scheduled</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2">Your Stokvels</h2>
        {groups.length === 0 ? (
          <div className="bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 p-20 text-center">
            <p className="text-gray-400 font-bold mb-4">You haven't joined any groups yet.</p>
            <Link href="/invitations" className="text-emerald-600 font-black text-sm underline">
              Start by inviting someone
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => (
              <Link 
                key={group.id} 
                href={`/dashboard/${group.id}`}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl hover:border-emerald-500 transition-all group block"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">{group.group_name}</h3>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase">
                      {group.payout_frequency}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-2xl transition-colors">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contribution</p>
                    <p className="text-xl font-black text-emerald-600">R {group.contribution_amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Members</p>
                    <p className="text-xl font-black text-gray-900">{group.members?.length || 0}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
