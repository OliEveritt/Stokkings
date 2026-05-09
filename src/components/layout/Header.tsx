"use client";

import { Menu, User as UserIcon, LogOut, ChevronDown, Building2, Bell } from "lucide-react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRouter } from "next/navigation";
import type { User, Notification, Role } from "@/types";

interface Mandate {
  group_id: number;
  group_name: string;
  role_name: string;
}

interface HeaderProps {
  user: User & { group_id?: number };
  groupName: string;
  activeLabel: string;
  notifications: Notification[];
  roleOverride?: Role;
  mandates?: Mandate[];
  onMandateSwitch?: (groupId: number) => void;
  onRoleChange?: (role: Role) => void;
  onOpenMobileSidebar: () => void;
}

/**
 * Banking-Grade Header Component for Stokkings
 * Implements UAT-1 (Secure Exit) via the logout handshake.
 */
export default function Header({ 
  user, 
  groupName, 
  activeLabel, 
  onOpenMobileSidebar,
  notifications = [],
}: HeaderProps) {
  const { logout } = useFirebaseAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const isConfirmed = window.confirm("Are you sure you want to sign out of Stokkings?");
    if (isConfirmed) {
      try {
        await logout();
        
        // Clear local security artifacts
        localStorage.clear();
        sessionStorage.clear();
        
        // Force hard redirect to clear memory-cached session data
        window.location.href = "/login";
      } catch (error) {
        console.error("Secure Exit Failure:", error);
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 shadow-sm relative z-30 font-sans">
      {/* Left Section: Branding & Context */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenMobileSidebar} 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
        
        <div className="hidden lg:block border-l-4 border-emerald-500 pl-4">
          <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
            {activeLabel}
          </h1>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
            {groupName}
          </p>
        </div>
      </div>

      {/* Right Section: User Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-5">
        {/* Notifications (Placeholder for Banking Alerts) */}
        <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all relative">
          <Bell size={18} />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>

        {/* Secure Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-tighter"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Secure Exit</span>
        </button>
        
        {/* User Identity Handshake */}
        <div className="flex items-center gap-3 pl-5 border-l border-gray-100 py-1">
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-gray-900 leading-none">
              {user.name}
            </p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {user.role}
            </p>
          </div>
          
          <div className="relative group cursor-pointer">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:scale-105 transition-transform">
              <UserIcon size={18} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" title="Online" />
          </div>
          
          <ChevronDown size={14} className="text-gray-300 hidden md:block" />
        </div>
      </div>
    </header>
  );
}