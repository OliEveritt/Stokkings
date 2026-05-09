"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function DashboardRedirectPage() {
  const { user, loading } = useFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    const findGroup = async () => {
      try {
        const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          router.replace(`/dashboard/${snap.docs[0].id}`);
        } else {
          router.replace("/create-group");
        }
      } catch {
        router.replace("/create-group");
      }
    };
    findGroup();
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-emerald-600" size={40} />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading your dashboard...</p>
    </div>
  );
}
