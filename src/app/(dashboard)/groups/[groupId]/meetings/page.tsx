"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import ScheduleMeetingForm from "@/components/forms/ScheduleMeetingForm";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, FileText } from "lucide-react";

interface Meeting {
  id: string;
  groupId: string;
  date: string;
  time: string;
  scheduledAt: string;
  agenda: string;
  status: string;
  createdByName?: string;
  createdAt?: Timestamp;
}

export default function GroupMeetingsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [groupRole, setGroupRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || !groupId) return;
    getDoc(doc(db, "groups", groupId, "group_members", user.uid)).then((snap) => {
      setGroupRole(snap.exists() ? (snap.data().role as string) : null);
    });
  }, [authLoading, user, groupId]);

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "meetings"),
      where("groupId", "==", groupId),
      orderBy("scheduledAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMeetings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Meeting)));
        setLoading(false);
      },
      (err) => {
        console.error("meetings snapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [groupId]);

  const canSchedule =
    groupRole === "Admin" ||
    groupRole === "Treasurer" ||
    user?.role === "Admin" ||
    user?.role === "Treasurer";

  const now = Date.now();
  const upcoming = meetings
    .filter((m) => new Date(m.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = meetings
    .filter((m) => new Date(m.scheduledAt).getTime() < now)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700 mb-4"
      >
        <ArrowLeft size={16} /> Back to group
      </Link>

      <h1 className="text-3xl font-black text-gray-900 mb-1">Meetings</h1>
      <p className="text-sm text-gray-500 mb-8">
        Upcoming and past meetings for this group.
      </p>

      {canSchedule && (
        <div className="mb-8">
          <ScheduleMeetingForm groupId={groupId!} />
        </div>
      )}

      <Section title="Upcoming" meetings={upcoming} loading={loading} emptyText="No upcoming meetings." />
      <Section title="Past" meetings={past} loading={loading} emptyText="No past meetings yet." />
    </div>
  );
}

function Section({
  title,
  meetings,
  loading,
  emptyText,
}: {
  title: string;
  meetings: Meeting[];
  loading: boolean;
  emptyText: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
        {title} ({meetings.length})
      </h2>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : meetings.length === 0 ? (
          <p className="text-sm text-gray-400 italic">{emptyText}</p>
        ) : (
          meetings.map((m) => <MeetingCard key={m.id} meeting={m} />)
        )}
      </div>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const dateStr = new Date(meeting.scheduledAt).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
            <Calendar size={16} className="text-emerald-600" />
            {dateStr}
            <Clock size={16} className="text-emerald-600 ml-2" />
            {meeting.time}
          </div>
          <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
            <FileText size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <p className="whitespace-pre-wrap">{meeting.agenda}</p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
            meeting.status === "scheduled"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {meeting.status}
        </span>
      </div>
      {meeting.createdByName && (
        <p className="text-xs text-gray-400 mt-3">Scheduled by {meeting.createdByName}</p>
      )}
    </div>
  );
}
