import { NextRequest, NextResponse } from "next/server";
import { adminAuth, getAdminDb } from "@/lib/firebase-admin";
import { generateInviteCode } from "@/lib/invite-code";

const INVITE_TTL_DAYS = 7;
const MAX_COLLISION_RETRIES = 5;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { groupId } = await req.json();
    if (!groupId || typeof groupId !== "string") {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    const db = getAdminDb();

    const memberSnap = await db.doc(`groups/${groupId}/group_members/${uid}`).get();
    if (!memberSnap.exists || memberSnap.data()?.role !== "Admin") {
      return NextResponse.json(
        { error: "Only group admins can generate invite codes" },
        { status: 403 }
      );
    }

    const groupSnap = await db.doc(`groups/${groupId}`).get();
    if (!groupSnap.exists) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    let code: string | null = null;
    for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
      const candidate = generateInviteCode();
      const existing = await db.doc(`invitations/${candidate}`).get();
      if (!existing.exists) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return NextResponse.json(
        { error: "Failed to generate a unique code, please retry" },
        { status: 500 }
      );
    }

    const now = Date.now();
    const expiresAt = new Date(now + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await db.doc(`invitations/${code}`).set({
      code,
      groupId,
      groupName: groupSnap.data()?.group_name || groupSnap.data()?.name || null,
      createdBy: uid,
      createdAt: new Date(),
      expiresAt,
      status: "pending",
    });

    return NextResponse.json({
      code,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[invites/generate] error:", err);
    return NextResponse.json({ error: "Failed to generate invite code" }, { status: 500 });
  }
}
