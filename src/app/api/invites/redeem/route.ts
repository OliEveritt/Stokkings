import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, getAdminDb } from "@/lib/firebase-admin";
import { INVITE_CODE_REGEX, normalizeInviteCode } from "@/lib/invite-code";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email ?? null;

    const body = await req.json();
    const rawCode = typeof body?.code === "string" ? body.code : "";
    const code = normalizeInviteCode(rawCode);
    if (!INVITE_CODE_REGEX.test(code)) {
      return NextResponse.json({ error: "Invalid invite code format" }, { status: 400 });
    }

    const db = getAdminDb();
    const inviteRef = db.doc(`invitations/${code}`);

    const result = await db.runTransaction(async (tx) => {
      const inviteSnap = await tx.get(inviteRef);
      if (!inviteSnap.exists) {
        return { error: "Invite code not found", status: 404 } as const;
      }
      const invite = inviteSnap.data()!;
      if (invite.status !== "pending") {
        return {
          error: `This code has already been ${invite.status}`,
          status: 410,
        } as const;
      }
      const expiresAt = invite.expiresAt?.toDate?.() ?? new Date(invite.expiresAt);
      if (expiresAt.getTime() < Date.now()) {
        return { error: "This code has expired", status: 410 } as const;
      }

      const groupId: string = invite.groupId;
      const memberRef = db.doc(`groups/${groupId}/group_members/${uid}`);
      const groupRef = db.doc(`groups/${groupId}`);
      const memberSnap = await tx.get(memberRef);
      if (memberSnap.exists) {
        return { error: "You are already a member of this group", status: 409 } as const;
      }

      tx.set(memberRef, {
        userId: uid,
        email,
        role: "Member",
        status: "active",
        joinedAt: FieldValue.serverTimestamp(),
        joinedViaCode: code,
      });
      tx.update(groupRef, {
        members: FieldValue.arrayUnion(uid),
      });
      tx.update(inviteRef, {
        status: "accepted",
        acceptedBy: uid,
        acceptedAt: FieldValue.serverTimestamp(),
      });

      return { ok: true, groupId } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ groupId: result.groupId });
  } catch (err) {
    console.error("[invites/redeem] error:", err);
    return NextResponse.json({ error: "Failed to redeem invite code" }, { status: 500 });
  }
}
