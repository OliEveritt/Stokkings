"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";

interface Meeting {
  id: string;
  date: string;
  time: string;
  agenda: string;
  createdByName: string;
  createdAt: string;
  groupId: string;
  groupName?: string;
}

interface Group {
  id: string;
  group_name: string;
}

export default function MeetingsPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSchedule = user?.role === "Treasurer" || user?.role === "Admin";

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user]);

  const fetchData = async () => {
    try {
      const groupsSnapshot = await getDocs(
        query(collection(db, "groups"), where("members", "array-contains", user!.uid))
      );
      const groups: Group[] = groupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        group_name: doc.data().group_name as string,
      }));
      const groupMap = Object.fromEntries(groups.map((g) => [g.id, g.group_name]));

      if (groups.length === 0) {
        setMeetings([]);
        setLoading(false);
        return;
      }

      const groupIds = groups.map((g) => g.id);
      const meetingsSnapshot = await getDocs(
        query(
          collection(db, "meetings"),
          where("groupId", "in", groupIds),
          orderBy("date", "asc")
        )
      );

      const list: Meeting[] = meetingsSnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Meeting, "id">;
        return { id: doc.id, ...data, groupName: groupMap[data.groupId] || "" };
      });
      setMeetings(list);
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setError("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    const d = new Date();
    d.setHours(Number(h), Number(m));
    return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = meetings.filter((m) => new Date(m.date) >= today);
  const past = meetings.filter((m) => new Date(m.date) < today);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading meetings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">
            View upcoming meetings, agendas, and past records.
          </p>
        </div>
        {canSchedule && (
          <button
            onClick={() => router.push("/meetings/new")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Schedule Meeting
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Upcoming Meetings</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-gray-500 text-sm">No upcoming meetings scheduled.</p>
            {canSchedule && (
              <button
                onClick={() => router.push("/meetings/new")}
                className="mt-4 text-emerald-600 hover:underline text-sm"
              >
                Schedule one now
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                formatDate={formatDate}
                formatTime={formatTime}
                upcoming
              />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Past Meetings</h2>
          <div className="space-y-3">
            {[...past].reverse().map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                formatDate={formatDate}
                formatTime={formatTime}
                upcoming={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MeetingCard({
  meeting,
  formatDate,
  formatTime,
  upcoming,
}: {
  meeting: Meeting;
  formatDate: (d: string) => string;
  formatTime: (t: string) => string;
  upcoming: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex gap-4">
      <div
        className={`flex-shrink-0 w-1 rounded-full ${upcoming ? "bg-emerald-500" : "bg-gray-300"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{formatDate(meeting.date)}</span>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              upcoming ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
            }`}
          >
            {upcoming ? "Upcoming" : "Past"}
          </span>
          {meeting.groupName && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {meeting.groupName}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-2">
          {formatTime(meeting.time)} &middot; Scheduled by {meeting.createdByName || "Unknown"}
        </p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.agenda}</p>
      </div>
    </div>
  );
}
