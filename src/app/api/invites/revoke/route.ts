import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const inviteRef = db.doc(`invitations/${code}`);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    const invite = inviteSnap.data()!;

    const memberSnap = await db
      .doc(`groups/${invite.groupId}/group_members/${uid}`)
      .get();
    if (!memberSnap.exists || memberSnap.data()?.role !== "Admin") {
      return NextResponse.json(
        { error: "Only group admins can revoke invite codes" },
        { status: 403 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot revoke an invite with status ${invite.status}` },
        { status: 409 }
      );
    }

    await inviteRef.update({
      status: "revoked",
      revokedBy: uid,
      revokedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[invites/revoke] error:", err);
    return NextResponse.json({ error: "Failed to revoke invite" }, { status: 500 });
  }
}
