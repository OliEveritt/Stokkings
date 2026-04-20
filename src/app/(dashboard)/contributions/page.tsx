"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Contribution {
  id: string;
  amount: number;
  contributionDate: string;
  status: string;
  groupId: string;
  groupName?: string;
}

export default function ContributionsPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchContributions();
    }
  }, [user]);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "contributions"),
        where("userId", "==", user?.uid),
        orderBy("contributionDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      const contributionsList: Contribution[] = [];
      querySnapshot.forEach((doc) => {
        contributionsList.push({ id: doc.id, ...doc.data() } as Contribution);
      });
      setContributions(contributionsList);
    } catch (err) {
      console.error("Error fetching contributions:", err);
      setError("Failed to load contributions");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (contributionId: string, amount: number) => {
    setProcessingPayment(contributionId);
    setError(null);

    try {
      const token = await user?.getIdToken();
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          contributionId,
          amount,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Redirect to Yoco checkout page
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Failed to initiate payment");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = (status || "pending").toLowerCase();
    switch (statusLower) {
      case "confirmed":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            ✅ Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            ⏳ Pending
          </span>
        );
      case "missed":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            ❌ Missed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading your contributions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Contributions</h1>
        <p className="text-gray-500 mt-1">
          Track your savings progress and payment statuses
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {!error && contributions.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No contributions yet
          </h3>
          <p className="text-gray-500">
            You haven't made any contributions to your stokvel yet.
            <br />
            Your contributions will appear here once they are recorded.
          </p>
        </div>
      )}

      {!error && contributions.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contributions.map((contribution) => (
                  <tr key={contribution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(contribution.contributionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatAmount(contribution.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contribution.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contribution.status === "pending" ? (
                        <button
                          onClick={() => handlePayNow(contribution.id, contribution.amount)}
                          disabled={processingPayment === contribution.id}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {processingPayment === contribution.id ? "Processing..." : "Pay Now"}
                        </button>
                      ) : (
                        <span className="text-sm text-green-600">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Contributions:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatAmount(contributions.reduce((sum, c) => sum + Number(c.amount), 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
