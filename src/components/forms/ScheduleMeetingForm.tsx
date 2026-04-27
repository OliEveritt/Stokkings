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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-400">Schedule meeting form — pending implementation</p>
    </div>
  );
}
