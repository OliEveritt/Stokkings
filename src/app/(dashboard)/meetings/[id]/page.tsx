"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useActiveGroup } from "@/context/GroupContext";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import MinutesForm from "@/components/forms/MinutesForm";

export default function MeetingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { activeGroup } = useActiveGroup();
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("Member");

  useEffect(() => {
    async function fetchMeeting() {
      if (!id) return;
      try {
        const docRef = doc(db, "meetings", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMeeting({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching meeting:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMeeting();
  }, [id]);

  useEffect(() => {
    async function fetchRole() {
      if (!user?.uid) return;
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const topRole = userSnap.exists() ? userSnap.data()?.role : "Member";
        if (["Admin", "admin", "Treasurer", "treasurer"].includes(topRole)) {
          setUserRole(topRole);
          return;
        }
        if (!activeGroup?.id) return;
        const memberSnap = await getDoc(
          doc(db, "groups", activeGroup.id, "group_members", user.uid)
        );
        setUserRole(memberSnap.exists() ? memberSnap.data()?.role ?? "Member" : "Member");
      } catch (error) {
        console.error("Error fetching role:", error);
      }
    }
    fetchRole();
  }, [user?.uid, activeGroup?.id]);

  const canEditMinutes =
    userRole === "Treasurer" ||
    userRole === "treasurer" ||
    userRole === "Admin" ||
    userRole === "admin";

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;

  if (!meeting) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Meeting not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
      >
        ← Back to Meetings
      </button>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {meeting.agenda}
          </h1>
          <div className="flex gap-2 mt-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">{meeting.date}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">{meeting.time}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">{meeting.status || "Scheduled"}</span>
          </div>
        </div>
      </div>

      {/* Agenda Card */}
      <Card>
        <p className="text-sm font-medium text-gray-500 mb-2">Agenda</p>
        <p className="text-gray-700 whitespace-pre-wrap">{meeting.agenda}</p>
      </Card>

      {/* Minutes Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Meeting Minutes</h2>

        {canEditMinutes ? (
          <MinutesForm
            meetingId={meeting.id}
            initialMinutes={meeting.minutes || ""}
          />
        ) : (
          <Card>
            <div className="prose max-w-none text-gray-700">
              {meeting.minutes ? (
                <p className="whitespace-pre-wrap">{meeting.minutes}</p>
              ) : (
                <p className="italic text-gray-400">
                  Minutes for this meeting have not been recorded yet.
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}