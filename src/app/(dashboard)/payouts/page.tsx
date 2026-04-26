"use client";
import { useEffect, useState } from "react";
import { subscribeToPayouts, PayoutMember } from "@/services/payout.service";

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutMember[]>([]);
  const [isAdmin] = useState(true); // Logic to be linked to your Auth context

  useEffect(() => {
    // Replace with dynamic group ID from your context
    const unsubscribe = subscribeToPayouts("current-group-id", setPayouts);
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payout Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage the group payout order.</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payouts.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{member.position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.expectedDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">R {member.amount.toLocaleString()}</td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-900 font-medium">Reorder</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}