"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowRight, 
  ShieldCheck 
} from "lucide-react";

interface Group {
  id: string;
  group_name: string;
  contribution_amount: number;
  payout_frequency: string;
  payout_order: string;
  created_at: any;
}

export default function DashboardPage() {
  const { user, loading } = useFirebaseAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // If auth is finished and no user exists, stop loading but don't redirect here
    // to avoid fighting the middleware logic.
    if (!loading && !user) {
      setGroupsLoading(false);
      return;
    }

    if (user) {
      // Real-time reconciliation of group membership
      const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const groupsList: Group[] = [];
        querySnapshot.forEach((doc) => {
          groupsList.push({ id: doc.id, ...doc.data() } as Group);
        });
        setGroups(groupsList);
        setGroupsLoading(false);
      }, (error) => {
        console.error("Audit Error fetching groups:", error);
        setGroupsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, loading]);

  // 1. Loading State (Prevents the 500 error during hydration)
  if (loading || groupsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-emerald-600 font-black tracking-widest uppercase">
          Reconciling Ledgers...
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6">
        <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-600">
          <ShieldCheck size={48} />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 font-medium">Please sign in to your Stokvel account to view your active groups.</p>
        <button 
          onClick={() => router.push("/login")}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all"
        >
          LOG IN TO DASHBOARD
        </button>
      </div>
    );
  }

  // 3. Authenticated Dashboard View
  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">
            Welcome back, <span className="text-emerald-600 font-bold">{user?.name}</span>. 
          </p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <ShieldCheck className="text-emerald-500" size={20} />
          <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">
            Verified {user?.role} Access
          </span>
        </div>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Role" value={user?.role || "Member"} icon={<Users size={24} />} color="emerald" />
        <StatCard title="Account Status" value="Active" icon={<ShieldCheck size={24} />} color="blue" />
        <StatCard title="Total Groups" value={groups.length.toString()} icon={<LayoutDashboard size={24} />} color="orange" />
        <StatCard title="Total Contribution" value={`R${groups.reduce((acc, g) => acc + (g.contribution_amount || 0), 0)}`} icon={<Wallet size={24} />} color="purple" />
      </div>

      {/* GROUPS LIST */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-gray-800 tracking-tight">My Active Groups</h2>
        {groups.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-16 text-center">
            <p className="text-gray-400 font-bold text-lg">No active group memberships detected.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map((group) => (
              <div 
                key={group.id} 
                className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 hover:border-emerald-200 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-emerald-600">
                      {group.group_name}
                    </h3>
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest mt-1">ID: {group.id.substring(0, 8)}</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/groups/${group.id}/invite`)}
                    className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <DetailItem label="Contribution" value={`R${group.contribution_amount}`} />
                  <DetailItem label="Frequency" value={group.payout_frequency} />
                  <DetailItem label="Payout Type" value={group.payout_order} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: any, color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100"
  };

  return (
    <div className={`${colors[color]} p-6 rounded-[2rem] border shadow-sm`}>
      <div className="flex items-center justify-between opacity-80 mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
        {icon}
      </div>
      <h3 className="text-2xl font-black tracking-tight">{value}</h3>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">{label}</p>
      <p className="text-xs font-black text-gray-700 capitalize">{value}</p>
    </div>
  );
}