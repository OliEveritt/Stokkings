"use client";

import { useState, useEffect, useCallback } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { createInvitation } from "@/app/actions/invite";
import PendingInvites from "@/components/invitations/PendingInvites";
import { 
  UserPlus, ChevronDown, Copy, Loader2, ArrowLeft, 
  ShieldCheck, Check, AlertCircle 
} from "lucide-react";
import Link from "next/link";

export default function GlobalOnboardingCenter() {
  const { user: firebaseUser, loading: authLoading } = useFirebaseAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!firebaseUser) return;
    setFetchError(null);
    try {
      // Satisfies Security Rules: allow list if isAuthenticated
      const token = await firebaseUser.getIdToken()
      const res = await fetch("/api/groups", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) throw new Error(`Audit sync failed: ${res.status}`);
      const data = await res.json();
      const groups = data.groups ?? [];
      setAvailableGroups(groups);
      
      if (groups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groups[0].id);
      }
    } catch (err: any) {
      setFetchError(err.message);
    }
  }, [firebaseUser, selectedGroupId]);

  useEffect(() => {
    if (!authLoading) fetchGroups();
  }, [fetchGroups, authLoading]);

  const handleSendInvite = async () => {
    if (!email || !selectedGroupId || !firebaseUser) return;
    setLoading(true);
    try {
      // 1. Get fresh token to pass Admin check
      const token = await firebaseUser.getIdToken()
      
      // 2. Trigger server action
      
      const result = await createInvitation(email.toLowerCase().trim(), selectedGroupId, firebaseUser.uid);
      
      if (result.success) {
        // 3. Update local state to display the generated link
        const fullUrl = `${window.location.origin}/invite/${result.token}`;
        setGeneratedLink(fullUrl);
        setEmail(""); 
      } else {
        // Handles UAT 3: Email already a member
        alert(result.error);
      }
    } catch (err) {
      alert("System failed to generate invitation.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) return <div className="p-20 text-center animate-pulse text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing Security...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <Link href="/dashboard" className="inline-flex items-center text-[10px] font-black text-gray-400 hover:text-emerald-600 mb-8 tracking-widest uppercase transition-colors">
        <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 h-full">
            <h1 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                <UserPlus size={20} />
              </div>
              Invite Member
            </h1>

            <div className="space-y-6">
              {fetchError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs">
                  <AlertCircle size={14} /> {fetchError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Group</label>
                <div className="relative">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 font-bold text-gray-700 outline-none appearance-none transition-all"
                  >
                    <option value="" disabled>Select a group...</option>
                    {availableGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.group_name || "Stokvel Group"}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 font-semibold text-gray-700 outline-none"
                  placeholder="name@email.com"
                />
              </div>

              <button 
                onClick={handleSendInvite} disabled={loading || !selectedGroupId || !email}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "GENERATE SECURE LINK"}
              </button>

              {generatedLink && (
                <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-between animate-in zoom-in-95">
                  <p className="text-[11px] font-mono text-emerald-800 truncate mr-2">{generatedLink}</p>
                  <button onClick={() => copyToClipboard(generatedLink)} className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600'}`}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Live Audit Trail</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
                <ShieldCheck size={12} /> SECURE LOGS
              </div>
            </div>
            {/* Real-time listener: satisfies UAT 1 */}
            {selectedGroupId ? <PendingInvites groupId={selectedGroupId} /> : <p className="text-center py-20 text-gray-300 italic text-[10px] font-black uppercase tracking-widest">Select a group to view history.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}


