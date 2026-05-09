"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";

interface Meeting {
  id: string;
  groupId: string;
  groupName?: string;
  date: string;
  time: string;
  scheduledAt: string;
  agenda: string;
  status: string;
}

export default function MeetingsPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      try {
        const groupSnap = await getDocs(
          query(collection(db, "groups"), where("members", "array-contains", user.uid))
        );
        const groupIds = groupSnap.docs.map((d) => d.id);
        if (groupIds.length === 0) {
          setMeetings([]);
          return;
        }
        // Firestore "in" query supports max 10 values per call.
        const chunks: string[][] = [];
        for (let i = 0; i < groupIds.length; i += 10) {
          chunks.push(groupIds.slice(i, i + 10));
        }
        const all: Meeting[] = [];
        for (const chunk of chunks) {
          const snap = await getDocs(
            query(
              collection(db, "meetings"),
              where("groupId", "in", chunk),
              orderBy("scheduledAt", "desc")
            )
          );
          snap.forEach((d) => all.push({ id: d.id, ...(d.data() as Omit<Meeting, "id">) }));
        }
        setMeetings(all);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user]);

  const now = Date.now();
  const upcoming = meetings
    .filter((m) => new Date(m.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = meetings
    .filter((m) => new Date(m.scheduledAt).getTime() < now)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-gray-900 mb-1">Your Meetings</h1>
      <p className="text-sm text-gray-500 mb-8">
        All meetings across the groups you belong to. To schedule, open a specific group.
      </p>

      {loading && <p className="text-sm text-gray-400">Loading...</p>}

      {!loading && (
        <>
          <Section title="Upcoming" meetings={upcoming} />
          <Section title="Past" meetings={past} />
        </>
      )}
    </div>
  );
}

function Section({ title, meetings }: { title: string; meetings: Meeting[] }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
        {title} ({meetings.length})
      </h2>
      <div className="space-y-3">
        {meetings.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No {title.toLowerCase()} meetings.</p>
        ) : (
          meetings.map((m) => <Card key={m.id} meeting={m} />)
        )}
      </div>
    </div>
  );
}

function Card({ meeting }: { meeting: Meeting }) {
  const dateStr = new Date(meeting.scheduledAt).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <Link
      href={`/groups/${meeting.groupId}/meetings`}
      className="block bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-emerald-300"
    >
      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
        <Calendar size={16} className="text-emerald-600" />
        {dateStr}
        <Clock size={16} className="text-emerald-600 ml-2" />
        {meeting.time}
      </div>
      <p className="text-sm text-gray-600 mt-2 line-clamp-2 whitespace-pre-wrap">{meeting.agenda}</p>
      {meeting.groupName && (
        <p className="text-xs text-gray-400 mt-2">Group: {meeting.groupName}</p>
      )}
    </Link>
  );
}
