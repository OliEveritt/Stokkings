"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import ScheduleMeetingForm from "@/components/forms/ScheduleMeetingForm";

interface Meeting {
  id: string; groupId: string; groupName?: string; date: string;
  time: string; scheduledAt: string; agenda: string; status: string;
}
interface GroupOption { id: string; name: string; }

export default function MeetingsPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const canSchedule = user?.role === "Admin" || user?.role === "Treasurer";

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { setLoading(false); return; }
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "groups"), where("members", "array-contains", user.uid)));
        const list: GroupOption[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().group_name as string) ?? (d.data().name as string) ?? "Group",
        }));
        setGroups(list);
        if (list.length > 0) setSelectedGroupId(list[0].id);
        else setLoading(false);
      } catch (err) {
        console.error("Error loading groups:", err);
        setLoading(false);
      }
    })();
  }, [authLoading, user?.uid]);

  const fetchMeetings = async (groupId: string) => {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, "meetings"), where("groupId", "==", groupId), orderBy("scheduledAt", "desc")));
      setMeetings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Meeting, "id">) })));
    } catch (err) {
      console.error("Error fetching meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedGroupId) return;
    fetchMeetings(selectedGroupId);
  }, [selectedGroupId]);

  const now = Date.now();
  const upcoming = meetings.filter((m) => new Date(m.scheduledAt).getTime() >= now).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = meetings.filter((m) => new Date(m.scheduledAt).getTime() < now).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  if (authLoading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meetings</h1>
          <p className="text-gray-500 mt-1">
            {groups.find((g) => g.id === selectedGroupId)?.name ? `Upcoming and past meetings for ${groups.find((g) => g.id === selectedGroupId)?.name}` : "Upcoming and past meetings for this group."}
          </p>
        </div>
        {groups.length > 0 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Group</label>
            <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="mt-1 px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-emerald-500 outline-none text-sm font-semibold">
              {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
            </select>
          </div>
        )}
      </div>

      {canSchedule && selectedGroupId && (
        <ScheduleMeetingForm groupId={selectedGroupId} onScheduled={() => fetchMeetings(selectedGroupId)} />
      )}

      {loading ? (
        <div className="p-4 text-gray-500">Loading meetings...</div>
      ) : (
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
    <div className="mb-6">
      <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">{title} ({meetings.length})</h2>
      <div className="space-y-3">
        {meetings.length === 0 ? (<p className="text-sm text-gray-400 italic">No {title.toLowerCase()} meetings.</p>) : (meetings.map((m) => <MeetingCard key={m.id} meeting={m} />))}
      </div>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const dateStr = new Date(meeting.scheduledAt).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  return (
    <Link href={`/meetings/${meeting.id}`} className="block bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-emerald-300 transition-colors">
      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
        <Calendar size={16} className="text-emerald-600" />{dateStr}
        <Clock size={16} className="text-emerald-600 ml-2" />{meeting.time}
      </div>
      <p className="text-sm text-gray-600 mt-2 line-clamp-2 whitespace-pre-wrap">{meeting.agenda}</p>
      <div className="flex items-center justify-end mt-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meeting.status === "scheduled" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{meeting.status || "scheduled"}</span>
      </div>
    </Link>
  );
}
