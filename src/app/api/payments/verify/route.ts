/**
 * After Stripe redirects back, this endpoint flips the contribution to "confirmed"
 * and advances the payout schedule (current contributor moves to last position).
 *
 * Security note: still doesn't verify with Stripe that payment actually succeeded.
 * For production, add a Stripe webhook (payment_intent.succeeded) and have it write
 * to Firestore using the admin SDK; remove this success-page-driven flip.
 */

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const contributionId = req.nextUrl.searchParams.get("contributionId");
    if (!contributionId) {
      return NextResponse.json({ error: "Missing contributionId" }, { status: 400 });
    }

    const db = getAdminDb();
    const contribRef = db.doc(`contributions/${contributionId}`);
    const contribSnap = await contribRef.get();
    if (!contribSnap.exists) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }
    const contribution = contribSnap.data()!;
    if (contribution.userId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const groupId: string | undefined = contribution.groupId;

    // Mark contribution confirmed.
    await contribRef.update({
      status: "confirmed",
      paymentIntentId: `stripe_${Date.now()}`,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Advance the payout schedule: if the caller is the current position-1
    // contributor, mark their slot paid and rotate them to the bottom of the
    // schedule. Everyone above them shifts up by one. If all members were
    // already "paid" before this rotation, that means the cycle just closed —
    // reset the rest back to "scheduled" and bump cycleNumber.
    let advanced = false;
    let newCycle: number | null = null;
    if (groupId) {
      const scheduleSnap = await db
        .collection("payout_schedules")
        .where("groupId", "==", groupId)
        .orderBy("position", "asc")
        .get();

      if (!scheduleSnap.empty) {
        const docs = scheduleSnap.docs;
        const head = docs[0];
        const headData = head.data();
        if (headData.userId === uid) {
          const total = docs.length;
          const cycleClosed = docs.every((d) => d.data().status === "paid");
          const currentCycle = (headData.cycleNumber as number | undefined) ?? 1;
          newCycle = cycleClosed ? currentCycle + 1 : currentCycle;

          const batch = db.batch();
          batch.update(head.ref, {
            position: total,
            status: "paid",
            cycleNumber: newCycle,
            paidAt: FieldValue.serverTimestamp(),
            paidContributionId: contributionId,
          });
          for (let i = 1; i < total; i++) {
            const update: Record<string, unknown> = { position: i };
            if (cycleClosed) {
              update.status = "scheduled";
              update.cycleNumber = newCycle;
              update.paidAt = null;
              update.paidContributionId = null;
            }
            batch.update(docs[i].ref, update);
          }
          await batch.commit();
          advanced = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: "confirmed",
      advanced,
      cycleNumber: newCycle,
    });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[payments/verify] error:", err);
    return NextResponse.json(
      { error: e.message ?? "Verification failed" },
      { status: 500 }
    );
  }
}
