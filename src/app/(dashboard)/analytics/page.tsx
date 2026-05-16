"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import PayoutReport from "@/components/analytics/PayoutReport";
import { ComplianceChart } from "@/components/charts/ComplianceChart";
import SavingsGrowthChart from "@/components/analytics/SavingsGrowthChart";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface GroupOption { id: string; name: string; }

type Tab = "payouts" | "compliance" | "savings";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupRole, setGroupRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("payouts");

  // Record payout modal state
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordMember, setRecordMember] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordMessage, setRecordMessage] = useState("");

  // Compliance data
  const [complianceData, setComplianceData] = useState<any>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  // Savings growth data
  const [savingsData, setSavingsData] = useState<any>(null);
  const [savingsLoading, setSavingsLoading] = useState(false);

  const isAdmin = user?.role === "Admin" || groupRole === "Admin";

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchGroups = async () => {
      try {
        const snap = await getDocs(query(collection(db, "groups"), where("members", "array-contains", user.uid)));
        const list: GroupOption[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().group_name as string) ?? "Group",
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

  useEffect(() => {
    if (!selectedGroupId) return;
    if (activeTab === "compliance") fetchCompliance();
    if (activeTab === "savings") fetchSavings();
  }, [selectedGroupId, activeTab]);

  const fetchCompliance = async () => {
    setComplianceLoading(true);
    try {
      const res = await fetch(`/api/analytics/contribution-compliance?groupId=${selectedGroupId}`);
      const data = await res.json();
      setComplianceData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setComplianceLoading(false);
    }
  };

  const fetchSavings = async () => {
    setSavingsLoading(true);
    try {
      const res = await fetch(`/api/analytics/savings-growth?groupId=${selectedGroupId}`);
      const data = await res.json();
      setSavingsData(data);
    } finally {
      setSavingsLoading(false);
    }
  };

  const recordPayout = async () => {
    if (!recordMember || !recordAmount || !recordDate) {
      setRecordMessage("Please fill in all fields");
      return;
    }
    setRecording(true);
    setRecordMessage("");
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) { setRecordMessage("Not authenticated"); setRecording(false); return; }
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/admin/record-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupId: selectedGroupId, memberName: recordMember, amount: parseFloat(recordAmount), payoutDate: recordDate }),
      });
      const data = await response.json();
      if (response.ok) {
        setRecordMessage("Payout recorded successfully!");
        setTimeout(() => { setShowRecordModal(false); setRecordMember(""); setRecordAmount(""); setRecordDate(""); setRecordMessage(""); window.location.reload(); }, 1500);
      } else {
        setRecordMessage(data.error || "Failed to record payout");
      }
    } catch (err) {
      setRecordMessage("Something went wrong");
    } finally {
      setRecording(false);
    }
  };

  if (authLoading || loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!isAdmin) return <div className="p-8 text-center"><div className="text-red-600 text-6xl mb-4">⛔</div><h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1><p className="text-gray-600">Only Admins can view analytics reports.</p></div>;
  if (groups.length === 0) return <div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900 mb-2">No groups</h1><p className="text-gray-600">Join or create a group to view analytics.</p></div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "payouts", label: "Payout History & Projections" },
    { id: "compliance", label: "Contribution Compliance" },
    { id: "savings", label: "Group Savings Growth" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Group financial reports and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Group</p>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-emerald-500 outline-none text-sm font-semibold"
            >
              {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
            </select>
          </div>
          {activeTab === "payouts" && (
            <button
              onClick={() => setShowRecordModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold mt-4"
            >
              + Record Past Payout
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "payouts" && selectedGroupId && (
        <PayoutReport groupId={selectedGroupId} />
      )}

      {activeTab === "compliance" && (
        <div className="space-y-6">
          {complianceLoading ? (
            <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>
          ) : !complianceData?.hasData ? (
            <EmptyState
              title="No contribution data yet"
              subtitle="Compliance data will appear once contributions have been recorded for this group."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {complianceData.members.map((member: any) => (
                  <div key={member.memberId} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 truncate">{member.memberName}</p>
                    <p className={`mt-1 text-2xl font-semibold ${
                      member.overallCompliance >= 80 ? "text-emerald-600"
                      : member.overallCompliance >= 50 ? "text-amber-600"
                      : "text-red-600"
                    }`}>{member.overallCompliance}%</p>
                    <p className="text-xs text-gray-400">Overall</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-base font-medium text-gray-700 mb-4">Compliance over time</h2>
                <ComplianceChart members={complianceData.members} periods={complianceData.periods} />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "savings" && (
        <div className="space-y-6">
          {savingsLoading ? (
            <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>
          ) : !savingsData?.hasData ? (
            <EmptyState
              title="No savings data yet"
              subtitle="Group savings growth will appear once confirmed contributions have been recorded."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm border-l-4 border-l-emerald-500">
                  <p className="text-sm text-gray-500">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(
                      savingsData.dataPoints[savingsData.dataPoints.length - 1]?.cumulative ?? 0
                    )}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm border-l-4 border-l-teal-500">
                  <p className="text-sm text-gray-500">Months Tracked</p>
                  <p className="text-2xl font-bold text-gray-900">{savingsData.dataPoints.length}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-base font-medium text-gray-700 mb-1">Cumulative Group Savings</h2>
                <p className="text-xs text-gray-400 mb-4">Solid line = cumulative total · Dashed line = monthly contributions</p>
                <SavingsGrowthChart dataPoints={savingsData.dataPoints} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Record Payout Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Record Past Payout</h2>
            {recordMessage && <div className={`p-2 rounded mb-3 ${recordMessage.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{recordMessage}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Member Name</label><input type="text" value={recordMember} onChange={(e) => setRecordMember(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g., John Doe" /></div>
              <div><label className="block text-sm font-medium mb-1">Amount (R)</label><input type="number" value={recordAmount} onChange={(e) => setRecordAmount(e.target.value)} className="w-full p-2 border rounded" placeholder="500" /></div>
              <div><label className="block text-sm font-medium mb-1">Payout Date</label><input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className="w-full p-2 border rounded" /></div>
              <div className="flex gap-3 mt-4">
                <button onClick={recordPayout} disabled={recording} className="flex-1 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 disabled:opacity-50">{recording ? "Recording..." : "Record Payout"}</button>
                <button onClick={() => setShowRecordModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}