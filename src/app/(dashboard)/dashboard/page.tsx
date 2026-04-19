"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  useEffect(() => {
    async function fetchGroups() {
      if (user) {
        try {
          const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
          const querySnapshot = await getDocs(q);
          const groupsList: Group[] = [];
          querySnapshot.forEach((doc) => {
            groupsList.push({ id: doc.id, ...doc.data() } as Group);
          });
          setGroups(groupsList);
        } catch (error) {
          console.error("Error fetching groups:", error);
        } finally {
          setGroupsLoading(false);
        }
      } else {
        setGroupsLoading(false);
      }
    }
    fetchGroups();
  }, [user]);

  if (loading || groupsLoading) {
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;
  }

  if (!user) {
    return <div className="p-8 text-gray-500">Please log in</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user.name}! You are logged in as <strong>{user.role}</strong>.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase">Your Role</p>
          <h3 className="text-2xl font-black text-emerald-900 mt-2">{user.role}</h3>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase">Account Status</p>
          <h3 className="text-2xl font-black text-blue-900 mt-2">Active</h3>
        </div>

        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
          <p className="text-xs font-bold text-orange-600 uppercase">Member Since</p>
          <h3 className="text-2xl font-black text-orange-900 mt-2">New</h3>
        </div>

        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
          <p className="text-xs font-bold text-purple-600 uppercase">Contributions</p>
          <h3 className="text-2xl font-black text-purple-900 mt-2">R0</h3>
        </div>
      </div>

      {/* My Groups Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">My Groups</h2>
        </div>
        <div className="p-6">
          {groups.length === 0 ? (
            <p className="text-gray-500">You are not a member of any groups yet.</p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg">{group.group_name}</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <p><span className="text-gray-500">Contribution:</span> R{group.contribution_amount}</p>
                    <p><span className="text-gray-500">Payout:</span> {group.payout_frequency}</p>
                    <p><span className="text-gray-500">Order:</span> {group.payout_order}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {user.role === "Admin" && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-green-800">✅ You have Admin access. You can manage members and create groups.</p>
        </div>
      )}
    </div>
  );
}
