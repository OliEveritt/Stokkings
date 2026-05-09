"use client";

import { useState, useEffect, use } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  setDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { UserPlus, Clock, CheckCircle2, Copy, Link2, ChevronDown } from "lucide-react";

interface InviteDoc {
  id: string;
  email: string;
  groupId: string;
  token: string;
  status: "pending" | "accepted" | "expired";
  createdAt: Timestamp;
  invitedBy: string;
}

export default function OnboardingCenter({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = use(params);
  const initialGroupId = resolvedParams.groupId;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<InviteDoc[]>([]);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId);

  // 1. Fetch available groups for the Treasurer/Admin
  useEffect(() => {
    const fetchGroups = async () => {
      if (!auth.currentUser) return;
      const q = query(
        collection(db, "groups"),
        where("members", "array-contains", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const groupsData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAvailableGroups(groupsData);
      
      if ((initialGroupId === "undefined" || !initialGroupId) && groupsData.length > 0) {
        setSelectedGroupId(groupsData[0].id);
      }
    };
    fetchGroups();
  }, [initialGroupId]);

  // 2. LIVE AUDIT LISTENER
  useEffect(() => {
    if (!selectedGroupId || selectedGroupId === "undefined") return;

    const q = query(
      collection(db, "invitations"),
      where("groupId", "==", selectedGroupId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as InviteDoc));
      const sorted = docs.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setInvites(sorted);
    });
    return () => unsubscribe();
  }, [selectedGroupId]);

  const handleSendInvite = async () => {
    if (!email || selectedGroupId === "undefined") {
      alert("Please select a group and enter an email.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const invitationsRef = collection(db, "invitations");

      // Duplicate check (any existing invite for this email in this group)
      const checkInviteQ = query(
        invitationsRef,
        where("groupId", "==", selectedGroupId),
        where("email", "==", cleanEmail)
      );
      const inviteSnap = await getDocs(checkInviteQ);
      if (!inviteSnap.empty) {
        alert("This user has already been invited to this group.");
        setLoading(false);
        return;
      }

      // Check if already a member (UAT-3)
      const memberQ = query(
        collection(db, "groups", selectedGroupId, "group_members"),
        where("email", "==", cleanEmail)
      );
      const memberSnap = await getDocs(memberQ);
      if (!memberSnap.empty) {
        alert("This user is already a member of the group.");
        setLoading(false);
        return;
      }

      // Generate token and set expiry (7 days)
      const newToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // FIX: Use token as the Doc ID for fast retrieval on the acceptance page
      await setDoc(doc(db, "invitations", newToken), {
        email: cleanEmail,
        groupId: selectedGroupId,
        token: newToken,
        status: "pending",
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        invitedBy: auth.currentUser?.uid,
      });

      setEmail("");
      alert(`Invitation sent! Link: ${window.location.origin}/invite/${newToken}`);
    } catch (err) {
      console.error(err);
      alert("Failed to send invitation.");
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
        
        {/* LEFT: Invite Form */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 h-fit">
          <div className="flex items-center gap-5 mb-10">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <UserPlus size={28} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Invite Member</h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Target Stokvel Group
              </label>
              <div className="relative">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 font-bold text-gray-700 outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="undefined">Select a group...</option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.group_name || "Stokvel Group"}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                Member Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="new.member@stokvel.com"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 font-semibold text-gray-700 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleSendInvite}
              disabled={loading || selectedGroupId === "undefined"}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "PROCESSING..." : "SEND INVITATION"}
            </button>
          </div>
        </div>

        {/* RIGHT: Live Audit Trail */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-50 text-gray-400 rounded-xl">
                <Link2 size={20} />
              </div>
              <h2 className="text-lg font-black text-gray-800">Live Audit Trail</h2>
            </div>
            <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">
              {invites.length} Records
            </span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {invites.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest">
                No invitations found for this group.
              </p>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:border-emerald-200 transition-all"
                >
                  <div className="max-w-[180px]">
                    <p className="text-xs font-bold text-gray-700 truncate">{invite.email}</p>
                    <button
                      onClick={() => copyToClipboard(invite.token)}
                      className="text-[10px] font-black text-emerald-600 flex items-center gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={10} /> COPY LINK
                    </button>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      invite.status === "accepted"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {invite.status === "accepted" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                      {invite.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}