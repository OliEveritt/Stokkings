"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/(dashboard)/layout";
import { getDashboardStats } from "../actions";

export default function DashboardPage() {
  const auth = useAuth();
  const [stats, setStats] = useState({
    totalContributions: 0,
    memberCount: 0,
    nextPayout: null,
    complianceRate: 0,
    loading: true
  });

useEffect(() => {
    async function refreshLedger() {
      // Check if auth is loaded and if group_id exists
      if (auth?.group_id) {
        try {
          setStats(prev => ({ ...prev, loading: true }));
          const data = await getDashboardStats(auth.group_id);
          
          setStats({
            totalContributions: data.totalContributions || 0,
            memberCount: data.memberCount || 0,
            nextPayout: data.nextPayout,
            complianceRate: data.complianceRate || 0,
            loading: false // Audit complete
          });
        } catch (error) {
          console.error("Dashboard Stats Error:", error);
          setStats(prev => ({ ...prev, loading: false }));
        }
      } else if (auth) {
        // Auth is loaded but no group_id found - stop the spinner
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
    refreshLedger();
  }, [auth, auth?.group_id]); // Watch both the auth object and the specific ID
  
  if (stats.loading) return <div className="p-8 text-gray-500 animate-pulse">Auditing records...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's a live overview of {auth?.group}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Contributions */}
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase">Total Contributions</p>
          <h3 className="text-2xl font-black text-emerald-900 mt-2">
            R {stats.totalContributions.toLocaleString()}
          </h3>
        </div>

        {/* Card 2: Members */}
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase">Members</p>
          <h3 className="text-2xl font-black text-blue-900 mt-2">{stats.memberCount}</h3>
        </div>

        {/* Card 3: Next Payout */}
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
          <p className="text-xs font-bold text-orange-600 uppercase">Next Payout</p>
          <h3 className="text-2xl font-black text-orange-900 mt-2">
            {stats.nextPayout ? new Date(stats.nextPayout).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) : "---"}
          </h3>
        </div>

        {/* Card 4: Compliance */}
        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
          <p className="text-xs font-bold text-purple-600 uppercase">Compliance Rate</p>
          <h3 className="text-2xl font-black text-purple-900 mt-2">{stats.complianceRate}%</h3>
        </div>
      </div>
    </div>
  );
}