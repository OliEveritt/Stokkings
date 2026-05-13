import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { notificationRepository } from "@/repositories/notification.repository";

/**
 * GET /api/notifications
 * UAT 3: Returns all notifications for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(token);

    const notifications = await notificationRepository.getForUser(decoded.uid);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[notifications GET] error:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * UAT 4: Mark one or all notifications as read.
 * Body: { notificationId?: string } — omit to mark all as read.
 */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const { notificationId } = body;

    if (notificationId) {
      await notificationRepository.markAsRead(notificationId);
    } else {
      await notificationRepository.markAllAsRead(decoded.uid);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notifications PATCH] error:", err);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}