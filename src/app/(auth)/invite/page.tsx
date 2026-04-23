import InviteForm from "./InviteForm";
import PendingInvites from "./PendingInvites";
import { Users, ShieldCheck } from "lucide-react";

export default function AdminInviteDashboard() {
  // Hardcoded for Sprint 2 MVP - in Sprint 3 these will come from your Auth session
  const mockGroupId = "stokvel_alpha_2026"; 
  const mockAdminId = "admin_aubre_01";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Users className="text-emerald-600" size={28} /> 
              Member Onboarding
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage invitations and grow your savings circle</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full text-emerald-700 text-xs font-bold">
            <ShieldCheck size={14} /> Admin Access
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: The Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Send Invitation</h2>
              <InviteForm groupId={mockGroupId} adminId={mockAdminId} />
              
              <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  <strong>Pro Tip:</strong> Invitation links are valid for 7 days. Once a member joins, they will appear in your main member roster.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: The Real-time List */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Audit Trail</h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm min-h-[300px]">
              <PendingInvites groupId={mockGroupId} />
              
              {/* Empty State Illustration logic is handled inside PendingInvites, 
                  but we can add a footer here */}
              <p className="text-center text-[10px] text-gray-300 mt-8 border-t pt-4 italic">
                Secure Invitation System v1.2 — Firestore Backend
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}