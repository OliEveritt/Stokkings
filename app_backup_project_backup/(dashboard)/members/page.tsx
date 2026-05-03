"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export default function MembersPage() {
  const { user: currentUser, loading: authLoading } = useFirebaseAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const isAdmin = currentUser?.role === "Admin";

  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchMembers();
    }
  }, [isAdmin, authLoading]);

  const fetchMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const membersList: Member[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        membersList.push({
          id: doc.id,
          name: data.name || "Unknown",
          email: data.email,
          role: data.role || "Member",
          phone: data.phone,
        });
      });
      setMembers(membersList);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { role: newRole }, { merge: true });
      
      setMessage({ type: "success", text: `Member role updated to ${newRole} successfully!` });
      fetchMembers(); // Refresh the list
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating role:", error);
      setMessage({ type: "error", text: "Failed to update role" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (authLoading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-600 text-lg font-bold mb-2">Access Denied</div>
          <p className="text-gray-600">Only administrators can view members.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <p className="text-gray-500">Manage your stokvel members and roles</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{member.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{member.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    member.role === "Admin" ? "bg-emerald-100 text-emerald-800" :
                    member.role === "Treasurer" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {member.role !== "Admin" && member.id !== currentUser?.uid && (
                      <button
                        onClick={() => updateRole(member.id, "Admin")}
                        className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        Make Admin
                      </button>
                    )}
                    {member.role !== "Treasurer" && member.role !== "Admin" && (
                      <button
                        onClick={() => updateRole(member.id, "Treasurer")}
                        className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        Make Treasurer
                      </button>
                    )}
                    {member.role !== "Member" && member.role !== "Admin" && (
                      <button
                        onClick={() => updateRole(member.id, "Member")}
                        className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        Make Member
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
