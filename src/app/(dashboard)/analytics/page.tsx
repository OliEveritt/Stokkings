/**
 * US-3.2: Payout History and Projections Report
 */

"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import PayoutReport from "@/components/analytics/PayoutReport";

interface GroupOption {
  id: string;
  name: string;
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupRole, setGroupRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordMember, setRecordMember] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordMessage, setRecordMessage] = useState("");

  const isAdmin = user?.role === "Admin" || groupRole === "Admin";

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchGroups = async () => {
      try {
        const snap = await getDocs(query(collection(db, "groups"), where("members", "array-contains", user.uid)));
        const list: GroupOption[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().group_name as string) ?? (d.data().name as string) ?? "Group",
        }));
        setGroups(list);
        if (list.length > 0) setSelectedGroupId((current) => current || list[0].id);
      } finally { setLoading(false); }
    };
    fetchGroups();
  }, [authLoading, user]);

  useEffect(() => {
    if (!user || !selectedGroupId) { setGroupRole(null); return; }
    getDoc(doc(db, "groups", selectedGroupId, "group_members", user.uid)).then((snap) => {
      setGroupRole(snap.exists() ? (snap.data().role as string) : null);
    });
  }, [user, selectedGroupId]);

  const recordPayout = async () => {
    if (!recordMember || !recordAmount || !recordDate) {
      setRecordMessage("Please fill in all fields");
      return;
    }
    setRecording(true);
    setRecordMessage("");

    try {
      // Get the current Firebase user and token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setRecordMessage("Not authenticated");
        setRecording(false);
        return;
      }
      const token = await currentUser.getIdToken();

      const requestBody = {
        groupId: selectedGroupId,
        memberName: recordMember,
        amount: parseFloat(recordAmount),
        payoutDate: recordDate,
      };

      const response = await fetch("/api/admin/record-payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setRecordMessage("Payout recorded successfully!");
        setTimeout(() => {
          setShowRecordModal(false);
          setRecordMember("");
          setRecordAmount("");
          setRecordDate("");
          setRecordMessage("");
          window.location.reload();
        }, 1500);
      } else {
        setRecordMessage(data.error || "Failed to record payout");
      }
    } catch (err) {
      console.error("Error:", err);
      setRecordMessage("Something went wrong: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRecording(false);
    }
  };

  if (authLoading || loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!isAdmin) return <div className="p-8 text-center"><div className="text-red-600 text-6xl mb-4">⛔</div><h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1><p className="text-gray-600">Only Admins can view analytics reports.</p></div>;
  if (groups.length === 0) return <div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900 mb-2">No groups</h1><p className="text-gray-600">Join or create a group to view analytics.</p></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1><p className="text-sm text-gray-500 mt-1">Payout history and projections</p></div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-gray-500">Group</p><select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="mt-1 px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-emerald-500 outline-none text-sm font-semibold">{groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}</select></div>
        <button onClick={() => setShowRecordModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Record Past Payout</button>
      </div>
      {selectedGroupId && <PayoutReport groupId={selectedGroupId} />}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Record Past Payout</h2>
            {recordMessage && <div className={`p-2 rounded mb-3 ${recordMessage.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{recordMessage}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Member Name</label><input type="text" value={recordMember} onChange={(e) => setRecordMember(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., John Doe" /></div>
              <div><label className="block text-sm font-medium mb-1">Amount (R)</label><input type="number" value={recordAmount} onChange={(e) => setRecordAmount(e.target.value)} className="w-full p-2 border rounded" placeholder="500" /></div>
              <div><label className="block text-sm font-medium mb-1">Payout Date</label><input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className="w-full p-2 border rounded" /></div>
              <div className="flex gap-3 mt-4"><button onClick={recordPayout} disabled={recording} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">{recording ? "Recording..." : "Record Payout"}</button><button onClick={() => setShowRecordModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
