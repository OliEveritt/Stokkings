"use client";

import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useParams, useRouter } from "next/navigation";
import { doc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

<<<<<<< Updated upstream
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
=======
interface Contribution {
  id: string;
  userId: string;
  amount: number;
  date: any;
  status: string;
}

export default function ManageContributionsPage() {
  const { user: firebaseUser, userRole, loading: authLoading } = useFirebaseAuth();
  const params = useParams();
  const router = useRouter();
  const groupId = (params.groupId || params.id) as string;
  
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const isTreasurerOrAdmin = userRole === "Treasurer" || userRole === "Admin";

  useEffect(() => {
    if (!groupId || !firebaseUser || !isTreasurerOrAdmin) return;
    const fetchContributions = async () => {
      try {
        const contributionsRef = collection(db, "groups", groupId, "contributions");
        const snapshot = await getDocs(contributionsRef);
        const contribs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contribution));
        setContributions(contribs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContributions();
  }, [groupId, firebaseUser, isTreasurerOrAdmin]);

  if (authLoading || userRole === null) {
    return <div className="p-8">Loading...</div>;
  }

  if (!firebaseUser || !isTreasurerOrAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only treasurers and administrators can manage contributions.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
>>>>>>> Stashed changes

  if (loading || groupsLoading) {
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;
  }

  if (!user) {
    return <div className="p-8 text-gray-500">Please log in</div>;
  }

  return (
<<<<<<< Updated upstream
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
=======
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Contributions</h1>
      {loading ? (
        <div>Loading contributions...</div>
      ) : contributions.length === 0 ? (
        <div className="text-gray-500">No contributions yet.</div>
      ) : (
        <div className="space-y-2">
          {contributions.map(contrib => (
            <div key={contrib.id} className="border p-3 rounded flex justify-between">
              <span>{contrib.userId}</span>
              <span>R{contrib.amount}</span>
              <span>{contrib.date?.toDate?.().toLocaleDateString() || "Unknown date"}</span>
            </div>
          ))}
>>>>>>> Stashed changes
        </div>
      )}
    </div>
  );
}
