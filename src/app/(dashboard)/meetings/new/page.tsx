"use client";

import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { ScheduleMeetingForm } from "@/components/forms/ScheduleMeetingForm";

export default function NewMeetingPage() {
  const { user, loading } = useFirebaseAuth();

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  const canSchedule = user?.role === "Treasurer" || user?.role === "Admin";

  if (!canSchedule) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-600 text-lg font-bold mb-2">Access Denied</div>
          <p className="text-gray-600">Only Treasurers and Admins can schedule meetings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Schedule Meeting</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new meeting for your stokvel group.</p>
      </div>
      <ScheduleMeetingForm />
    </div>
  );
}
