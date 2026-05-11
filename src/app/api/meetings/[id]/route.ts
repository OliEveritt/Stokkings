import { NextRequest, NextResponse } from "next/server";
import { adminAuth, getAdminDb } from "@/lib/firebase-admin";

/**
 * Resolves the caller's role for a given group.
 * Matches the exact same pattern used in /api/meetings/route.ts.
 */
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

function canEditMinutes(topLevelRole: string, groupRole: string | null): boolean {
  const elevated = ["Treasurer", "Admin", "treasurer", "admin"];
  return elevated.includes(topLevelRole) || elevated.includes(groupRole ?? "");
}

/**
 * GET /api/meetings/[id]
 * Returns a single meeting document by ID.
 * Accessible by all authenticated users.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    const db = getAdminDb();
    const meetingSnap = await db.doc(`meetings/${params.id}`).get();

    if (!meetingSnap.exists) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ id: meetingSnap.id, ...meetingSnap.data() });
  } catch (error) {
    console.error("[meetings/[id] GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch meeting" }, { status: 500 });
  }
}

/**
 * PUT /api/meetings/[id]
 * Updates the minutes field of a meeting.
 * Only Treasurer or Admin of the group may update minutes.
 *
 * Body: { minutes: string, groupId: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const { minutes, groupId } = body;

    if (typeof minutes !== "string") {
      return NextResponse.json({ error: "minutes must be a string" }, { status: 400 });
    }
    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    // Role check — same pattern as /api/meetings/route.ts
    const { topLevelRole, groupRole } = await getCallerRole(decoded.uid, groupId);
    if (!canEditMinutes(topLevelRole, groupRole)) {
      return NextResponse.json(
        { error: "Only a Treasurer or Admin can edit meeting minutes" },
        { status: 403 }
      );
    }

    const db = getAdminDb();
    const meetingRef = db.doc(`meetings/${params.id}`);
    const meetingSnap = await meetingRef.get();

    if (!meetingSnap.exists) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await meetingRef.update({
      minutes,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, minutes });
  } catch (error) {
    console.error("[meetings/[id] PUT] Error:", error);
    return NextResponse.json({ error: "Failed to update minutes" }, { status: 500 });
  }
}