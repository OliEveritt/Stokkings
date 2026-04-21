"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { validateMeeting } from "@/validators/meeting.validator";

interface Group {
  id: string;
  group_name: string;
}

interface FieldErrors {
  groupId?: string;
  date?: string;
  time?: string;
  agenda?: string;
}

export function ScheduleMeetingForm() {
  const { user } = useFirebaseAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [agenda, setAgenda] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const q = query(
        collection(db, "groups"),
        where("members", "array-contains", user!.uid)
      );
      const snapshot = await getDocs(q);
      const list: Group[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        group_name: doc.data().group_name as string,
      }));
      setGroups(list);
      if (list.length === 1) setGroupId(list[0].id);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setGroupsLoading(false);
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!groupId) errors.groupId = "Please select a group";
    const meetingValidation = validateMeeting({ date, time, agenda });
    Object.assign(errors, meetingValidation.errors);
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const selectedGroup = groups.find((g) => g.id === groupId);

    setSubmitting(true);
    try {
      await addDoc(collection(db, "meetings"), {
        groupId,
        groupName: selectedGroup?.group_name ?? "",
        date,
        time,
        agenda: agenda.trim(),
        createdBy: user!.uid,
        createdByName: user!.name,
        createdAt: new Date().toISOString(),
      });
      router.push("/meetings");
    } catch (err) {
      console.error("Failed to create meeting:", err);
      setServerError("Failed to schedule meeting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="meeting-group">
            Group
          </label>
          {groupsLoading ? (
            <div className="text-sm text-gray-400 py-2">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="text-sm text-red-600 py-2">
              You are not a member of any groups yet.
            </div>
          ) : (
            <select
              id="meeting-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white ${
                fieldErrors.groupId ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            >
              <option value="">Select a group...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.group_name}
                </option>
              ))}
            </select>
          )}
          {fieldErrors.groupId && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.groupId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="meeting-date">
            Date
          </label>
          <input
            id="meeting-date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              fieldErrors.date ? "border-red-400 bg-red-50" : "border-gray-300"
            }`}
          />
          {fieldErrors.date && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="meeting-time">
            Time
          </label>
          <input
            id="meeting-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              fieldErrors.time ? "border-red-400 bg-red-50" : "border-gray-300"
            }`}
          />
          {fieldErrors.time && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.time}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="meeting-agenda">
            Agenda
          </label>
          <textarea
            id="meeting-agenda"
            rows={4}
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder="Describe the purpose and topics for this meeting..."
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
              fieldErrors.agenda ? "border-red-400 bg-red-50" : "border-gray-300"
            }`}
          />
          {fieldErrors.agenda && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.agenda}</p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting || groups.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? "Scheduling..." : "Schedule Meeting"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/meetings")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
