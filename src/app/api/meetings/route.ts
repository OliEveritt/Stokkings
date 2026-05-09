import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, getAdminDb } from "@/lib/firebase-admin";
import { combineDateTime, validateMeetingInput } from "@/validators/meeting.validator";

async function getCallerRole(uid: string, groupId: string) {
  const db = getAdminDb();
  const [userSnap, memberSnap] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`groups/${groupId}/group_members/${uid}`).get(),
  ]);
  return {
    topLevelRole: (userSnap.data()?.role as string) ?? "Member",
    groupRole: (memberSnap.data()?.role as string) ?? null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const validation = validateMeetingInput(body);
    if (!validation.ok) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: validation.errors },
        { status: 400 }
      );
    }

    const { groupId, date, time, agenda } = body as Required<{
      groupId: string;
      date: string;
      time: string;
      agenda: string;
    }>;

    const { topLevelRole, groupRole } = await getCallerRole(uid, groupId);
    const allowed =
      topLevelRole === "Admin" ||
      topLevelRole === "Treasurer" ||
      groupRole === "Admin" ||
      groupRole === "Treasurer";
    if (!allowed) {
      return NextResponse.json(
        { error: "Only group admins or treasurers can schedule meetings" },
        { status: 403 }
      );
    }

    const db = getAdminDb();
    const groupSnap = await db.doc(`groups/${groupId}`).get();
    if (!groupSnap.exists) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const scheduledAt = combineDateTime(date, time);
    const userSnap = await db.doc(`users/${uid}`).get();
    const createdByName =
      (userSnap.data()?.name as string) || (userSnap.data()?.email as string) || "Unknown";

    const ref = await db.collection("meetings").add({
      groupId,
      groupName: groupSnap.data()?.group_name ?? null,
      date,
      time,
      scheduledAt: scheduledAt.toISOString(),
      agenda: agenda.trim(),
      minutes: null,
      status: "scheduled",
      createdBy: uid,
      createdByName,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id });
  } catch (err) {
    console.error("[meetings POST] error:", err);
    return NextResponse.json({ error: "Failed to schedule meeting" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const groupId = req.nextUrl.searchParams.get("groupId");
    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }
    const db = getAdminDb();
    const snap = await db
      .collection("meetings")
      .where("groupId", "==", groupId)
      .orderBy("scheduledAt", "desc")
      .get();
    const meetings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ meetings });
  } catch (err) {
    console.error("[meetings GET] error:", err);
    return NextResponse.json({ error: "Failed to load meetings" }, { status: 500 });
  }
}
