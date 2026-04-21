"use client";

import { useState } from "react";
import { createInvitation } from "@/app/actions/invite";
import { Send, Copy, Check, Mail } from "lucide-react";

export default function InviteMemberForm({ groupId, adminId }: { groupId: string; adminId: string }) {
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
    <div className="space-y-4">
      <form onSubmit={handleInvite} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@email.com"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
            required
          />
        </div>
        <button
          disabled={loading}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 disabled:bg-gray-300"
        >
          {loading ? "..." : <><Send size={16} /> Invite</>}
        </button>
      </form>

      {result?.error && (
        <p className="text-xs text-red-500 font-medium animate-pulse">⚠️ {result.error}</p>
      )}

      {result?.success && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] text-emerald-700 font-mono truncate max-w-[200px]">
            {window.location.origin}/invite/{result.token}
          </p>
          <button onClick={copyToClipboard} className="text-emerald-600 hover:text-emerald-800 transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}