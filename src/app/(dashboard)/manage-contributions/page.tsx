/**
 * US-2.2: Treasurer Contribution Management
 * This page allows Treasurers and Admins to:
 * - View all member contributions
 * - Confirm pending payments (records name + timestamp)
 * - Flag missed payments
 * - Edit confirmed_by name if needed
 */

"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Contribution {
  id: string;
  amount: number;
  contributionDate: string;
  status: string;
  userId: string;
  groupId: string;
  confirmedBy?: string;
  confirmedAt?: string;
  userName?: string;
}

interface GroupOption {
  id: string;
  name: string;
}

export default function ManageContributionsPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingConfirmedBy, setEditingConfirmedBy] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // ROLE CHECK: Only Treasurers and Admins can access this page
  const isTreasurerOrAdmin = user?.role === "Treasurer" || user?.role === "Admin";

  // Load groups the user belongs to
  useEffect(() => {
    if (!user || !isTreasurerOrAdmin) return;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "groups"), where("members", "array-contains", user.uid))
        );
        const list: GroupOption[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().group_name as string) ?? (d.data().name as string) ?? "Group",
        }));
        setGroups(list);
        if (list.length > 0) {
          setSelectedGroupId((current) => current || list[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading groups:", err);
        setLoading(false);
      }
    })();
  }, [user, isTreasurerOrAdmin]);

  // Refetch contributions whenever the selected group changes
  useEffect(() => {
    if (!selectedGroupId) return;
    fetchContributions(selectedGroupId);
  }, [selectedGroupId]);

  const fetchContributions = async (groupId: string) => {
    try {
      setLoading(true);
      const contribSnap = await getDocs(
        query(collection(db, "contributions"), where("groupId", "==", groupId))
      );

      const usersSnapshot = await getDocs(collection(db, "users"));
      const userMap = new Map();
      usersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        userMap.set(docSnap.id, data.name || data.email?.split('@')[0] || "Unknown");
      });

      const contributionsList: Contribution[] = contribSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          amount: data.amount,
          contributionDate: data.contributionDate,
          status: data.status || "pending",
          userId: data.userId,
          groupId: data.groupId,
          confirmedBy: data.confirmedBy,
          confirmedAt: data.confirmedAt,
          userName: userMap.get(data.userId) || "Unknown",
        };
      });
      setContributions(contributionsList);
    } catch (err) {
      console.error("Error fetching contributions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Confirm or Flag Missed a contribution
  const updateContributionStatus = async (contributionId: string, newStatus: string) => {
    setActionLoading(contributionId);
    setMessage(null);

    try {
      const contributionRef = doc(db, "contributions", contributionId);
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      // If confirming, record who confirmed and when (UAT 1 & 4)
      if (newStatus === "confirmed") {
        updateData.confirmedBy = user?.name;
        updateData.confirmedAt = new Date().toISOString();
      }

      await updateDoc(contributionRef, updateData);
      setMessage({ type: "success", text: `Contribution marked as ${newStatus}!` });
      if (selectedGroupId) await fetchContributions(selectedGroupId);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Error updating contribution:", err);
      setMessage({ type: "error", text: "Failed to update contribution" });
    } finally {
      setActionLoading(null);
    }
  };

  // Edit the confirmed_by field (for fixing old data)
  const updateConfirmedBy = async (contributionId: string, confirmedByName: string) => {
    setActionLoading(contributionId);
    setMessage(null);

    try {
      const contributionRef = doc(db, "contributions", contributionId);
      await updateDoc(contributionRef, {
        confirmedBy: confirmedByName,
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setMessage({ type: "success", text: "Confirmed by updated!" });
      if (selectedGroupId) await fetchContributions(selectedGroupId);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Error updating confirmed by:", err);
      setMessage({ type: "error", text: "Failed to update" });
    } finally {
      setActionLoading(null);
      setEditingConfirmedBy(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">✅ Confirmed</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">⏳ Pending</span>;
      case "missed":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">❌ Missed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status || "Pending"}</span>;
    }
  };

  if (authLoading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  // UAT 3: Access Denied for non-Treasurers/non-Admins
  if (!isTreasurerOrAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only Treasurers and Admins can manage contributions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading contributions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Contributions</h1>
          <p className="text-gray-500 mt-1">
            {groups.find((g) => g.id === selectedGroupId)?.name
              ? `Confirm or flag contributions for ${groups.find((g) => g.id === selectedGroupId)?.name}`
              : "Confirm or flag member contributions"}
          </p>
        </div>
        {groups.length > 1 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">
              Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="mt-1 px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-emerald-500 outline-none text-sm font-semibold"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {contributions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contributions yet</h3>
          <p className="text-gray-500">Contributions will appear here once members make payments.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confirmed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contributions.map((contribution) => (
                  <tr key={contribution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{contribution.userName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatAmount(contribution.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(contribution.contributionDate)}</td>
                    <td className="px-6 py-4">{getStatusBadge(contribution.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {editingConfirmedBy === contribution.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                            placeholder="Enter name"
                            autoFocus
                          />
                          <button onClick={() => updateConfirmedBy(contribution.id, editValue)} className="px-2 py-1 bg-green-500 text-white text-xs rounded">Save</button>
                          <button onClick={() => setEditingConfirmedBy(null)} className="px-2 py-1 bg-gray-500 text-white text-xs rounded">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{contribution.confirmedBy || "-"}</span>
                          {contribution.status === "confirmed" && (
                            <button onClick={() => { setEditingConfirmedBy(contribution.id); setEditValue(contribution.confirmedBy || ""); }} className="text-xs text-blue-500 hover:underline">Edit</button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {contribution.status === "pending" && (
                          <>
                            <button onClick={() => updateContributionStatus(contribution.id, "confirmed")} disabled={actionLoading === contribution.id} className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50">
                              {actionLoading === contribution.id ? "..." : "Confirm"}
                            </button>
                            <button onClick={() => updateContributionStatus(contribution.id, "missed")} disabled={actionLoading === contribution.id} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50">
                              {actionLoading === contribution.id ? "..." : "Flag Missed"}
                            </button>
                          </>
                        )}
                        {contribution.status === "confirmed" && <span className="text-sm text-green-600">✓ Confirmed</span>}
                        {contribution.status === "missed" && <span className="text-sm text-red-600">Missed</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
