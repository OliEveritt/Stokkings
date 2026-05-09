"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function DashboardLanding() {
  const { user } = useFirebaseAuth();
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchGroups = async () => {
      const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
      const snap = await getDocs(q);
      setGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchGroups();
  }, [user]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900">My Stokvels</h1>
      </div>
      
      <div className="grid gap-4">
        {groups.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-gray-200 rounded-3xl text-center">
            <p className="text-gray-500">No groups found for your account.</p>
          </div>
        ) : (
          groups.map(group => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <div className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer">
                <h2 className="font-bold text-lg text-emerald-700">{group.group_name || "Unnamed Group"}</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">ID: {group.id}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}