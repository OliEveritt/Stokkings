"use client";

import { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { Send, UserPlus, ShieldCheck, Clock, CheckCircle2, Copy, Link2 } from "lucide-react";

export default function OnboardingCenter({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);

  // --- LIVE AUDIT LISTENER ---
  useEffect(() => {
    const q = query(collection(db, "invitations"), where("groupId", "==", groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvites(docs.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds));
    });
    return () => unsubscribe();
  }, [groupId]);

  const handleSendInvite = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const invitationsRef = collection(db, "invitations");
      
      // UAT 3: Duplicate Check
      const checkQ = query(invitationsRef, where("groupId", "==", groupId), where("email", "==", cleanEmail));
      const checkSnap = await getDocs(checkQ);
      
      if (!checkSnap.empty) {
        alert("🚨 Duplicate: This user is already invited or a member.");
        setLoading(false);
        return;
      }

      const newToken = crypto.randomUUID();
      await addDoc(invitationsRef, {
        email: cleanEmail,
        groupId,
        token: newToken,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setEmail("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (token: string) => {
    const fullUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(fullUrl);
    alert("Invitation link copied!");
  };

  return (
    <div className="p-8 max-w-6xl animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: INPUT FORM */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 h-fit">
          <div className="flex items-center gap-5 mb-10">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <UserPlus size={28} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Invite Member</h1>
          </div>

          <div className="space-y-6">
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="new.member@wits.ac.za"
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-semibold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <button 
              onClick={handleSendInvite}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg"
            >
              {loading ? "CHECKING..." : "SEND INVITATION"}
            </button>
            <div className="bg-blue-50/50 p-4 rounded-2xl flex gap-3 border border-blue-100/50">
              <ShieldCheck className="text-blue-500 shrink-0" size={18} />
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">UAT 3: Active duplicate protection.</p>
            </div>
          </div>
        </div>

        {/* RIGHT: LIVE AUDIT TRAIL */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gray-50 text-gray-400 rounded-xl"><Link2 size={20} /></div>
            <h2 className="text-lg font-black text-gray-800">Live Audit Trail</h2>
          </div>

          <div className="space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group">
                <div className="max-w-[180px]">
                  <p className="text-xs font-bold text-gray-700 truncate">{invite.email}</p>
                  <button 
                    onClick={() => copyToClipboard(invite.token)}
                    className="text-[10px] font-black text-emerald-600 flex items-center gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy size={10} /> COPY LINK
                  </button>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${invite.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {invite.status === 'accepted' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  <span className="text-[10px] font-black uppercase tracking-tighter">{invite.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}