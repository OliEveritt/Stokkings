"use client";

import { Calendar, User, ArrowUp, ArrowDown } from "lucide-react";

interface PayoutItem {
  id: string;
  memberName: string;
  position: number;
  expectedDate: any;
  amount: number;
}

export default function PayoutScheduleTable({ 
  schedule, 
  isTreasurer 
}: { 
  schedule: PayoutItem[], 
  isTreasurer: boolean 
}) {

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    // We sort here to ensure the index from the map matches the logical position
    const sortedSchedule = [...schedule].sort((a, b) => a.position - b.position);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= sortedSchedule.length) return;

    const itemA = sortedSchedule[index];
    const itemB = sortedSchedule[newIndex];

    try {
      const response = await fetch('/api/payouts', {
        method: 'PATCH',
        // FIXED: Changed 'ers' to 'headers'
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          updates: [
            { id: itemA.id, newPosition: itemB.position },
            { id: itemB.id, newPosition: itemA.position }
          ]
        })
      });

      if (!response.ok) throw new Error("Update failed");
      // UI will auto-refresh if parent uses onSnapshot
    } catch (err) {
      console.error("Reorder Error:", err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center w-20">Order</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Member</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Expected Date</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Amount</th>
            {isTreasurer && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Manage</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {[...schedule].sort((a, b) => a.position - b.position).map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <span className="flex items-center justify-center mx-auto w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-100 shadow-sm">
                  {item.position}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-400">
                    <User size={14} />
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.memberName}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 italic">
                {item.expectedDate?.seconds 
                  ? new Date(item.expectedDate.seconds * 1000).toLocaleDateString() 
                  : new Date(item.expectedDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                R{item.amount.toLocaleString()}
              </td>
              {isTreasurer && (
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-20"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === schedule.length - 1}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-20"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}