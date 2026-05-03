"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import Link from "next/link";

interface Member {
  id: string;
  userId: string;
  email?: string;
  displayName?: string;
  role: string;
  joinedAt: any;
}

export default function GroupDashboardPage() {
  const { groupId } = useParams();
  const { user } = useFirebaseAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Fetch group name + admin role
  useEffect(() => {
    if (!groupId || !user) return;
    const groupRef = doc(db, "groups", groupId as string);
    getDoc(groupRef).then((snap) => {
      if (snap.exists()) setGroupName(snap.data().group_name || snap.data().name || "Group");
    });
    const memberRef = doc(db, "groups", groupId as string, "group_members", user.uid);
    getDoc(memberRef).then((snap) => {
      setIsAdmin(snap.data()?.role === "Admin");
    });
  }, [groupId, user]);

  // 2. REAL-TIME MEMBER LIST (updates instantly when a new member accepts an invitation)
  useEffect(() => {
    if (!groupId) return;
    const membersRef = collection(db, "groups", groupId as string, "group_members");
    const q = query(membersRef, orderBy("joinedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];
      setMembers(memberList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId]);

  if (loading) {
    return <div className="p-8 text-center">Loading group...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">{groupName}</h1>
        <p className="text-sm text-gray-500 mt-1">Group ID: {groupId}</p>
      </div>

      {isAdmin && (
        <div className="mb-8">
          <Link
            href={`/dashboard/groups/${groupId}/invite`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl transition-all"
          >
            + Invite Members
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-500">
            Members ({members.length})
          </h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {members.map((member) => (
            <li key={member.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <p className="font-semibold text-gray-800">
                  {member.displayName || member.email || member.userId}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Joined{" "}
                  {member.joinedAt?.toDate
                    ? member.joinedAt.toDate().toLocaleDateString()
                    : new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  member.role === "Admin" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {member.role}
              </span>
            </li>
          ))}
          {members.length === 0 && (
            <li className="px-6 py-12 text-center text-gray-400">No members yet. Invite your first member!</li>
          )}
        </ul>
      </div>
    </div>
  );
}