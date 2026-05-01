"use client";

import { useState } from "react";
import { createInvitation } from "@/app/actions/invite";
import { Send, Link as LinkIcon, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";

interface InviteMemberFormProps {
  groupId: string;
  adminId: string;
}

interface InviteStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export function InviteMemberForm({ groupId, adminId }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<InviteStatus>({ type: 'idle' });
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupId || !adminId) {
      setStatus({ type: 'error', message: "Missing authorization context." });
      return;
    }
    
    setStatus({ type: 'loading' });

    try {
      const result = await createInvitation(email, groupId, adminId);

      if (result.success) {
        const link = `${window.location.origin}/invite/${result.token}`;
        setInviteLink(link);
        setStatus({ type: 'success', message: "Invitation created successfully!" });
        setEmail("");
      } else {
        setStatus({ type: 'error', message: result.error || "Failed to create invitation." });
      }
    } catch (_err) {
      setStatus({ type: 'error', message: "A network error occurred." });
    }
  };

  const copyToClipboard = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
            Member Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@email.com"
            required
            className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={status.type === 'loading'}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:bg-gray-300"
        >
          {status.type === 'loading' ? (
            "Processing..."
          ) : (
            <>
              <Send size={18} /> Send Invitation
            </>
          )}
        </button>
      </form>

      {/* Error Alert */}
      {status.type === 'error' && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-100 animate-in fade-in">
          <AlertCircle size={14} /> {status.message}
        </div>
      )}

      {/* Success View & Link Generator */}
      {status.type === 'success' && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold mb-3">
            <CheckCircle2 size={16} /> {status.message}
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-emerald-200">
            <input 
              readOnly 
              value={inviteLink} 
              className="flex-1 text-[10px] text-gray-500 truncate bg-transparent outline-none font-mono" 
            />
            <button 
              onClick={copyToClipboard} 
              className="p-1.5 hover:bg-emerald-50 rounded-md transition-colors"
              title="Copy Link"
            >
              {copied ? (
                <Check size={16} className="text-emerald-600" />
              ) : (
                <LinkIcon size={16} className="text-emerald-600" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}