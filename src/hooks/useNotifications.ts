"use client";

import { useState, useEffect, useCallback } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { auth } from "@/lib/firebase";

export interface Notification {
  id: string;
  type: "meeting_scheduled" | "meeting_updated";
  message: string;
  meetingId: string;
  groupId: string;
  read: boolean;
  createdAt: { seconds: number };
}

export function useNotifications() {
  const { user } = useFirebaseAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId?: string) => {
    if (!user) return;
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationId ? { notificationId } : {}),
      });
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead };
}