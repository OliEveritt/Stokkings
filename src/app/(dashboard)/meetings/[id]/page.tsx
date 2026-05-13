"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import MinutesForm from "@/components/forms/MinutesForm";
import { Calendar, Clock, ChevronLeft, BookOpen } from "lucide-react";

interface Meeting {
  id: string;
  groupId: string;
  groupName?: string;
  date: string;
  time: string;
  scheduledAt: string;
  agenda: string;
  status: string;
  minutes?: string;
}

export default function MeetingDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSingleMeeting = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const docRef = doc(db, "meetings", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setMeeting({ id: docSnap.id, ...docSnap.data() } as Meeting);
        } else {
          console.error("Meeting not found");
        }
      } catch (err) {
        console.error("Error fetching meeting:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleMeeting();
  }, [id]);

  if (authLoading || loading) return <div className="p-8 text-gray-500 font-semibold italic">Loading meeting details...</div>;
  if (!meeting) return <div className="p-8 text-red-500">Meeting not found.</div>;

  const isTreasurerOrAdmin = user?.role === "Treasurer" || user?.role === "Admin";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Navigation */}
      <Link href="/meetings" className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors">
        <ChevronLeft size={16} /> Back to Meetings
      </Link>

      {/* Meeting Detail Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Meeting Details</h1>
        
        <div className="flex gap-6 mb-8 text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-emerald-600" />
            <span className="font-semibold">{meeting.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-emerald-600" />
            <span className="font-semibold">{meeting.time}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Agenda</h3>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-xl whitespace-pre-wrap border border-gray-100">
            {meeting.agenda}
          </p>
        </div>
      </div>

      {/* Minutes Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <BookOpen size={20} className="text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">Meeting Minutes</h2>
        </div>

        {isTreasurerOrAdmin ? (
          /* CRITICAL GUARD: Only render MinutesForm if meeting.groupId is available.
             This ensures the validator receives all required context for the 
             mid-sprint requirement change.
          */
          meeting?.groupId ? (
            <MinutesForm 
              meetingId={meeting.id} 
              initialMinutes={meeting.minutes || ""}
              meetingDate={meeting.date}
              groupId={meeting.groupId}
              agenda={meeting.agenda}
            />
          ) : (
            <div className="flex items-center justify-center p-8 border border-dashed rounded-2xl">
              <p className="text-sm text-gray-400 animate-pulse">Syncing group data...</p>
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            {meeting.minutes ? (
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{meeting.minutes}</p>
            ) : (
              <p className="italic text-gray-400">No minutes recorded for this meeting.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}