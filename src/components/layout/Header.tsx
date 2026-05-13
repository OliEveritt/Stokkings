/**
 * US-3.6: Edit Profile Information
 * Header component with dropdown menu containing Edit Profile option
 */

"use client";

import { useState } from "react";
import { Menu, User as UserIcon, LogOut, ChevronDown, UserCircle } from "lucide-react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useRouter } from "next/navigation";
import type { User, Notification, Role } from "@/types";
import EditProfileModal from "@/components/profile/EditProfileModal";

interface Mandate {
  group_id: number;
  group_name: string;
  role_name: string;
}

interface HeaderProps {
  user: User & { group_id?: number };
  groupName: string;
  activeLabel: string;
  notifications?: Notification[];
  roleOverride?: Role;
  mandates?: Mandate[];
  onMandateSwitch?: (groupId: number) => void;
  onRoleChange?: (role: Role) => void;
  onOpenMobileSidebar: () => void;
}

export default function Header({ 
  user, 
  groupName, 
  activeLabel, 
  onOpenMobileSidebar,
}: HeaderProps) {
  const { logout, refreshUser } = useFirebaseAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    const isConfirmed = window.confirm("Are you sure you want to sign out?");
    if (isConfirmed) {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    setIsEditModalOpen(true);
  };

  const handleProfileUpdated = async () => {
    // Refresh the user context and then reload the page to update UI
    await refreshUser();
    // Optional: reload the page to ensure all components reflect new data
    // window.location.reload();
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Close dropdown when clicking outside (handled by blur)
  const handleDropdownBlur = (e: React.FocusEvent) => {
    // Don't close if clicking inside the dropdown
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDropdownOpen(false);
    }
  };

  return (
    <>
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
          
          <div className="relative" onBlur={handleDropdownBlur}>
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 pl-2 border-l border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserIcon size={16} className="text-emerald-600" />
              </div>
              <div className="hidden md:block text-sm text-left">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <ChevronDown size={14} className={`text-gray-400 hidden md:block transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle size={16} />
                  Edit Profile
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  );
}
