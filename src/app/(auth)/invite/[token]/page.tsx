import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { redirect } from "next/navigation";
import { ShieldCheck, UserPlus } from "lucide-react";

export default async function InviteAcceptPage({ params }: { params: { token: string } }) {
  const { token } = await params;
  
  // 1. Fetch Invitation Data
  const inviteRef = doc(db, "invitations", token);
  const inviteSnap = await getDoc(inviteRef);

  // UAT 4 Check: Validation
  if (!inviteSnap.exists()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-2xl shadow-sm border border-red-100 text-center">
          <h1 className="text-red-600 font-bold">Invalid Link</h1>
          <p className="text-sm text-gray-500">This invitation does not exist.</p>
        </div>
      </div>
    );
  }

  const inviteData = inviteSnap.data();

  // UAT 4 Check: Already Claimed
  if (inviteData.status === "claimed") {
    redirect("/login?message=AlreadyJoined");
  }

  /**
   * UAT 2 Logic: The Onboarding Action
   */
  async function acceptInvitation() {
    "use server";

    // A. Update invitation status to claimed (UAT 4 protection)
    await updateDoc(inviteRef, {
      status: "claimed",
      claimedAt: serverTimestamp()
    });

    // B. Add user to the members collection (UAT 2 onboarding)
    await addDoc(collection(db, "group_members"), {
      groupId: inviteData.groupId,
      email: inviteData.email,
      role: "member",
      joinedAt: serverTimestamp(),
      contributionBalance: 0 // Initialize financial standing
    });

    // C. Finalize Onboarding
    redirect("/dashboard?welcome=true");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <UserPlus className="text-emerald-600" size={32} />
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2">Join the Circle</h1>
        <p className="text-gray-500 text-sm mb-8">
          You&apos;ve been invited to join as <br/>
          <span className="font-bold text-gray-800">{inviteData.email}</span>
        </p>

        <form action={acceptInvitation}>
          <button className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <ShieldCheck size={20} /> Accept & Join Group
          </button>
        </form>

        <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          Secure Onboarding v1.2
        </p>
      </div>
    </div>
  );
}