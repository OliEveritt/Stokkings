"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useActiveGroup } from "@/context/GroupContext";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import MinutesForm from "@/components/forms/MinutesForm";

export default function MeetingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { activeGroup } = useActiveGroup();
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Authorization check: 
  // In many Stokkings setups, roles are stored in a 'group_members' collection 
  // or a metadata field. Adjust this check based on where you store the 'Treasurer' flag.
  const isAuthorized = activeGroup && (user?.uid === activeGroup.treasurerId || user?.uid === activeGroup.adminId);

  

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

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;

  if (!meeting) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Meeting not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {meeting.agenda}
          </h1>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{meeting.date}</Badge>
            <Badge variant="outline">{meeting.time}</Badge>
            <Badge variant="secondary">{meeting.status || 'Scheduled'}</Badge>
          </div>
        </div>
      </div>

      {/* Agenda Card */}
      <Card title="Agenda">
        <p className="text-gray-700 whitespace-pre-wrap">{meeting.agenda}</p>
      </Card>

      {/* Minutes Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Meeting Minutes</h2>
        
        {isAuthorized ? (
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
                <p className="italic text-gray-400">Minutes for this meeting have not been recorded yet.</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}