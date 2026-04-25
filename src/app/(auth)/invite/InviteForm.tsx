"use client";

import { useState } from "react";
import { createInvitation } from "@/app/actions/invite";
import { Send, Copy, Check } from "lucide-react";

export default function InviteForm({ groupId, adminId }: { groupId: string; adminId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; token?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createInvitation(email, groupId, adminId);
    setResult(res);
    setLoading(false);
    if (res.success) setEmail("");
  };

  const copyToClipboard = () => {
    if (result?.token) {
      const link = `${window.location.origin}/invite/${result.token}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Invite via Email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="new.member@email.com"
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              required
            />
            <button
              disabled={loading}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:bg-gray-300"
            >
              {loading ? "Processing..." : <><Send size={16} /> Send</>}
            </button>
          </div>
        </div>
      </form>

      {result?.error && (
        <p className="mt-3 text-xs text-red-500 font-medium italic">{result.error}</p>
      )}

      {result?.success && (
        <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
          <div className="truncate mr-4">
            <p className="text-[10px] text-emerald-700 font-bold uppercase">Invite Link Created</p>
            <p className="text-xs text-emerald-900 truncate">.../invite/{result.token}</p>
          </div>
          <button onClick={copyToClipboard} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors">
            {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} className="text-emerald-600" />}
          </button>
        </div>
      )}
    </div>
  );
}