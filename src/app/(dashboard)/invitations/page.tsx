<<<<<<< HEAD
import { redirect } from "next/navigation";

export default function InvitationsRedirect() {
  // Change this from "/dashboard" to your dynamic invite path
  redirect("/groups/TestGroup/invite");
=======
"use client";

import { InviteMemberForm } from "@/app/(auth)/invite/InviteForm";
import PendingInvites from "@/app/(auth)/invite/PendingInvites";
import { useAuth } from "@/hooks/useAuth"; 
import { useParams } from "next/navigation";

export default function InvitationsPage() {
  const { user, loading } = useAuth();
  const params = useParams();

  // In Next.js, if your route is /dashboard/groups/[groupId]/invitations
  // then params.groupId will be available. 
  // If you aren't using dynamic routes yet, you might need a different way to get the ID.
  const groupId = params?.groupId as string || "default_group_id"; 
  const adminId = user?.uid;

  if (loading) {
    return <div className="p-6 font-medium text-gray-400 animate-pulse">Authenticating...</div>;
  }

  if (!adminId) {
    return <div className="p-6 text-red-500 font-bold">Error: You must be logged in to view this page.</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invitations</h1>
        <p className="text-sm text-gray-500">Securely onboard new members.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Invite New Member</h2>
          <InviteMemberForm groupId={groupId} adminId={adminId} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Pending Audit Trail</h2>
          <PendingInvites groupId={groupId} />
        </div>
      </div>
    </div>
  );
>>>>>>> 10-us-26-view-and-manage-payout-schedule
}