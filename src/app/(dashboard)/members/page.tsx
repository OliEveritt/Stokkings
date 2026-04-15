"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../layout";

interface Member {
  user_id: number;
  first_name: string;
  surname: string;
  email: string;
  role_name: string;
  group_id: number;
}

export default function MembersPage() {
  const auth = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Check if current user is Admin
  const isAdmin = auth?.role === "Admin";

  useEffect(() => {
    if (isAdmin) {
      fetchMembers();
    }
  }, [isAdmin]);

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/members");
      const data = await response.json();
      // Use a Map to deduplicate members by user_id
      const uniqueMembers = Array.from(
        new Map(data.members?.map((m: Member) => [m.user_id, m])).values()
      );
      setMembers(uniqueMembers || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: number, groupId: number, roleName: string) => {
    try {
      const response = await fetch("/api/members/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, group_id: groupId, role_name: roleName }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `Member role updated to ${roleName} successfully!` });
        fetchMembers(); // Refresh the list
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update role" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong" });
    }
  };

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
              <tr key={`member-${member.user_id}`}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {member.first_name} {member.surname}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{member.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    member.role_name === "Admin" ? "bg-emerald-100 text-emerald-800" :
                    member.role_name === "Treasurer" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {member.role_name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {member.role_name !== "Admin" && (
                      <button
                        onClick={() => updateRole(member.user_id, member.group_id, "Admin")}
                        className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        Make Admin
                      </button>
                    )}
                    {member.role_name !== "Treasurer" && member.role_name !== "Admin" && (
                      <button
                        onClick={() => updateRole(member.user_id, member.group_id, "Treasurer")}
                        className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        Make Treasurer
                      </button>
                    )}
                    {member.role_name !== "Member" && member.role_name !== "Admin" && (
                      <button
                        onClick={() => updateRole(member.user_id, member.group_id, "Member")}
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
