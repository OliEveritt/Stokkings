"use client";

import { Menu, User as UserIcon, LogOut, ChevronDown, Building2 } from "lucide-react";
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
  roleOverride: Role;
  mandates: Mandate[];
  onMandateSwitch: (groupId: number) => void;
  onRoleChange: (role: Role) => void;
  onOpenMobileSidebar: () => void;
}

export default function Header({ 
  user, 
  groupName, 
  activeLabel, 
  onOpenMobileSidebar,
}: HeaderProps) {
  const { logout } = useFirebaseAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const isConfirmed = window.confirm("Are you sure you want to sign out?");
    if (isConfirmed) {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 shadow-sm relative z-30">
      <div className="flex items-center gap-4">
        <button onClick={onOpenMobileSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
          <Menu size={20} />
        </button>
        
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-gray-800">{activeLabel}</h1>
          <p className="text-xs text-gray-500">{groupName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
        
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <UserIcon size={16} className="text-emerald-600" />
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400 hidden md:block" />
        </div>
      </div>
    </header>
  );
}
