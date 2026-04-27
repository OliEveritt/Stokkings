"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDocs, query, where, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { validateMeeting } from "@/validators/meeting.validator";
import { createMeeting } from "@/services/meeting.service";

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
      await createMeeting({
        groupId,
        groupName: selectedGroup?.group_name ?? "",
        date,
        time,
        agenda,
        createdBy: user!.uid,
        createdByName: user!.name ?? "",
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h2 className="text-lg font-semibold text-gray-900">Schedule a Meeting</h2>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {serverError}
        </p>
      )}

      {/* Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
        {groupsLoading ? (
          <p className="text-sm text-gray-400">Loading groups…</p>
        ) : (
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group_name}
              </option>
            ))}
          </select>
        )}
        {fieldErrors.groupId && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.groupId}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldErrors.date && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.date}</p>
        )}
      </div>

      {/* Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {fieldErrors.time && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.time}</p>
        )}
      </div>

      {/* Agenda */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
        <textarea
          rows={4}
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          placeholder="Describe the purpose of this meeting (min. 10 characters)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {fieldErrors.agenda && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.agenda}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting || groupsLoading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Scheduling…" : "Schedule Meeting"}
      </button>
    </form>
  );
}
