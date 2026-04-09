"use client";

import { Users, Shield, Landmark, User } from "lucide-react";

export default function MemberTable({ members }: { members: any[] }) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': // Aligned with dbo.roles table [cite: 19]
        return <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200"><Shield className="w-3 h-3" /> Admin</span>;
      case 'Treasurer':
        return <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200"><Landmark className="w-3 h-3" /> Treasurer</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200"><User className="w-3 h-3" /> Member</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg"><Users className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <h2 className="font-bold text-gray-900">Verified Member Register</h2>
            <p className="text-sm text-gray-500">Official list of all group participants and their mandates.</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-200">
              <th className="px-6 py-4">Name & Surname</th>
              <th className="px-6 py-4">Mandate / Role</th>
              <th className="px-6 py-4">Contact Email</th>
              <th className="px-6 py-4 text-right">Join Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">
                  {member.first_name} {member.surname} {/* [cite: 28] */}
                </td>
                <td className="px-6 py-4">{getRoleBadge(member.role_name)}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">{member.email}</td>
                <td className="px-6 py-4 text-right text-gray-500 text-sm">
                  {new Date(member.join_date).toLocaleDateString('en-ZA')} {/* [cite: 58] */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}