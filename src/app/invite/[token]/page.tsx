import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import InviteAcceptPageClient from "./InviteAcceptPageClient";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  // 1. Await params for Next.js 15 compatibility
  const { token } = await params; 

  /**
   * 2. FIX: Query by the 'token' field instead of .doc(token)
   * Based on image_0bc496.png, the UUID is stored as a field value.
   */
  const inviteQuery = await adminDb.collection("invitations")
    .where("token", "==", token)
    .limit(1)
    .get();

  // 3. Check if the query returned a result
  if (inviteQuery.empty) {
    notFound(); 
  }

  const inviteDoc = inviteQuery.docs[0];
  const inviteData = inviteDoc.data();

  // UAT-4 Enforcement: Verify invitation link is still pending.
  if (inviteData.status !== "pending") {
    return <InviteAcceptPageClient token={token} initialError="This invitation link has already been used." />;
  }

  // Robust Date Check: Handles Firestore Timestamp serialization for SSR.
  const expiresAtValue = inviteData.expiresAt;
  const expiresAt = expiresAtValue?.toDate 
    ? expiresAtValue.toDate() 
    : new Date(expiresAtValue);

  if (expiresAt < new Date()) {
    return <InviteAcceptPageClient token={token} initialError="This invitation link has expired." />;
  }

  // 4. Use the groupId from the found document to resolve the Group Name
  const groupSnap = await adminDb.collection("groups").doc(inviteData.groupId).get();
  const groupName = groupSnap.data()?.group_name || "Stokvel Group";

  return (
    <InviteAcceptPageClient 
      token={token} 
      initialInviteInfo={{ email: inviteData.email, groupName }} 
    />
  );
}