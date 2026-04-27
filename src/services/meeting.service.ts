import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Meeting {
  id: string;
  groupId: string;
  groupName: string;
  date: string;
  time: string;
  agenda: string;
  minutes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface CreateMeetingInput {
  groupId: string;
  groupName: string;
  date: string;
  time: string;
  agenda: string;
  createdBy: string;
  createdByName: string;
}

export async function createMeeting(input: CreateMeetingInput): Promise<string> {
  const ref = await addDoc(collection(db, "meetings"), {
    ...input,
    agenda: input.agenda.trim(),
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getGroupMeetings(groupId: string): Promise<Meeting[]> {
  const q = query(
    collection(db, "meetings"),
    where("groupId", "==", groupId),
    orderBy("date", "asc"),
    orderBy("time", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Meeting));
}

export async function getUpcomingMeetings(groupId: string): Promise<Meeting[]> {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "meetings"),
    where("groupId", "==", groupId),
    where("date", ">=", today),
    orderBy("date", "asc"),
    orderBy("time", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Meeting));
}
