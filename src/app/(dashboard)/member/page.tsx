"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Member {
  id: string;
  email: string;
  role: string;
  joinedAt: any;
}

export default function MembersPage() {
  const { user: currentUser, userRole, loading: authLoading } = useFirebaseAuth();
  const params = useParams();
  const router = useRouter();
  const groupId = (params.groupId || params.id) as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const isAdmin = userRole === "Admin";

  useEffect(() => {
    if (!groupId || !isAdmin || authLoading) return;

    const fetchMembers = async () => {
      try {
        const membersRef = collection(db, "groups", groupId, "group_members");
        const snapshot = await getDocs(membersRef);
        const membersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(membersList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [groupId, isAdmin, authLoading]);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const memberRef = doc(db, "groups", groupId, "group_members", userId);
      await updateDoc(memberRef, { role: newRole });
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
      setMessage({ type: "success", text: "Role updated successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update role" });
    }
  };

  if (authLoading || loading) {
    return <div className="p-8">Loading members...</div>;
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only administrators can view members.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Group Members</h1>
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map(member => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.role === "Admin" ? "bg-emerald-100 text-emerald-800" :
                    member.role === "Treasurer" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.joinedAt?.toDate?.().toLocaleDateString() || "Unknown"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <select
                    value={member.role}
                    onChange={(e) => updateRole(member.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                    disabled={member.id === currentUser.uid}
                  >
                    <option value="Member">Member</option>
                    <option value="Treasurer">Treasurer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}