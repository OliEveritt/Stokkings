"use client";

import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Contribution {
  id: string;
  userId: string;
  amount: number;
  date: any;
  status: string;
}

export default function ManageContributionsPage() {
  const { user: firebaseUser, userRole, loading: authLoading } = useFirebaseAuth();
  const params = useParams();
  const router = useRouter();
  const groupId = (params.groupId || params.id) as string;

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const isTreasurerOrAdmin = userRole === "Treasurer" || userRole === "Admin";

  useEffect(() => {
    if (!groupId || !firebaseUser || !isTreasurerOrAdmin) return;
    const fetchContributions = async () => {
      try {
        const contributionsRef = collection(db, "groups", groupId, "contributions");
        const snapshot = await getDocs(contributionsRef);
        const contribs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contribution));
        setContributions(contribs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContributions();
  }, [groupId, firebaseUser, isTreasurerOrAdmin]);

  if (authLoading || userRole === null) {
    return <div className="p-8">Loading...</div>;
  }

  if (!firebaseUser || !isTreasurerOrAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only treasurers and administrators can manage contributions.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Contributions</h1>
      {loading ? (
        <div>Loading contributions...</div>
      ) : contributions.length === 0 ? (
        <div className="text-gray-500">No contributions yet.</div>
      ) : (
        <div className="space-y-2">
          {contributions.map(contrib => (
            <div key={contrib.id} className="border p-3 rounded flex justify-between">
              <span>{contrib.userId}</span>
              <span>R{contrib.amount}</span>
              <span>{contrib.date?.toDate?.().toLocaleDateString() || "Unknown date"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}